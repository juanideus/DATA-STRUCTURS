import http from 'node:http';
import { sendReportEmail } from './email.js';
import { normalizeReport, validateReport } from './validation.js';

const PORT = Number(process.env.PORT || 10000);
const MAX_BODY_SIZE = 16 * 1024;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAXIMUM = 5;
const requestsByAddress = new Map();

const allowedOrigins = () => String(process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

const setSecurityHeaders = response => {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
};

const sendJson = (response, status, body) => {
  response.statusCode = status;
  response.end(JSON.stringify(body));
};

const applyCors = (request, response) => {
  const origin = request.headers.origin?.replace(/\/$/, '');
  if (origin && allowedOrigins().includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return true;
  }
  return !origin;
};

const clientAddress = request => String(request.headers['x-forwarded-for'] || request.socket.remoteAddress || 'unknown')
  .split(',')[0]
  .trim();

const exceedsRateLimit = address => {
  const now = Date.now();
  const recent = (requestsByAddress.get(address) || []).filter(timestamp => now - timestamp < RATE_WINDOW_MS);
  recent.push(now);
  requestsByAddress.set(address, recent);
  return recent.length > RATE_MAXIMUM;
};

const readJson = request => new Promise((resolve, reject) => {
  let body = '';
  request.setEncoding('utf8');
  request.on('data', chunk => {
    body += chunk;
    if (Buffer.byteLength(body) > MAX_BODY_SIZE) {
      const error = new Error('El formulario supera el tamaño permitido.');
      error.status = 413;
      reject(error);
      request.destroy();
    }
  });
  request.on('end', () => {
    try {
      resolve(JSON.parse(body || '{}'));
    } catch {
      const error = new Error('El cuerpo de la solicitud no contiene JSON válido.');
      error.status = 400;
      reject(error);
    }
  });
  request.on('error', reject);
});

const missingConfiguration = () => ['RESEND_API_KEY', 'REPORT_EMAIL']
  .filter(name => !process.env[name]);

export const server = http.createServer(async (request, response) => {
  setSecurityHeaders(response);
  const url = new URL(request.url || '/', 'http://localhost');

  if (request.method === 'GET' && url.pathname === '/health') {
    sendJson(response, 200, { ok: true, service: 'dsa-lab-report-api' });
    return;
  }

  const originAllowed = applyCors(request, response);
  if (request.method === 'OPTIONS' && url.pathname === '/api/report') {
    sendJson(response, originAllowed ? 204 : 403, originAllowed ? {} : { ok: false, message: 'Origen no autorizado.' });
    return;
  }
  if (request.method !== 'POST' || url.pathname !== '/api/report') {
    sendJson(response, 404, { ok: false, message: 'Ruta no encontrada.' });
    return;
  }
  if (!originAllowed) {
    sendJson(response, 403, { ok: false, message: 'Origen no autorizado.' });
    return;
  }
  if (!String(request.headers['content-type'] || '').toLowerCase().includes('application/json')) {
    sendJson(response, 415, { ok: false, message: 'El contenido debe enviarse como JSON.' });
    return;
  }
  if (exceedsRateLimit(clientAddress(request))) {
    response.setHeader('Retry-After', String(RATE_WINDOW_MS / 1000));
    sendJson(response, 429, { ok: false, message: 'Se enviaron demasiados reportes. Inténtalo más tarde.' });
    return;
  }

  try {
    const report = normalizeReport(await readJson(request));
    if (report.website) {
      sendJson(response, 200, { ok: true, message: 'Reporte recibido.' });
      return;
    }
    const errors = validateReport(report);
    if (Object.keys(errors).length) {
      sendJson(response, 422, { ok: false, message: 'Revisa los campos del formulario.', errors });
      return;
    }
    const missing = missingConfiguration();
    if (missing.length) {
      console.error(`Faltan variables de entorno: ${missing.join(', ')}`);
      sendJson(response, 503, { ok: false, message: 'El servicio de reportes aún no está configurado.' });
      return;
    }

    const result = await sendReportEmail({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.REPORT_FROM || 'DSA Lab <onboarding@resend.dev>',
      to: process.env.REPORT_EMAIL,
      report,
    });
    sendJson(response, 201, { ok: true, message: 'Reporte enviado correctamente.', id: result.id });
  } catch (error) {
    console.error('No se pudo procesar el reporte:', error.message);
    sendJson(response, error.status && error.status < 500 ? error.status : 502, {
      ok: false,
      message: error.status && error.status < 500 ? error.message : 'No fue posible enviar el reporte. Inténtalo nuevamente.',
    });
  }
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`DSA Lab Report API disponible en el puerto ${PORT}`);
  });
}
