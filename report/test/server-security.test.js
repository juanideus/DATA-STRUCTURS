import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.TRUSTED_PROXY_CIDRS = '127.0.0.1/32';
for (const name of ['RESEND_API_KEY', 'REPORT_EMAIL', 'REPORT_FROM', 'TURNSTILE_SECRET_KEY']) delete process.env[name];

const originalFetch = globalThis.fetch;
globalThis.fetch = (url, options) => {
  assert.equal(new URL(url).hostname, '127.0.0.1', 'This suite must not contact external services');
  return originalFetch(url, options);
};
const { server } = await import('../src/server.js');
let base;
let address = 1;
before(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await new Promise(resolve => server.close(resolve));
  globalThis.fetch = originalFetch;
});

const post = (body, type = 'application/json', extra = {}) => fetch(`${base}/api/report`, {
  method: 'POST',
  headers: { Origin: 'https://www.dsalab.dev', 'Content-Type': type, 'X-Real-IP': `192.0.2.${address++}`, Connection: 'close', ...extra },
  body,
});

test('JSON con raíz incorrecta responde 400 y conserva la ruta de estado', async () => {
  for (const body of ['null', '[]', '1', 'true', '"texto"']) {
    const response = await post(body);
    assert.equal(response.status, 400);
    const result = await response.json();
    assert.ok(result.errors.body);
    assert.ok(!/TypeError|Cannot read|providerStatus/.test(JSON.stringify(result)));
  }
  const health = await fetch(`${base}/health`, { headers: { Connection: 'close' } });
  assert.equal(health.status, 200);
  await health.json();
});

test('objetos o tipos incorrectos en los campos responden 422 con error de campo', async () => {
  for (const value of [null, 1, false, [], {}, { toString: 'invalid' }]) {
    const response = await post(JSON.stringify({ name: value }));
    assert.equal(response.status, 422);
    assert.ok((await response.json()).errors.name);
  }
});

test('solo admite application/json, con parámetros opcionales', async () => {
  for (const type of ['application/jsonp', 'text/plain; other=application/json', 'text/application/json']) {
    const response = await post('{}', type);
    assert.equal(response.status, 415);
    await response.json();
  }
  const response = await post('{}', 'Application/JSON; charset=utf-8');
  assert.equal(response.status, 422);
  await response.json();
});

test('headers de identidad de un peer no confiable no evaden el límite', async () => {
  process.env.TRUSTED_PROXY_CIDRS = '';
  try {
    const statuses = [];
    for (let attempt = 0; attempt < 6; attempt++) {
      const response = await post('{}', 'application/json', { 'CF-Connecting-IP': `198.51.100.${attempt + 1}` });
      statuses.push(response.status);
      await response.json();
    }
    assert.deepEqual(statuses, [422, 422, 422, 422, 422, 429]);
  } finally {
    process.env.TRUSTED_PROXY_CIDRS = '127.0.0.1/32';
  }
});
