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

export function normalizeReport(input = {}) {
  return {
    name: cleanText(input.name, LIMITS.name),
    email: cleanText(input.email, LIMITS.email).toLowerCase(),
    title: cleanText(input.title, LIMITS.title),
    type: cleanText(input.type, LIMITS.type),
    section: cleanText(input.section, LIMITS.section),
    description: cleanText(input.description, LIMITS.description),
    steps: cleanText(input.steps, LIMITS.steps),
    pageUrl: cleanText(input.pageUrl, LIMITS.pageUrl),
    userAgent: cleanText(input.userAgent, LIMITS.userAgent),
    website: cleanText(input.website, 200),
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
