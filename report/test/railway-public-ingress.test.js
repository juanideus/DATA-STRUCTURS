import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { assertProxyConfiguration } from '../src/configuration.js';

// This fixture models Railway's public HTTP edge after it has overwritten
// X-Real-IP. It does not prove the origin of a request on Railway's private mesh.
// All requests stay on loopback, and no Turnstile or mail provider is contacted.
process.env.NODE_ENV = 'test';
delete process.env.TRUSTED_PROXY_CIDRS;
delete process.env.CLIENT_IP_SOURCE;
for (const name of ['RESEND_API_KEY', 'REPORT_EMAIL', 'REPORT_FROM', 'TURNSTILE_SECRET_KEY']) delete process.env[name];

const originalFetch = globalThis.fetch;
let providerCalls = 0;
globalThis.fetch = async () => {
  providerCalls += 1;
  throw new Error('This loopback-only suite must never contact an external provider');
};

const { server } = await import('../src/server.js');
const railwayEnvironment = {
  NODE_ENV: 'production',
  CLIENT_IP_SOURCE: 'railway-public',
  RAILWAY_PROJECT_ID: 'test-project',
  RAILWAY_SERVICE_ID: 'test-service',
  RAILWAY_DEPLOYMENT_ID: 'test-deployment',
};
let port;

before(async () => {
  Object.assign(process.env, railwayEnvironment);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  port = server.address().port;
});

after(async () => {
  await new Promise(resolve => server.close(resolve));
  globalThis.fetch = originalFetch;
  assert.equal(providerCalls, 0, 'Ingress validation must not call Turnstile or Resend');
});

const send = (headerPairs = [], path = '/api/report', method = 'POST') => new Promise((resolve, reject) => {
  const body = method === 'POST' ? '{}' : '';
  const outgoing = request({
    hostname: '127.0.0.1',
    port,
    path,
    method,
    // Raw pairs preserve repeated header lines for the ambiguity regression.
    headers: [
      'Host', `127.0.0.1:${port}`,
      'Origin', 'https://www.dsalab.dev',
      'Content-Type', 'application/json',
      'Content-Length', String(Buffer.byteLength(body)),
      'Connection', 'close',
      ...headerPairs,
    ],
  }, response => {
    let responseBody = '';
    response.setEncoding('utf8');
    response.on('data', chunk => { responseBody += chunk; });
    response.once('error', reject);
    response.once('end', () => {
      try {
        resolve({ status: response.statusCode, headers: response.headers, body: JSON.parse(responseBody) });
      } catch {
        reject(new Error(`Expected a JSON response, received HTTP ${response.statusCode}`));
      }
    });
  });
  outgoing.once('error', reject);
  outgoing.setTimeout(5_000, () => outgoing.destroy(new Error('Loopback ingress response timed out')));
  outgoing.end(body);
});

const postAs = (address, otherHeaders = []) => send(['X-Real-IP', address, ...otherHeaders]);

test('Railway public mode requires explicit production context and disallows ambiguous configuration', () => {
  assert.doesNotThrow(() => assertProxyConfiguration(railwayEnvironment));
  for (const key of ['RAILWAY_PROJECT_ID', 'RAILWAY_SERVICE_ID', 'RAILWAY_DEPLOYMENT_ID']) {
    assert.throws(() => assertProxyConfiguration({ ...railwayEnvironment, [key]: '' }));
    assert.throws(() => assertProxyConfiguration({ ...railwayEnvironment, [key]: '  ' }));
  }
  assert.throws(() => assertProxyConfiguration({ ...railwayEnvironment, NODE_ENV: 'development' }));
  assert.throws(() => assertProxyConfiguration({ ...railwayEnvironment, CLIENT_IP_SOURCE: 'railway-pubic' }));
  assert.throws(() => assertProxyConfiguration({ ...railwayEnvironment, TRUSTED_PROXY_CIDRS: '127.0.0.1/32' }));
  for (const key of ['RAILWAY_TCP_PROXY_DOMAIN', 'RAILWAY_TCP_APPLICATION_PORT']) {
    assert.throws(() => assertProxyConfiguration({ ...railwayEnvironment, [key]: 'configured' }), /TCP proxy/);
  }
  assert.throws(() => assertProxyConfiguration({ CLIENT_IP_SOURCE: 'socket', TRUSTED_PROXY_CIDRS: '127.0.0.1/32' }));
  assert.throws(() => assertProxyConfiguration({ CLIENT_IP_SOURCE: 'trusted-proxy' }));
});

test('two edge-resolved clients receive separate quotas instead of sharing the loopback ingress quota', async () => {
  for (const address of ['192.0.2.21', '192.0.2.22']) {
    const statuses = [];
    for (let attempt = 0; attempt < 6; attempt += 1) statuses.push((await postAs(address)).status);
    assert.deepEqual(statuses, [422, 422, 422, 422, 422, 429]);
  }
});

test('equivalent IPv6 spellings retain the same Railway public quota', async () => {
  const variants = [
    '2001:DB8::21',
    '2001:0db8:0:0:0:0:0:0021',
    '2001:db8::0021',
    '2001:db8:0:0:0:0:0:21',
    '2001:DB8:0000::21',
    '2001:db8::21',
  ];
  const statuses = [];
  for (const address of variants) statuses.push((await postAs(address)).status);
  assert.deepEqual(statuses, [422, 422, 422, 422, 422, 429]);
});

test('IPv4-mapped and plain IPv4 clients share the same Railway public quota', async () => {
  const variants = ['192.0.2.51', '::ffff:192.0.2.51', '::FFFF:C000:0233'];
  const statuses = [];
  for (let attempt = 0; attempt < 6; attempt += 1) {
    statuses.push((await postAs(variants[attempt % variants.length])).status);
  }
  assert.deepEqual(statuses, [422, 422, 422, 422, 422, 429]);
});

test('forged CF, XFF and Forwarded headers cannot rotate an edge-resolved identity', async () => {
  const statuses = [];
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await postAs('173.245.48.21', [
      'CF-Connecting-IP', `198.51.100.${attempt + 1}`,
      'X-Forwarded-For', `203.0.113.${attempt + 1}`,
      'Forwarded', `for=203.0.113.${attempt + 10}`,
    ]);
    statuses.push(response.status);
  }
  assert.deepEqual(statuses, [422, 422, 422, 422, 422, 429]);
});

test('missing, malformed, listed and repeated X-Real-IP fail before consuming a quota', async () => {
  const invalidHeaders = [
    [],
    ['X-Real-IP', 'not-an-ip'],
    ['X-Real-IP', '192.0.2.31, 192.0.2.32'],
    ['X-Real-IP', '192.0.2.31', 'X-Real-IP', '192.0.2.31'],
    ['X-Real-IP', '192.0.2.31', 'x-ReAl-Ip', '192.0.2.32'],
    ['X-Real-IP', '[2001:db8::31]'],
    ['X-Real-IP', '192.0.2.31:443'],
  ];
  // More than the global minute budget proves rejected identities do not debit
  // that budget. These are in-process loopback requests, never production traffic.
  for (let attempt = 0; attempt < 121; attempt += 1) {
    const response = await send(invalidHeaders[attempt % invalidHeaders.length]);
    assert.equal(response.status, 503);
    assert.equal(response.body.ok, false);
    assert.ok(!Object.hasOwn(response.headers, 'retry-after'));
    assert.doesNotMatch(JSON.stringify(response.body), /RAILWAY_|TRUSTED_PROXY|X-Real-IP|127\.0\.0\.1/);
  }
  assert.equal((await postAs('192.0.2.41')).status, 422);
  const health = await send([], '/health', 'GET');
  assert.equal(health.status, 200);
  assert.deepEqual(health.body, { ok: true, service: 'dsa-lab-report-api' });
});
