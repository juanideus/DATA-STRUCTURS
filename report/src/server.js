import http from 'node:http';
import net from 'node:net';
import { sendReportEmail } from './email.js';
import { allowedOrigins } from './origins.js';
import { verifyTurnstile } from './turnstile.js';
import { normalizeReport, validateReport } from './validation.js';

const PORT = Number(process.env.PORT || 10000);
const MAX_BODY_SIZE = 16 * 1024;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAXIMUM = 5;
const MAX_TRACKED_ADDRESSES = 5_000;
const requestsByAddress = new Map();
let lastRateLimitCleanup = 0;

const setSecurityHeaders = response => {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  response.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
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
  return !origin && process.env.NODE_ENV !== 'production';
};

export const clientAddress = request => {
  const railwayAddress = Array.isArray(request.headers['x-real-ip'])
    ? request.headers['x-real-ip'][0]
    : request.headers['x-real-ip'];
  const candidate = String(railwayAddress || '').split(',')[0].trim();
  if (net.isIP(candidate)) return candidate;
  const socketAddress = String(request.socket.remoteAddress || '').trim();
  return net.isIP(socketAddress) ? socketAddress : 'unknown';
};

const exceedsRateLimit = address => {
  const now = Date.now();
  if (now - lastRateLimitCleanup >= RATE_WINDOW_MS) {
    for (const [key, timestamps] of requestsByAddress) {
      const active = timestamps.filter(timestamp => now - timestamp < RATE_WINDOW_MS);
      if (active.length) requestsByAddress.set(key, active);
      else requestsByAddress.delete(key);
    }
    lastRateLimitCleanup = now;
  }
  const recent = (requestsByAddress.get(address) || []).filter(timestamp => now - timestamp < RATE_WINDOW_MS);
  if (!requestsByAddress.has(address) && requestsByAddress.size >= MAX_TRACKED_ADDRESSES) {
    const oldestAddress = requestsByAddress.keys().next().value;
    if (oldestAddress) requestsByAddress.delete(oldestAddress);
  }
  recent.push(now);
  requestsByAddress.set(address, recent);
  return recent.length > RATE_MAXIMUM;
};

const readJson = request => new Promise((resolve, reject) => {
  let body = '';
  let tooLarge = false;
  request.setEncoding('utf8');
  request.on('data', chunk => {
    if (tooLarge) return;
    body += chunk;
    if (Buffer.byteLength(body) > MAX_BODY_SIZE) {
      tooLarge = true;
      body = '';
      const error = new Error('El formulario supera el tamaño permitido.');
      error.status = 413;
      reject(error);
    }
  });
  request.on('end', () => {
    if (tooLarge) return;
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

const missingConfiguration = () => ['RESEND_API_KEY', 'REPORT_EMAIL', 'REPORT_FROM']
  .filter(name => !process.env[name]);

export const server = http.createServer(async (request, response) => {
  setSecurityHeaders(response);
  const url = new URL(request.url || '/', 'http://localhost');

  if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
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
    const input = await readJson(request);
    const report = normalizeReport(input);
    if (report.website) {
      sendJson(response, 200, { ok: true, message: 'Reporte recibido.' });
      return;
    }
    const errors = validateReport(report);
    if (Object.keys(errors).length) {
      sendJson(response, 422, { ok: false, message: 'Revisa los campos del formulario.', errors });
      return;
    }
    const turnstile = await verifyTurnstile({
      secret: process.env.TURNSTILE_SECRET_KEY,
      token: input.turnstileToken,
      remoteIp: clientAddress(request),
    });
    if (!turnstile.success) {
      sendJson(response, 422, {
        ok: false,
        message: 'No se pudo completar la verificación de seguridad. Inténtalo nuevamente.',
        errors: { turnstile: 'Completa nuevamente la verificación de seguridad.' },
      });
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
      from: process.env.REPORT_FROM,
      to: process.env.REPORT_EMAIL,
      report,
    });
    sendJson(response, 201, { ok: true, message: 'Reporte enviado correctamente.', id: result.id });
  } catch (error) {
    console.error('No se pudo procesar el reporte:', {
      message: error.message,
      providerStatus: error.providerStatus,
    });
    sendJson(response, error.status && error.status < 500 ? error.status : 502, {
      ok: false,
      message: error.status && error.status < 500 ? error.message : 'No fue posible enviar el reporte. Inténtalo nuevamente.',
    });
  }
});

if (process.env.NODE_ENV !== 'test') {
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;
  server.maxHeadersCount = 50;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`DSA Lab Report API disponible en el puerto ${PORT}`);
  });
}
