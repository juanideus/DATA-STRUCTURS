// Diagnostic URLs must not copy query parameters, fragments or credentials into
// the report service. The API enforces the same boundary for non-browser clients.
export function reportPageUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? `${url.origin}${url.pathname}` : '';
  } catch {
    return '';
  }
}
