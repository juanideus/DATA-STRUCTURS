export const OFFICIAL_FRONTEND_ORIGINS = Object.freeze([
  'https://www.dsalab.dev',
  'https://dsalab.dev',
  'https://data-structurs.vercel.app',
]);

const normalizeOrigin = origin => String(origin || '').trim().replace(/\/$/, '');

export function allowedOrigins(environment = process.env) {
  const configured = String(environment.ALLOWED_ORIGINS || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);
  const development = environment.NODE_ENV === 'production' ? [] : ['http://localhost:5173'];

  return [...new Set([...OFFICIAL_FRONTEND_ORIGINS, ...development, ...configured])];
}
