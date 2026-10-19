import { expect, test } from '@playwright/test';
import react from '@vitejs/plugin-react';
import { build } from 'vite';
import { fileURLToPath } from 'node:url';

const fixtureOrigin = 'http://127.0.0.1:4173';
const fixturePath = '/__security/turnstile-fixture';
const virtualId = fileURLToPath(new URL('./turnstile-security-fixture.jsx', import.meta.url)).replaceAll('\\', '/');
const widgetPath = fileURLToPath(new URL('../../src/components/TurnstileWidget.jsx', import.meta.url)).replaceAll('\\', '/');
const reportFixturePath = '/__security/report-fixture';
const reportVirtualId = fileURLToPath(new URL('./report-security-fixture.jsx', import.meta.url)).replaceAll('\\', '/');
const reportPath = fileURLToPath(new URL('../../src/components/BugReporter.jsx', import.meta.url)).replaceAll('\\', '/');
const languagePath = fileURLToPath(new URL('../../src/i18n.jsx', import.meta.url)).replaceAll('\\', '/');
const stylesPath = fileURLToPath(new URL('../../src/styles.css', import.meta.url)).replaceAll('\\', '/');
const accessibilityStylesPath = fileURLToPath(new URL('../../src/accessibility.css', import.meta.url)).replaceAll('\\', '/');
let fixtureBuild;
let reportFixtureBuild;

// Bundle the real component in memory: no build-time environment, API key,
// Cloudflare connection, report API, or email service participates in these tests.
function fixtureJavaScript() {
  if (!fixtureBuild) fixtureBuild = build({
    configFile: false,
    envDir: false,
    logLevel: 'silent',
    define: { 'process.env.NODE_ENV': JSON.stringify('development') },
    plugins: [{
      name: 'turnstile-security-fixture',
      resolveId(id) { if (id.replaceAll('\\', '/') === virtualId) return `\0turnstile-security-fixture.jsx`; },
      load(id) {
        if (id !== `\0turnstile-security-fixture.jsx`) return;
        return `
          import React, { useState } from 'react';
          import { createRoot } from 'react-dom/client';
          import TurnstileWidget from ${JSON.stringify(widgetPath)};
          function Fixture() {
            const [open, setOpen] = useState(true);
            const [second, setSecond] = useState(new URLSearchParams(window.location.search).has('second'));
            const [language, setLanguage] = useState('es');
            const [revision, setRevision] = useState(0);
            const [reset, setReset] = useState(0);
            const [tokens, setTokens] = useState(['', '']);
            const [errors, setErrors] = useState(0);
            const [lastCallback, setLastCallback] = useState('');
            const onToken = index => token => {
              setTokens(current => current.map((value, position) => position === index ? token : value));
              if (token) setLastCallback('revision-' + revision);
            };
            return <main>
              <h1>Turnstile security fixture</h1>
              <button onClick={() => setOpen(value => !value)}>{open ? 'Close verification' : 'Open verification'}</button>
              <button onClick={() => setSecond(value => !value)}>Toggle second widget</button>
              <button onClick={() => setLanguage(value => value === 'es' ? 'en' : 'es')}>Change language</button>
              <button onClick={() => setRevision(value => value + 1)}>Replace callbacks</button>
              <button onClick={() => setReset(value => value + 1)}>Reset first widget</button>
              <output data-testid="first-token">{tokens[0]}</output>
              <output data-testid="second-token">{tokens[1]}</output>
              <output data-testid="errors">{errors}</output>
              <output data-testid="last-callback">{lastCallback}</output>
              {open && <section data-testid="first-widget"><TurnstileWidget siteKey="public-test-key"
                language={language} onToken={onToken(0)} onError={() => setErrors(value => value + 1)} resetSignal={reset}/></section>}
              {open && second && <section data-testid="second-widget"><TurnstileWidget siteKey="public-test-key"
                language={language} onToken={onToken(1)} onError={() => setErrors(value => value + 1)} resetSignal={0}/></section>}
            </main>;
          }
          createRoot(document.getElementById('root')).render(<React.StrictMode><Fixture/></React.StrictMode>);
        `;
      },
    }, react()],
    build: {
      write: false,
      minify: false,
      target: 'es2020',
      lib: { entry: virtualId, formats: ['es'], fileName: 'fixture' },
    },
  }).then(result => (Array.isArray(result) ? result : [result])
    .flatMap(bundle => bundle.output).find(chunk => chunk.type === 'chunk' && chunk.isEntry).code);
  return fixtureBuild;
}

function reportFixtureAssets() {
  if (!reportFixtureBuild) reportFixtureBuild = build({
    configFile: false,
    envDir: false,
    logLevel: 'silent',
    define: {
      'process.env.NODE_ENV': JSON.stringify('development'),
      'import.meta.env.VITE_REPORT_API_URL': JSON.stringify('https://api.dsalab.dev'),
      'import.meta.env.VITE_TURNSTILE_SITE_KEY': JSON.stringify('public-test-key'),
    },
    plugins: [{
      name: 'report-security-fixture',
      resolveId(id) { if (id.replaceAll('\\', '/') === reportVirtualId) return '\0report-security-fixture.jsx'; },
      load(id) {
        if (id !== '\0report-security-fixture.jsx') return;
        return `
          import React from 'react';
          import { createRoot } from 'react-dom/client';
          import BugReporter from ${JSON.stringify(reportPath)};
          import { LanguageProvider } from ${JSON.stringify(languagePath)};
          import ${JSON.stringify(stylesPath)};
          import ${JSON.stringify(accessibilityStylesPath)};
          createRoot(document.getElementById('root')).render(
            <React.StrictMode><LanguageProvider>
              <main><h1>Report security fixture</h1>
                <BugReporter section="Árbol enhebrado"/>
              </main>
            </LanguageProvider></React.StrictMode>
          );
        `;
      },
    }, react()],
    build: {
      write: false,
      minify: false,
      target: 'es2020',
      lib: { entry: reportVirtualId, formats: ['es'], fileName: 'report-fixture' },
    },
  }).then(result => {
    const output = (Array.isArray(result) ? result : [result]).flatMap(bundle => bundle.output);
    return {
      code: output.find(chunk => chunk.type === 'chunk' && chunk.isEntry).code,
      css: output.filter(chunk => chunk.type === 'asset' && chunk.fileName.endsWith('.css')).map(chunk => chunk.source).join('\n'),
    };
  });
  return reportFixtureBuild;
}

const turnstileMockScript = `
  window.__turnstileMock = { widgets: new Map(), removed: [], renders: 0, resets: [], throwReset: false };
  window.turnstile = {
    render(container, options) {
      const mock = window.__turnstileMock;
      const id = String(++mock.renders);
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = options.language === 'en' ? 'Complete mock verification' : 'Completar verificación simulada';
      button.addEventListener('click', () => options.callback('mock-token-' + id));
      container.appendChild(button);
      mock.widgets.set(id, { options, button });
      return id;
    },
    remove(id) {
      const mock = window.__turnstileMock;
      const widget = mock.widgets.get(id);
      if (!widget) throw new Error('Wrong widget removed');
      mock.removed.push(widget.options);
      widget.button.remove();
      mock.widgets.delete(id);
    },
    reset(id) {
      const mock = window.__turnstileMock;
      if (!mock.widgets.has(id)) throw new Error('Wrong widget reset');
      if (mock.throwReset) throw new Error('Mock reset failure');
      mock.resets.push(id);
    },
  };
`;

async function openFixture(page, { failFirst = false, second = false, holdDownload = false } = {}) {
  const counters = { downloads: 0, unexpectedRequests: [], pageErrors: [] };
  let releaseDownload;
  const downloadReady = holdDownload ? new Promise(resolve => { releaseDownload = resolve; }) : Promise.resolve();
  counters.releaseDownload = () => releaseDownload?.();
  page.on('pageerror', error => counters.pageErrors.push(error.message));
  const code = await fixtureJavaScript();
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin === fixtureOrigin && url.pathname === fixturePath) {
      return route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:16px;font:16px system-ui}button{margin:4px;padding:10px}output{display:block}.bug-turnstile-widget{min-height:65px;display:flex;align-items:center;gap:12px}.bug-turnstile-widget>small{font-size:12px}</style></head><body><div id="root"></div><script type="module" src="/turnstile-fixture.js"></script></body></html>' });
    }
    if (url.origin === fixtureOrigin && url.pathname === '/turnstile-fixture.js') {
      return route.fulfill({ contentType: 'application/javascript; charset=utf-8', body: code });
    }
    if (url.origin === 'https://challenges.cloudflare.com' && url.pathname === '/turnstile/v0/api.js') {
      counters.downloads++;
      if (failFirst && counters.downloads === 1) return route.abort('failed');
      await downloadReady;
      return route.fulfill({ contentType: 'application/javascript; charset=utf-8', body: turnstileMockScript });
    }
    counters.unexpectedRequests.push(url.origin + url.pathname);
    return route.abort('blockedbyclient');
  });
  await page.goto(`${fixturePath}${second ? '?second=1' : ''}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Turnstile security fixture' })).toBeVisible();
  return counters;
}

test('a failed script recovers on reopen without reloading the page or sending reports', async ({ page }) => {
  const counters = await openFixture(page, { failFirst: true });
  await expect(page.getByTestId('first-widget')).toContainText('Cierra y vuelve a abrir');
  await expect(page.getByTestId('first-token')).toBeEmpty();
  await page.getByRole('button', { name: 'Close verification' }).click();
  const reopen = page.getByRole('button', { name: 'Open verification' });
  await reopen.focus();
  await reopen.press('Enter');
  await page.getByRole('button', { name: 'Completar verificación simulada' }).click();
  await expect(page.getByTestId('first-token')).toHaveText('mock-token-1');
  expect(counters.downloads).toBe(2);
  expect(counters.unexpectedRequests).toEqual([]);
  expect(counters.pageErrors).toEqual([]);
});

test('StrictMode, changed callback identities and simultaneous widgets retain isolated ownership', async ({ page }) => {
  const counters = await openFixture(page, { second: true });
  await expect(page.getByRole('button', { name: 'Completar verificación simulada' })).toHaveCount(2);
  const before = await page.evaluate(() => ({ renders: window.__turnstileMock.renders, active: window.__turnstileMock.widgets.size }));
  expect(before).toEqual({ renders: 2, active: 2 });
  await page.getByRole('button', { name: 'Replace callbacks' }).click();
  await page.getByTestId('first-widget').getByRole('button').click();
  await expect(page.getByTestId('last-callback')).toHaveText('revision-1');
  await page.getByTestId('second-widget').getByRole('button').click();
  const secondToken = await page.getByTestId('second-token').textContent();
  await page.getByRole('button', { name: 'Reset first widget' }).click();
  await expect(page.getByTestId('first-token')).toBeEmpty();
  await expect(page.getByTestId('second-token')).toHaveText(secondToken);
  const after = await page.evaluate(() => ({ renders: window.__turnstileMock.renders, active: window.__turnstileMock.widgets.size, resets: window.__turnstileMock.resets.length }));
  expect(after).toEqual({ ...before, resets: 1 });
  expect(counters.downloads).toBe(1);
  expect(counters.unexpectedRequests).toEqual([]);
  expect(counters.pageErrors).toEqual([]);
});

test('unmounting during a shared download never renders into the removed container', async ({ page }) => {
  const counters = await openFixture(page, { holdDownload: true });
  await expect.poll(() => counters.downloads).toBe(1);
  await page.getByRole('button', { name: 'Close verification' }).click();
  counters.releaseDownload();
  await expect.poll(() => page.evaluate(() => window.__turnstileMock?.renders)).toBe(0);
  await page.getByRole('button', { name: 'Open verification' }).click();
  await page.getByRole('button', { name: 'Completar verificación simulada' }).click();
  await expect(page.getByTestId('first-token')).toHaveText('mock-token-1');
  expect(counters.downloads).toBe(1);
  expect(counters.unexpectedRequests).toEqual([]);
  expect(counters.pageErrors).toEqual([]);
});

test('removed widgets ignore late callbacks and a reset failure is recoverable in both languages', async ({ page }) => {
  const counters = await openFixture(page);
  await page.getByTestId('first-widget').getByRole('button').click();
  await expect(page.getByTestId('first-token')).not.toBeEmpty();
  await page.evaluate(() => { window.__turnstileMock.throwReset = true; });
  await page.getByRole('button', { name: 'Reset first widget' }).click();
  await expect(page.getByTestId('first-token')).toBeEmpty();
  await expect(page.getByTestId('first-widget')).toContainText('Cierra y vuelve a abrir');
  await page.getByRole('button', { name: 'Change language' }).click();
  await expect(page.getByRole('button', { name: 'Complete mock verification' })).toBeVisible();
  const errorsBefore = await page.getByTestId('errors').textContent();
  await page.evaluate(() => {
    for (const old of window.__turnstileMock.removed) {
      old.callback('stale-token');
      old['error-callback']();
      old['expired-callback']();
    }
  });
  await expect(page.getByTestId('first-token')).toBeEmpty();
  await expect(page.getByTestId('errors')).toHaveText(errorsBefore);
  await page.getByRole('button', { name: 'Complete mock verification' }).click();
  await expect(page.getByTestId('first-token')).toHaveText(/^mock-token-/);
  expect(counters.downloads).toBe(1);
  expect(counters.unexpectedRequests).toEqual([]);
  expect(counters.pageErrors).toEqual([]);
});

async function openReportFixture(page, { failFirst = false, language = 'es' } = {}) {
  const counters = { downloads: 0, health: 0, reports: [], unexpectedRequests: [], pageErrors: [] };
  const assets = await reportFixtureAssets();
  page.on('pageerror', error => counters.pageErrors.push(error.message));
  await page.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === fixtureOrigin && url.pathname === reportFixturePath) {
      return route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/report-fixture.css"></head><body><div id="root"></div><script type="module" src="/report-fixture.js"></script></body></html>' });
    }
    if (url.origin === fixtureOrigin && url.pathname === '/report-fixture.js') {
      return route.fulfill({ contentType: 'application/javascript; charset=utf-8', body: assets.code });
    }
    if (url.origin === fixtureOrigin && url.pathname === '/report-fixture.css') {
      return route.fulfill({ contentType: 'text/css; charset=utf-8', body: assets.css });
    }
    if (url.origin === 'https://challenges.cloudflare.com' && url.pathname === '/turnstile/v0/api.js') {
      counters.downloads++;
      if (failFirst && counters.downloads === 1) return route.abort('failed');
      return route.fulfill({ contentType: 'application/javascript; charset=utf-8', body: turnstileMockScript });
    }
    if (url.origin === 'https://api.dsalab.dev' && url.pathname === '/health') {
      counters.health++;
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    }
    if (url.origin === 'https://api.dsalab.dev' && url.pathname === '/api/report') {
      const headers = { 'access-control-allow-origin': fixtureOrigin, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'Content-Type' };
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      if (request.method() === 'POST') {
        counters.reports.push(request.postDataJSON());
        return route.fulfill({ status: 201, headers, contentType: 'application/json', body: '{"message":"Mock report received"}' });
      }
    }
    // Includes any unexpected Siteverify/Resend request: never use real services.
    counters.unexpectedRequests.push(request.method() + ' ' + url.origin + url.pathname);
    return route.abort('blockedbyclient');
  });
  await page.goto(`${reportFixturePath}?lang=${language}&token=DO-NOT-TRANSMIT&email=private%40example.test#private-fragment`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: language === 'en' ? 'Report a problem' : 'Informar un problema', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  return counters;
}

async function fillReport(page, language = 'es') {
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: language === 'en' ? /^Your name/ : /^Tu nombre/ }).fill('Ana Seguridad');
  await dialog.getByRole('textbox', { name: language === 'en' ? /^Your email/ : /^Tu correo/ }).fill('audit@example.test');
  await dialog.getByRole('textbox', { name: language === 'en' ? /^Short summary/ : /^Resumen corto/ }).fill('Prueba de privacidad del reporte');
  await dialog.getByRole('combobox').selectOption(language === 'en' ? 'Something does not work' : 'Algo no funciona');
  await dialog.getByRole('textbox', { name: language === 'en' ? /^Tell us what happened/ : /^Cuéntanos qué ocurrió/ }).fill('Prueba local aislada: no se contacta ningún servicio real.');
  await dialog.getByRole('textbox', { name: language === 'en' ? /^How can we reproduce it/ : /^¿Cómo podemos repetirlo/ }).fill('Abrir formulario, completar y enviar al mock.');
}

test('the real report form sends validated fields without diagnostic query or fragment', async ({ page }) => {
  const counters = await openReportFixture(page, { language: 'en' });
  await fillReport(page, 'en');
  await page.getByRole('button', { name: 'Complete mock verification', exact: true }).click();
  await page.getByRole('button', { name: 'Send report', exact: true }).click();
  await expect(page.locator('.bug-copy-status')).toHaveText('Thank you! The report was sent successfully.');
  expect(counters.reports).toHaveLength(1);
  expect(counters.reports[0]).toMatchObject({
    name: 'Ana Seguridad',
    email: 'audit@example.test',
    title: 'Prueba de privacidad del reporte',
    type: 'Something does not work',
    description: 'Prueba local aislada: no se contacta ningún servicio real.',
    steps: 'Abrir formulario, completar y enviar al mock.',
    website: '',
    section: 'Árbol enhebrado',
    pageUrl: `${fixtureOrigin}${reportFixturePath}`,
    turnstileToken: 'mock-token-1',
  });
  expect(counters.reports[0].userAgent).toBeTruthy();
  expect(JSON.stringify(counters.reports[0])).not.toMatch(/DO-NOT-TRANSMIT|private-fragment|private%40example/);
  expect(counters.health).toBeGreaterThan(0);
  expect(counters.unexpectedRequests).toEqual([]);
  expect(counters.pageErrors).toEqual([]);
});

test('the real report form preserves input on loader recovery and does not bypass validation', async ({ page }, testInfo) => {
  const counters = await openReportFixture(page, { failFirst: true });
  await expect(page.locator('.bug-turnstile-widget')).toContainText('Cierra y vuelve a abrir');
  await page.getByRole('button', { name: 'Enviar reporte', exact: true }).click();
  await expect(page.locator('.bug-copy-status')).toHaveText('Revisa los campos marcados antes de continuar.');
  await expect(page.getByRole('dialog').locator('[aria-invalid="true"]')).toHaveCount(4);
  expect(counters.reports).toHaveLength(0);
  await fillReport(page);
  await page.getByRole('button', { name: 'Enviar reporte', exact: true }).click();
  await expect(page.locator('.bug-copy-status')).toContainText('Cierra y vuelve a abrir el formulario para reintentar. Tus datos se conservarán.');
  expect(counters.reports).toHaveLength(0);
  await page.locator('.bug-turnstile-widget').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('bug-reporter-load-error.png'), fullPage: true });
  await page.getByRole('button', { name: 'Cerrar formulario', exact: true }).click();
  await page.getByRole('button', { name: 'Informar un problema', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('textbox', { name: /^Tu nombre/ })).toHaveValue('Ana Seguridad');
  await expect(dialog.getByRole('textbox', { name: /^Tu correo/ })).toHaveValue('audit@example.test');
  await expect(dialog.getByRole('textbox', { name: /^Resumen corto/ })).toHaveValue('Prueba de privacidad del reporte');
  await expect(dialog.getByRole('combobox')).toHaveValue('Algo no funciona');
  await expect(dialog.getByRole('textbox', { name: /^Cuéntanos qué ocurrió/ })).toHaveValue('Prueba local aislada: no se contacta ningún servicio real.');
  await expect(dialog.getByRole('textbox', { name: /^¿Cómo podemos repetirlo/ })).toHaveValue('Abrir formulario, completar y enviar al mock.');
  await page.getByRole('button', { name: 'Completar verificación simulada', exact: true }).click();
  expect(counters.reports).toHaveLength(0);
  await page.screenshot({ path: testInfo.outputPath('bug-reporter-recovered.png'), fullPage: true });
  expect(counters.downloads).toBe(2);
  expect(counters.health).toBeGreaterThan(0);
  expect(counters.unexpectedRequests).toEqual([]);
  expect(counters.pageErrors).toEqual([]);
});
