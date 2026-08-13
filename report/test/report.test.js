import test from 'node:test';
import assert from 'node:assert/strict';
import { createReportEmail } from '../src/email.js';
import { escapeHtml, normalizeReport, validateReport } from '../src/validation.js';

const validInput = {
  name: 'Ana Torres',
  email: 'ana@example.com',
  title: 'No avanza el recorrido',
  type: 'Animación',
  section: 'Árbol AVL',
  description: 'La animación se detiene después de insertar el segundo valor.',
  steps: 'Insertar 10 y luego 20.',
};

test('normaliza y valida un reporte correcto', () => {
  const report = normalizeReport(validInput);
  assert.deepEqual(validateReport(report), {});
  assert.equal(report.email, 'ana@example.com');
});

test('rechaza campos obligatorios incompletos', () => {
  const errors = validateReport(normalizeReport({ name: 'A', description: 'corto' }));
  assert.ok(errors.name);
  assert.ok(errors.title);
  assert.ok(errors.type);
  assert.ok(errors.section);
  assert.ok(errors.description);
});

test('escapa contenido introducido por el usuario', () => {
  assert.equal(escapeHtml('<script>"x"</script>'), '&lt;script&gt;&quot;x&quot;&lt;/script&gt;');
  const message = createReportEmail(normalizeReport({ ...validInput, title: '<b>Error</b>' }));
  assert.ok(message.html.includes('&lt;b&gt;Error&lt;/b&gt;'));
  assert.ok(!message.html.includes('<b>Error</b>'));
});

test('prepara un correo de texto y HTML', () => {
  const message = createReportEmail(normalizeReport(validInput));
  assert.match(message.subject, /DSA Lab/);
  assert.match(message.text, /Árbol AVL/);
  assert.match(message.html, /Ana Torres/);
});
