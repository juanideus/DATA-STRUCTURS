const LIMITS = Object.freeze({
  name: 80,
  email: 254,
  title: 120,
  type: 60,
  section: 100,
  description: 3000,
  steps: 3000,
  pageUrl: 500,
  userAgent: 500,
});

const cleanText = (value, maximum) => String(value ?? '')
  .replace(/\u0000/g, '')
  .replace(/\r\n?/g, '\n')
  .trim()
  .slice(0, maximum);

const cleanSingleLine = (value, maximum) => cleanText(value, maximum)
  .replace(/[\r\n\t]+/g, ' ')
  .replace(/\s{2,}/g, ' ');

export function normalizeReport(input = {}) {
  return {
    name: cleanSingleLine(input.name, LIMITS.name),
    email: cleanSingleLine(input.email, LIMITS.email).toLowerCase(),
    title: cleanSingleLine(input.title, LIMITS.title),
    type: cleanSingleLine(input.type, LIMITS.type),
    section: cleanSingleLine(input.section, LIMITS.section),
    description: cleanText(input.description, LIMITS.description),
    steps: cleanText(input.steps, LIMITS.steps),
    pageUrl: cleanSingleLine(input.pageUrl, LIMITS.pageUrl),
    userAgent: cleanSingleLine(input.userAgent, LIMITS.userAgent),
    website: cleanSingleLine(input.website, 200),
  };
}

export function validateReport(report) {
  const errors = {};
  if (report.name.length < 2) errors.name = 'Escribe un nombre válido.';
  if (!report.title) errors.title = 'Escribe un título para el problema.';
  if (!report.type) errors.type = 'Selecciona el tipo de problema.';
  if (!report.section) errors.section = 'No se pudo identificar la sección.';
  if (report.description.length < 10) errors.description = 'Describe el problema con al menos 10 caracteres.';
  if (report.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(report.email)) errors.email = 'El correo no es válido.';
  if (report.pageUrl) {
    try {
      const url = new URL(report.pageUrl);
      if (!['http:', 'https:'].includes(url.protocol)) errors.pageUrl = 'La dirección de la página no es válida.';
    } catch {
      errors.pageUrl = 'La dirección de la página no es válida.';
    }
  }
  return errors;
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export { LIMITS };
