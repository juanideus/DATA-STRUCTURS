import test from 'node:test';
import assert from 'node:assert/strict';
import { assertProxyConfiguration } from '../src/configuration.js';

test('una instalación directa no confía en proxies de forma implícita', () => {
  assert.doesNotThrow(() => assertProxyConfiguration({ NODE_ENV: 'production' }));
});

test('Railway producción exige un contrato explícito de ingress antes de arrancar', () => {
  assert.throws(() => assertProxyConfiguration({ NODE_ENV: 'production', RAILWAY_PROJECT_ID: 'test-project' }), /TRUSTED_PROXY_CIDRS/);
  assert.doesNotThrow(() => assertProxyConfiguration({ NODE_ENV: 'production', RAILWAY_PROJECT_ID: 'test-project', TRUSTED_PROXY_CIDRS: '192.0.2.8/32' }));
});

test('configuración de proxies parcialmente inválida no se acepta', () => {
  for (const cidrs of ['192.0.2.8/32,invalid', '0.0.0.0/33', '::/129']) {
    assert.throws(() => assertProxyConfiguration({ TRUSTED_PROXY_CIDRS: cidrs }), /CIDR/);
  }
});
