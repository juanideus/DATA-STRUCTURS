import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { formatSecretFindings, isInsideDirectory, scanSecretText, sensitivePathReason } from './secret-scanner.mjs';

// Synthetic strings are assembled at runtime. No real tokens or complete token-like fixtures are stored.
const synthetic = (prefix, length = 32) => prefix + 'A'.repeat(length);

for (const [name, value, expected] of [
  ['GitHub classic', synthetic(['gh', 'p_'].join('')), 'github-token'],
  ['GitHub fine-grained', synthetic(['github', '_pat_'].join('')), 'github-token'],
  ['Resend', synthetic(['re', '_'].join('')), 'resend-api-key'],
  ['provider', synthetic(['sk', '-'].join('')), 'provider-api-key'],
  ['AWS', synthetic(['AK', 'IA'].join(''), 16), 'aws-access-key'],
  ['private key', ['-----BEGIN ', 'RSA PRIVATE KEY-----'].join(''), 'private-key'],
  ['URL credentials', ['postgres://fixture:', 'not-a-real-password@localhost/db'].join(''), 'credentials-in-url'],
]) {
  test(`detects synthetic ${name} without returning its value`, () => {
    const findings = scanSecretText(`ordinary text\n${value}`);
    assert.ok(findings.some(finding => finding.rule === expected && finding.line === 2));
    assert.ok(!JSON.stringify(findings).includes(value));
    assert.ok(findings.every(finding => Object.keys(finding).sort().join(',') === 'line,rule'));
  });
}

test('detects a synthetic JWT', () => {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const value = [encode({ alg: 'HS256', typ: 'JWT' }), encode({ sub: 'synthetic-fixture-only' }), 'A'.repeat(32)].join('.');
  assert.ok(scanSecretText(value).some(finding => finding.rule === 'jwt'));
});

test('detects high-entropy literal secrets, but not env references or explicit placeholders', () => {
  const artificialValue = Array.from({ length: 32 }, (_, index) => String.fromCharCode(65 + index)).join('');
  assert.ok(scanSecretText(`CLIENT_SECRET = '${artificialValue}'`).some(finding => finding.rule === 'sensitive-literal-assignment'));
  for (const value of ["const secret = process.env.RESEND_API_KEY;", "RESEND_API_KEY=pon_tu_api_key_de_resend", "CLIENT_SECRET = 'your_service_secret_placeholder'", "const secret = 'test-secret';"]) {
    assert.deepEqual(scanSecretText(value), []);
  }
});

test('does not treat public service URLs or public Turnstile site-key names as credentials', () => {
  assert.deepEqual(scanSecretText('VITE_REPORT_API_URL=https://api.dsalab.dev\nVITE_TURNSTILE_SITE_KEY=\nTURNSTILE_HOSTNAMES=www.dsalab.dev'), []);
});

test('detects a high-entropy unquoted env-style secret in an example file', () => {
  const value = Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index)).join('');
  assert.ok(scanSecretText(`SOME_API_KEY=${value}`).some(finding => finding.rule === 'sensitive-env-assignment'));
  assert.deepEqual(scanSecretText('RESEND_API_KEY=pon_tu_api_key_de_resend'), []);
  assert.deepEqual(scanSecretText('TURNSTILE_SECRET_KEY=clave_de_ejemplo_del_proveedor'), []);
});

test('flags real env/credential filenames without needing their contents', () => {
  for (const name of ['.env', 'report/.env.production', 'folder/private.pem', 'private.key', 'keys/id_ed25519', '.git-credentials', 'archive.pfx']) {
    assert.ok(sensitivePathReason(name));
  }
  assert.equal(sensitivePathReason('.env.example'), null);
  assert.equal(sensitivePathReason('report/.env.example'), null);
  assert.equal(sensitivePathReason('src/environment.js'), null);
});

test('rejects paths outside the project and sibling-prefix tricks', () => {
  const root = path.resolve('fixture-project');
  assert.equal(isInsideDirectory(root, path.join(root, 'src/file.js')), true);
  assert.equal(isInsideDirectory(root, path.join(root, '..', 'other/.env')), false);
  assert.equal(isInsideDirectory(root, `${root}-other/file.js`), false);
});

test('reporting exposes only path, rule, line and safe revision, even if callers supply an extra secret', () => {
  const token = synthetic(['re', '_'].join(''));
  const output = formatSecretFindings([{ filePath: `src/${token}.js\n`, line: 7, rule: 'resend-api-key', revision: 'a'.repeat(40), matchedValue: token }]);
  assert.ok(!output.includes(token));
  assert.ok(output.includes('[REDACTED]'));
  assert.ok(output.includes(':7'));
  assert.ok(output.includes('Git aaaaaaaaaaaa'));
  assert.ok(!output.includes('\n'));
});

test('an untrusted filename cannot start a GitHub workflow command in the report', () => {
  const output = formatSecretFindings([{ filePath: '::error::fixture.js\r\n', line: 1, rule: 'fixture-rule' }]);
  assert.ok(output.startsWith('- '));
  assert.ok(!output.includes('\r') && !output.includes('\n'));
});
