import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeReport, validateReport, validateReportInput } from '../src/validation.js';
import { createReportEmail } from '../src/email.js';
import { reportPageUrl } from '../../src/logic/reportPrivacy.js';

test('rechaza raíces JSON incorrectas con 400 y no como fallos del proveedor', () => {
  for (const input of [null, [], 1, true, 'texto']) {
    assert.ok(validateReportInput(input).body);
    assert.throws(() => normalizeReport(input), error => error.status === 400);
  }
});

test('rechaza tipos de campo incorrectos sin ejecutar coerción de objetos', () => {
  for (const value of [null, 0, false, [], {}, { toString: 'invalid' }]) {
    const input = { name: value };
    assert.ok(validateReportInput(input).name);
    assert.throws(() => normalizeReport(input), error => error.status === 422 && Boolean(error.errors.name));
  }
  assert.equal(Object.keys(validateReportInput({ name: '', turnstileToken: '' })).length, 0);
});

test('la URL diagnóstica omite parámetros, fragmento y credenciales en ambos límites', () => {
  for (const url of [
    'https://www.dsalab.dev/pila?diagnostic=PRIVATE_VALUE#PRIVATE_FRAGMENT',
    `https://${['user', 'password'].join(':')}@www.dsalab.dev/en/cola?diagnostic=PRIVATE_VALUE#PRIVATE_FRAGMENT`,
  ]) {
    const expected = new URL(url);
    const safe = `${expected.origin}${expected.pathname}`;
    assert.equal(reportPageUrl(url), safe);
    const report = normalizeReport({ pageUrl: url });
    assert.equal(report.pageUrl, safe);
    const email = createReportEmail(report);
    assert.ok(!/PRIVATE_VALUE|PRIVATE_FRAGMENT|user:password/.test(email.html + email.text));
  }
});

test('no convierte protocolos peligrosos en direcciones aceptadas', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,example', 'no-es-url']) {
    assert.equal(reportPageUrl(url), '');
    assert.ok(validateReport(normalizeReport({ pageUrl: url })).pageUrl);
  }
});
