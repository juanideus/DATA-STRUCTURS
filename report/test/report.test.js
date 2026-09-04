import test from 'node:test';
import assert from 'node:assert/strict';
import { createReportEmail, sendReportEmail } from '../src/email.js';
import { allowedOrigins, OFFICIAL_FRONTEND_ORIGINS } from '../src/origins.js';
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

test('autoriza los dominios oficiales aunque Render conserve una configuración anterior', () => {
  const origins = allowedOrigins({
    NODE_ENV: 'production',
    ALLOWED_ORIGINS: 'https://data-structurs.vercel.app',
  });

  assert.deepEqual(origins, OFFICIAL_FRONTEND_ORIGINS);
  assert.ok(origins.includes('https://www.dsalab.dev'));
  assert.ok(origins.includes('https://dsalab.dev'));
});

test('combina orígenes configurados, elimina duplicados y limita localhost a desarrollo', () => {
  const production = allowedOrigins({
    NODE_ENV: 'production',
    ALLOWED_ORIGINS: 'https://panel.example.com/, https://www.dsalab.dev',
  });
  const development = allowedOrigins({ NODE_ENV: 'development' });

  assert.ok(production.includes('https://panel.example.com'));
  assert.equal(production.filter(origin => origin === 'https://www.dsalab.dev').length, 1);
  assert.ok(!production.includes('http://localhost:5173'));
  assert.ok(development.includes('http://localhost:5173'));
});

test('responde el preflight CORS para ambos dominios de DSA Lab', async t => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousOrigins = process.env.ALLOWED_ORIGINS;
  process.env.NODE_ENV = 'test';
  process.env.ALLOWED_ORIGINS = 'https://data-structurs.vercel.app';

  const { server } = await import('../src/server.js');
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousOrigins === undefined) delete process.env.ALLOWED_ORIGINS;
    else process.env.ALLOWED_ORIGINS = previousOrigins;
  });

  const { port } = server.address();
  for (const origin of ['https://www.dsalab.dev', 'https://dsalab.dev']) {
    const response = await fetch(`http://127.0.0.1:${port}/api/report`, {
      method: 'OPTIONS',
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    });

    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-allow-origin'), origin);
  }
});

test('expone una ruta pública de estado compatible con Railway', async t => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'test';
  const { server } = await import('../src/server.js');
  if (!server.listening) {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
  }
  t.after(async () => {
    if (server.listening) await new Promise(resolve => server.close(resolve));
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  });

  const { port } = server.address();
  for (const path of ['/', '/health']) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, service: 'dsa-lab-report-api' });
  }
});

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

test('elimina saltos de línea de los campos usados en cabeceras', () => {
  const report = normalizeReport({ ...validInput, title: 'Error\r\nBcc: atacante@example.com' });
  assert.equal(report.title, 'Error Bcc: atacante@example.com');
  assert.ok(!createReportEmail(report).subject.includes('\n'));
});

test('rechaza direcciones de página con protocolos peligrosos', () => {
  const report = normalizeReport({ ...validInput, pageUrl: 'javascript:alert(1)' });
  assert.ok(validateReport(report).pageUrl);
});

test('no expone el mensaje interno entregado por Resend', async () => {
  const fetchImpl = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ message: 'API key secreta inválida' }),
  });
  await assert.rejects(
    sendReportEmail({ apiKey: 'secreto', from: 'a@example.com', to: 'b@example.com', report: normalizeReport(validInput), fetchImpl }),
    error => error.status === 502 && error.message === 'El proveedor de correo rechazó el envío.' && error.providerStatus === 401,
  );
});
