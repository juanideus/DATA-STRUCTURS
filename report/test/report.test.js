import test from 'node:test';
import assert from 'node:assert/strict';
import { createReportEmail, sendReportEmail } from '../src/email.js';
import { allowedOrigins, OFFICIAL_FRONTEND_ORIGINS } from '../src/origins.js';
import { normalizeTurnstileToken, verifyTurnstile } from '../src/turnstile.js';
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
    assert.equal(response.headers.get('strict-transport-security'), 'max-age=63072000; includeSubDomains');
    assert.match(response.headers.get('content-security-policy'), /default-src 'none'/);
    assert.deepEqual(await response.json(), { ok: true, service: 'dsa-lab-report-api' });
  }
});

test('usa X-Real-IP de Railway e ignora X-Forwarded-For controlado por el cliente', async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'test';
  const { clientAddress } = await import('../src/server.js');
  const address = clientAddress({
    headers: {
      'x-real-ip': '203.0.113.8',
      'x-forwarded-for': '198.51.100.44',
    },
    socket: { remoteAddress: '127.0.0.1' },
  });
  assert.equal(address, '203.0.113.8');
  if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = previousNodeEnv;
});

test('responde 413 sin cortar la conexión cuando el cuerpo supera el límite', async t => {
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

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/report`, {
    method: 'POST',
    headers: {
      Origin: 'https://www.dsalab.dev',
      'Content-Type': 'application/json',
      'X-Real-IP': '203.0.113.9',
    },
    body: JSON.stringify({ description: 'x'.repeat(20_000) }),
  });
  assert.equal(response.status, 413);
  assert.match((await response.json()).message, /tamaño permitido/);
});

test('el rate limit no se evade falsificando X-Forwarded-For', async t => {
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

  const statuses = [];
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/report`, {
      method: 'POST',
      headers: {
        Origin: 'https://www.dsalab.dev',
        'Content-Type': 'application/json',
        'X-Forwarded-For': `198.51.100.${attempt + 1}`,
      },
      body: '{}',
    });
    statuses.push(response.status);
  }

  assert.deepEqual(statuses, [422, 422, 422, 422, 422, 429]);
});

test('rechaza solicitudes sin Origin cuando la API está en producción', async t => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'test';
  const { server } = await import('../src/server.js');
  if (!server.listening) {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
  }
  process.env.NODE_ENV = 'production';
  t.after(async () => {
    if (server.listening) await new Promise(resolve => server.close(resolve));
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  });

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  assert.equal(response.status, 403);
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

test('valida Turnstile, el hostname y la acción antes de aceptar el reporte', async () => {
  let submittedBody;
  const fetchImpl = async (_url, options) => {
    submittedBody = String(options.body);
    return {
      ok: true,
      json: async () => ({ success: true, hostname: 'www.dsalab.dev', action: 'report' }),
    };
  };
  const result = await verifyTurnstile({
    secret: 'secret-test',
    token: 'token-test',
    remoteIp: '203.0.113.10',
    fetchImpl,
  });

  assert.equal(result.success, true);
  assert.match(submittedBody, /secret=secret-test/);
  assert.match(submittedBody, /response=token-test/);
  assert.match(submittedBody, /remoteip=203.0.113.10/);
});

test('rechaza tokens Turnstile ausentes, hostnames ajenos y acciones incorrectas', async () => {
  assert.deepEqual(
    await verifyTurnstile({ secret: 'secret-test', token: '' }),
    { success: false, reason: 'missing-token' },
  );

  const wrongHostname = await verifyTurnstile({
    secret: 'secret-test',
    token: 'token-test',
    fetchImpl: async () => ({ ok: true, json: async () => ({ success: true, hostname: 'evil.example', action: 'report' }) }),
  });
  const wrongAction = await verifyTurnstile({
    secret: 'secret-test',
    token: 'token-test',
    fetchImpl: async () => ({ ok: true, json: async () => ({ success: true, hostname: 'www.dsalab.dev', action: 'login' }) }),
  });

  assert.equal(wrongHostname.success, false);
  assert.equal(wrongHostname.reason, 'invalid-hostname');
  assert.equal(wrongAction.success, false);
  assert.equal(wrongAction.reason, 'invalid-action');
  assert.equal(normalizeTurnstileToken(`  ${'a'.repeat(2100)}  `).length, 2048);
});
