import { escapeHtml } from './validation.js';

const lineBreaks = value => escapeHtml(value || 'No especificado.').replaceAll('\n', '<br>');

export function createReportEmail(report) {
  const subject = `[DSA Lab] ${report.type}: ${report.title}`.slice(0, 200);
  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;background:#f3f5f7;font-family:Arial,sans-serif;color:#1f2b3a">
    <div style="max-width:680px;margin:28px auto;padding:28px;background:#fff;border:1px solid #d9dee5;border-radius:12px">
      <p style="margin:0 0 8px;color:#ca5c40;font-size:12px;font-weight:700;letter-spacing:.08em">NUEVO REPORTE · DSA LAB</p>
      <h1 style="margin:0 0 22px;font-size:26px">${escapeHtml(report.title)}</h1>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:8px 0;color:#687586">Nombre</td><td style="padding:8px 0;font-weight:700">${escapeHtml(report.name)}</td></tr>
        <tr><td style="padding:8px 0;color:#687586">Correo</td><td style="padding:8px 0">${escapeHtml(report.email || 'No proporcionado')}</td></tr>
        <tr><td style="padding:8px 0;color:#687586">Tipo</td><td style="padding:8px 0">${escapeHtml(report.type)}</td></tr>
        <tr><td style="padding:8px 0;color:#687586">Sección</td><td style="padding:8px 0">${escapeHtml(report.section)}</td></tr>
      </table>
      <h2 style="margin:24px 0 8px;font-size:17px">Descripción</h2>
      <p style="margin:0;line-height:1.65">${lineBreaks(report.description)}</p>
      <h2 style="margin:24px 0 8px;font-size:17px">Pasos para reproducirlo</h2>
      <p style="margin:0;line-height:1.65">${lineBreaks(report.steps)}</p>
      <hr style="margin:26px 0;border:0;border-top:1px solid #e1e5ea">
      <p style="margin:5px 0;color:#778392;font-size:12px"><b>Página:</b> ${escapeHtml(report.pageUrl || 'No informada')}</p>
      <p style="margin:5px 0;color:#778392;font-size:12px"><b>Navegador:</b> ${escapeHtml(report.userAgent || 'No informado')}</p>
    </div>
  </body>
</html>`;

  const text = [
    'Nuevo reporte de DSA Lab',
    `Título: ${report.title}`,
    `Nombre: ${report.name}`,
    `Correo: ${report.email || 'No proporcionado'}`,
    `Tipo: ${report.type}`,
    `Sección: ${report.section}`,
    '',
    'Descripción:',
    report.description,
    '',
    'Pasos para reproducirlo:',
    report.steps || 'No especificados.',
    '',
    `Página: ${report.pageUrl || 'No informada'}`,
    `Navegador: ${report.userAgent || 'No informado'}`,
  ].join('\n');

  return { subject, html, text };
}

export async function sendReportEmail({ apiKey, from, to, report, fetchImpl = fetch }) {
  const content = createReportEmail(report);
  const payload = {
    from,
    to: [to],
    subject: content.subject,
    html: content.html,
    text: content.text,
  };
  if (report.email) payload.reply_to = report.email;

  const response = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': crypto.randomUUID(),
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error('El proveedor de correo rechazó el envío.');
    error.status = 502;
    error.providerStatus = response.status;
    error.providerMessage = result.message;
    throw error;
  }
  return result;
}
