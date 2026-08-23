import { useCallback, useEffect, useRef, useState } from 'react';
import { Bug, ClipboardCopy, X } from 'lucide-react';
import { useDialogFocus } from '../accessibility/useDialogFocus.js';
import { useLanguage } from '../i18n.jsx';

const REPORT_API_URL = String(import.meta.env.VITE_REPORT_API_URL || '').replace(/\/+$/, '');
const EMPTY_REPORT = Object.freeze({ name:'', email:'', title:'', type:'Algo no funciona', description:'', steps:'', website:'' });

export default function BugReporter({ section }) {
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState(EMPTY_REPORT);
  const [copyStatus, setCopyStatus] = useState('');
  const [sending, setSending] = useState(false);
  const reportServiceWarmed = useRef(false);
  const close = useCallback(() => setOpen(false), []);
  const dialogRef = useDialogFocus({ open, onClose: close });
  const bc = language === 'en' ? {
    name:'Your name', namePh:'E.g. Ana Torres', email:'Your email (optional)', emailPh:'So we can reply to you', summary:'Short summary', summaryPh:'E.g. The delete button does not respond',
    type:'What kind of problem is it?', types:['Something does not work','It looks incorrect','Problem in the Java code','Content is difficult to understand','Another problem'],
    happened:'Tell us what happened', happenedPh:'What did you do, what appeared, and what did you expect?', repeat:'How can we reproduce it?', repeatPh:'1. I opened the structure...\n2. I pressed the button...\n3. Then this happened...',
    website:'Website', delivery:'The report will be sent directly to the DSA Lab team.', later:'Not now', copy:'Copy', sending:'Sending…', send:'Send report',
  } : {
    name:'Tu nombre', namePh:'Ej.: Ana Torres', email:'Tu correo (opcional)', emailPh:'Para poder responderte', summary:'Resumen corto', summaryPh:'Ej.: El botón eliminar no responde',
    type:'¿Qué tipo de problema es?', types:['Algo no funciona','Se ve incorrecto','Problema en el código Java','Contenido difícil de entender','Otro problema'],
    happened:'Cuéntanos qué ocurrió', happenedPh:'¿Qué hiciste, qué apareció y qué esperabas que ocurriera?', repeat:'¿Cómo podemos repetirlo?', repeatPh:'1. Entré a la estructura...\n2. Presioné el botón...\n3. Entonces ocurrió...',
    website:'Sitio web', delivery:'El reporte se enviará directamente al equipo de DSA Lab.', later:'Ahora no', copy:'Copiar', sending:'Enviando…', send:'Enviar reporte',
  };

  useEffect(() => {
    if (!open || !REPORT_API_URL || reportServiceWarmed.current) return;
    reportServiceWarmed.current = true;
    fetch(`${REPORT_API_URL}/health`, { mode: 'no-cors', cache: 'no-store' }).catch(() => {
      reportServiceWarmed.current = false;
    });
  }, [open]);

  const update = (field, value) => setReport(current => ({ ...current, [field]: value }));
  const reportBody = () => `# [Bug] ${report.title.trim()}\n\n## Nombre\n${report.name.trim()}\n\n## Correo\n${report.email.trim() || 'No proporcionado'}\n\n## Sección afectada\n${section}\n\n## Tipo de problema\n${report.type}\n\n## Descripción\n${report.description.trim()}\n\n## Pasos para reproducirlo\n${report.steps.trim() || 'No especificados.'}\n\n---\nReporte generado desde DSA Lab.`;
  const copyReport = async () => {
    if (!report.name.trim() || !report.title.trim() || !report.description.trim()) {
      setCopyStatus(language === 'en' ? 'Complete your name, summary, and description before copying.' : 'Completa tu nombre, el resumen y la descripción antes de copiar.');
      return;
    }
    try {
      await navigator.clipboard.writeText(reportBody());
      setCopyStatus(language === 'en' ? 'Report copied. You can send it by email, chat, or your preferred channel.' : 'Reporte copiado. Puedes enviarlo por correo, chat o el medio que prefieras.');
    } catch {
      setCopyStatus(language === 'en' ? 'The browser did not allow copying. Select the text and try again.' : 'El navegador no permitió copiar. Selecciona el texto e inténtalo nuevamente.');
    }
  };
  const submit = async event => {
    event.preventDefault();
    if (sending) return;
    if (!REPORT_API_URL) {
      setCopyStatus(language === 'en' ? 'Sending is not configured yet. Add VITE_REPORT_API_URL in Vercel.' : 'El envío todavía no está configurado. Agrega VITE_REPORT_API_URL en Vercel.');
      return;
    }
    setSending(true);
    setCopyStatus(language === 'en' ? 'Sending report…' : 'Enviando reporte…');
    const slowResponseNotice = window.setTimeout(() => {
      setCopyStatus(language === 'en' ? 'The service is starting. Keep this window open; your report will be sent automatically.' : 'El servicio se está iniciando. Mantén esta ventana abierta; tu reporte se enviará automáticamente.');
    }, 8_000);
    try {
      const response = await fetch(`${REPORT_API_URL}/api/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...report, section, pageUrl: window.location.href, userAgent: navigator.userAgent }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || (language === 'en' ? 'The report could not be sent.' : 'No fue posible enviar el reporte.'));
      setReport(EMPTY_REPORT);
      setCopyStatus(language === 'en' ? 'Thank you! The report was sent successfully.' : '¡Gracias! El reporte fue enviado correctamente.');
    } catch (error) {
      setCopyStatus(error.message || (language === 'en' ? 'The report could not be sent. Check your connection and try again.' : 'No fue posible enviar el reporte. Comprueba tu conexión e inténtalo nuevamente.'));
    } finally {
      window.clearTimeout(slowResponseNotice);
      setSending(false);
    }
  };

  return <>
    <button className="bug-fab" onClick={() => setOpen(true)} aria-label={t('reportProblem')}><Bug size={20}/><span>{t('reportProblem')}</span></button>
    {open && <div className="bug-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
      <section ref={dialogRef} tabIndex="-1" className="bug-modal" role="dialog" aria-modal="true" aria-labelledby="bug-report-title">
        <header><div className="bug-modal-icon"><Bug size={20}/></div><div><span>{language === 'en' ? 'Help us improve' : 'Ayúdanos a mejorar'}</span><h2 id="bug-report-title">{language === 'en' ? 'Did you find something unusual?' : '¿Encontraste algo extraño?'}</h2></div><button type="button" onClick={close} aria-label={t('closeForm')}><X size={18}/></button></header>
        <p className="bug-intro">{language === 'en' ? 'Tell us what happened and how we can reproduce it. These details help us find and fix the problem.' : 'Cuéntanos qué pasó y cómo podemos repetirlo. Con esos datos será mucho más fácil encontrar y corregir el problema.'}</p>
        <div className="bug-section-label"><small>{language === 'en' ? 'You were viewing' : 'Estabas viendo'}</small><strong>{section}</strong></div>
        <form onSubmit={submit}>
          <label><span>{bc.name}</span><input required minLength="2" maxLength="80" autoComplete="name" value={report.name} onChange={event => update('name', event.target.value)} placeholder={bc.namePh}/></label>
          <label><span>{bc.email}</span><input type="email" maxLength="254" autoComplete="email" value={report.email} onChange={event => update('email', event.target.value)} placeholder={bc.emailPh}/></label>
          <label className="bug-field-wide"><span>{bc.summary}</span><input required maxLength="120" value={report.title} onChange={event => update('title', event.target.value)} placeholder={bc.summaryPh}/></label>
          <label><span>{bc.type}</span><select value={report.type} onChange={event => update('type', event.target.value)}>{bc.types.map(type => <option key={type}>{type}</option>)}</select></label>
          <label className="bug-field-wide"><span>{bc.happened}</span><textarea required minLength="10" maxLength="3000" rows="4" value={report.description} onChange={event => update('description', event.target.value)} placeholder={bc.happenedPh}/></label>
          <label className="bug-field-wide"><span>{bc.repeat}</span><textarea maxLength="3000" rows="3" value={report.steps} onChange={event => update('steps', event.target.value)} placeholder={bc.repeatPh}/></label>
          <label className="bug-honeypot" aria-hidden="true"><span>{bc.website}</span><input tabIndex="-1" autoComplete="off" value={report.website} onChange={event => update('website', event.target.value)}/></label>
          {copyStatus && <p className="bug-copy-status" role="status" aria-live="polite">{copyStatus}</p>}
          <div className="bug-form-actions"><p><Bug size={13}/> {bc.delivery}</p><button type="button" disabled={sending} onClick={close}>{bc.later}</button><button className="copy-report" type="button" disabled={sending} onClick={copyReport}><ClipboardCopy size={15}/> {bc.copy}</button><button type="submit" disabled={sending}>{sending ? bc.sending : bc.send} <Bug size={15}/></button></div>
        </form>
      </section>
    </div>}
  </>;
}
