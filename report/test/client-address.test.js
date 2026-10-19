import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalIp, clientAddress, parseTrustedProxyCidrs } from '../src/client-address.js';

const trusted = { TRUSTED_PROXY_CIDRS: '192.0.2.0/24,2001:db8:abcd::/48' };
const request = (headers = {}, peer = '192.0.2.10') => ({ headers, socket: { remoteAddress: peer } });

test('canonicalizes IPv6 case, compression and IPv4-mapped addresses', () => {
  for (const address of ['2001:DB8::ABCD', '2001:0db8:0:0:0:0:0:abcd', '2001:db8::abcd']) {
    assert.equal(canonicalIp(address), '2001:db8::abcd');
  }
  for (const address of ['::ffff:192.0.2.42', '::FFFF:C000:022A', '0:0:0:0:0:ffff:c000:22a']) {
    assert.equal(canonicalIp(address), '192.0.2.42');
  }
  assert.equal(canonicalIp(' 203.0.113.8 '), '203.0.113.8');
});

test('rejects ambiguous single-address values rather than taking a first entry', () => {
  for (const address of [undefined, null, 123, ['203.0.113.1'], '203.0.113.1, 203.0.113.2',
    '203.0.113.1:443', '[2001:db8::1]', 'fe80::1%eth0', 'not-an-ip', '']) {
    assert.equal(canonicalIp(address), null);
  }
});

test('unconfigured and untrusted peers cannot supply client identity headers', () => {
  const headers = { 'x-real-ip': '173.245.48.12', 'cf-connecting-ip': '203.0.113.99' };
  assert.equal(clientAddress(request(headers), {}), '192.0.2.10');
  assert.equal(clientAddress(request(headers, '198.51.100.10'), trusted), '198.51.100.10');
  for (const peer of ['10.0.0.1', '172.16.0.1', '192.168.1.1', '127.0.0.1', '::1']) {
    assert.equal(clientAddress(request(headers, peer), {}), canonicalIp(peer));
  }
});

test('trusted ingress accepts only a single valid overwritten X-Real-IP', () => {
  assert.equal(clientAddress(request({ 'x-real-ip': '203.0.113.8' }), trusted), '203.0.113.8');
  assert.equal(clientAddress(request({ 'x-real-ip': '2001:DB8::ABCD' }, '2001:db8:abcd::10'), trusted), '2001:db8::abcd');
  assert.equal(clientAddress(request({ 'x-forwarded-for': '203.0.113.8' }), trusted), '192.0.2.10');
  for (const address of [undefined, ['203.0.113.8'], '203.0.113.8,198.51.100.1', 'garbage']) {
    assert.equal(clientAddress(request({ 'x-real-ip': address, 'cf-connecting-ip': '203.0.113.99' }), trusted), '192.0.2.10');
  }
});

test('CF-Connecting-IP requires both a trusted ingress and a Cloudflare client hop', () => {
  assert.equal(clientAddress(request({ 'x-real-ip': '173.245.48.12', 'cf-connecting-ip': '203.0.113.99' }), trusted), '203.0.113.99');
  assert.equal(clientAddress(request({ 'x-real-ip': '2606:4700::1000', 'cf-connecting-ip': '2001:DB8::ABCD' }), trusted), '2001:db8::abcd');
  assert.equal(clientAddress(request({ 'x-real-ip': '198.51.100.10', 'cf-connecting-ip': '203.0.113.99' }), trusted), '198.51.100.10');
  for (const address of [['203.0.113.99'], '203.0.113.99,198.51.100.1', 'garbage']) {
    assert.equal(clientAddress(request({ 'x-real-ip': '173.245.48.12', 'cf-connecting-ip': address }), trusted), '173.245.48.12');
  }
});

test('IPv4-mapped sockets, proxy ranges and Cloudflare hops use the same IPv4 identity', () => {
  const mapped = { TRUSTED_PROXY_CIDRS: '::ffff:192.0.2.0/120' };
  assert.equal(clientAddress(request({ 'x-real-ip': '::ffff:203.0.113.8' }, '::ffff:192.0.2.10'), mapped), '203.0.113.8');
  assert.equal(clientAddress(request({ 'x-real-ip': '::ffff:173.245.48.12', 'cf-connecting-ip': '::ffff:203.0.113.99' }), trusted), '203.0.113.99');
  assert.equal(clientAddress(request({ 'x-real-ip': '203.0.113.8' }, '192.0.2.10'), mapped), '203.0.113.8');
  assert.equal(clientAddress(request({ 'x-real-ip': '203.0.113.8' }, '192.0.3.10'), mapped), '192.0.3.10');
});

test('malformed proxy configuration fails closed as a whole', () => {
  const invalid = [null, [], ['192.0.2.0/24'], ' ', '192.0.2.0', '192.0.2.0/33',
    '2001:db8::/129', '192.0.2.0/024', '192.0.2.0/24,', ',192.0.2.0/24',
    '192.0.2.0/24,,198.51.100.0/24', '192.0.2.0/24,broken', 'fe80::%eth0/64',
    '::ffff:192.0.2.0/95', '192.0.2.0/24/1'];
  for (const value of invalid) {
    assert.equal(parseTrustedProxyCidrs(value), null);
    assert.equal(clientAddress(request({ 'x-real-ip': '203.0.113.8' }), { TRUSTED_PROXY_CIDRS: value }), '192.0.2.10');
  }
  assert.deepEqual(parseTrustedProxyCidrs(undefined), []);
  assert.deepEqual(parseTrustedProxyCidrs(''), []);
});

test('unknown sockets never authorize headers, and trust changes do not retain an old allowlist', () => {
  assert.equal(clientAddress({ headers: { 'x-real-ip': '203.0.113.8' } }, trusted), 'unknown');
  const input = request({ 'x-real-ip': '203.0.113.8' });
  assert.equal(clientAddress(input, trusted), '203.0.113.8');
  assert.equal(clientAddress(input, {}), '192.0.2.10');
  assert.equal(clientAddress(input, trusted), '203.0.113.8');
  assert.equal(clientAddress(input, { TRUSTED_PROXY_CIDRS: 'broken' }), '192.0.2.10');
});
