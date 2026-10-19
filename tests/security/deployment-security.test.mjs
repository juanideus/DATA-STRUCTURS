import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = relative => readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('la CSP solo autoriza destinos concretos necesarios para reportes', () => {
  const config = JSON.parse(read('vercel.json'));
  const csp = config.headers[0].headers.find(header => header.key === 'Content-Security-Policy').value;
  const directives = new Map(csp.split(';').map(value => value.trim().split(/\s+/)).filter(([name]) => name).map(([name, ...values]) => [name, values]));
  assert.deepEqual(directives.get('connect-src'), ["'self'", 'https://api.dsalab.dev', 'https://challenges.cloudflare.com']);
  assert.deepEqual(directives.get('object-src'), ["'none'"]);
  assert.deepEqual(directives.get('frame-ancestors'), ["'none'"]);
  assert.ok(!directives.get('script-src').some(value => ['*', "'unsafe-eval'", "'unsafe-inline'"].includes(value)));
});

test('manifiestos y lockfiles mantienen el mismo contrato de Node LTS', () => {
  const version = read('.nvmrc').trim();
  assert.match(version, /^22\.\d+\.\d+$/);
  const root = JSON.parse(read('package.json')).engines.node;
  assert.ok(root.includes(`^${version}`));
  assert.equal(JSON.parse(read('package-lock.json')).packages[''].engines.node, root);
  assert.equal(JSON.parse(read('report/package.json')).engines.node, root);
  assert.equal(JSON.parse(read('report/package-lock.json')).packages[''].engines.node, root);
});

test('CI fija acciones por SHA y no conserva las credenciales del checkout', () => {
  const workflow = read('.github/workflows/ci.yml');
  const actions = [...workflow.matchAll(/uses:\s*([^\s@]+)@([^\s#]+)/g)];
  assert.ok(actions.length >= 2);
  for (const action of actions) assert.match(action[2], /^[a-f0-9]{40}$/);
  assert.match(workflow, /persist-credentials:\s*false/);
  assert.match(workflow, /node-version-file:\s*\.nvmrc/);
  assert.match(workflow, /permissions:\s*\n\s+contents:\s*read/);
  assert.ok(!workflow.includes('pull_request_target'));
});
