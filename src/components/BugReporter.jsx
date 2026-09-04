import { useCallback, useEffect, useRef, useState } from 'react';
import { Bug, ClipboardCopy, X } from 'lucide-react';
import { useDialogFocus } from '../accessibility/useDialogFocus.js';
import { useLanguage } from '../i18n.jsx';

const REPORT_API_URL = String(import.meta.env.VITE_REPORT_API_URL || '').replace(/\/+$/, '');
const EMPTY_REPORT = Object.freeze({ name:'', email:'', title:'', type:'', description:'', steps:'', website:'' });
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validationMessages = language => language === 'en' ? {
  nameRequired:'Enter your name.',
  nameShort:'Your name must contain at least 2 characters.',
  emailInvalid:'Enter a valid email, for example name@email.com.',
  titleRequired:'Enter a short summary of the problem.',
  typeRequired:'Select the kind of problem you found.',
  descriptionRequired:'Tell us what happened.',
  descriptionShort:'The description must contain at least 10 characters.',
} : {
  nameRequired:'Escribe tu nombre.',
  nameShort:'Tu nombre debe tener al menos 2 caracteres.',
  emailInvalid:'Escribe un correo válido, por ejemplo nombre@correo.com.',
  titleRequired:'Escribe un resumen corto del problema.',
  typeRequired:'Selecciona el tipo de problema que encontraste.',
  descriptionRequired:'Cuéntanos qué ocurrió.',
  descriptionShort:'La descripción debe tener al menos 10 caracteres.',
};

const validateReportFields = (report, language) => {
  const messages = validationMessages(language);
  const errors = {};
  const name = report.name.trim();
  const email = report.email.trim();
  const title = report.title.trim();
  const description = report.description.trim();

  if (!name) errors.name = messages.nameRequired;
  else if (name.length < 2) errors.name = messages.nameShort;
  if (email && !EMAIL_PATTERN.test(email)) errors.email = messages.emailInvalid;
  if (!title) errors.title = messages.titleRequired;
  if (!report.type) errors.type = messages.typeRequired;
  if (!description) errors.description = messages.descriptionRequired;
  else if (description.length < 10) errors.description = messages.descriptionShort;
  return errors;
};

export default function BugReporter({ section }) {
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState(EMPTY_REPORT);
  const [copyStatus, setCopyStatus] = useState('');
  const [statusTone, setStatusTone] = useState('info');
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const reportServiceWarmed = useRef(false);
  const formRef = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  const dialogRef = useDialogFocus({ open, onClose: close });
  const bc = language === 'en' ? {
    name:'Your name', namePh:'E.g. Ana Torres', email:'Your email (optional)', emailPh:'So we can reply to you', summary:'Short summary', summaryPh:'E.g. The delete button does not respond',
    type:'What kind of problem is it?', typePh:'Select an option', types:['Something does not work','It looks incorrect','Problem in the Java code','Content is difficult to understand','Another problem'],
    happened:'Tell us what happened', happenedPh:'What did you do, what appeared, and what did you expect?', repeat:'How can we reproduce it?', repeatPh:'1. I opened the structure...\n2. I pressed the button...\n3. Then this happened...',
    website:'Website', required:'Required', delivery:'The report will be sent directly to the DSA Lab team.', later:'Not now', copy:'Copy', sending:'Sending…', send:'Send report', review:'Review the marked fields before continuing.', fieldInvalid:'Check this field.',
  } : {
    name:'Tu nombre', namePh:'Ej.: Ana Torres', email:'Tu correo (opcional)', emailPh:'Para poder responderte', summary:'Resumen corto', summaryPh:'Ej.: El botón eliminar no responde',
    type:'¿Qué tipo de problema es?', typePh:'Selecciona una opción', types:['Algo no funciona','Se ve incorrecto','Problema en el código Java','Contenido difícil de entender','Otro problema'],
    happened:'Cuéntanos qué ocurrió', happenedPh:'¿Qué hiciste, qué apareció y qué esperabas que ocurriera?', repeat:'¿Cómo podemos repetirlo?', repeatPh:'1. Entré a la estructura...\n2. Presioné el botón...\n3. Entonces ocurrió...',
    website:'Sitio web', required:'Obligatorio', delivery:'El reporte se enviará directamente al equipo de DSA Lab.', later:'Ahora no', copy:'Copiar', sending:'Enviando…', send:'Enviar reporte', review:'Revisa los campos marcados antes de continuar.', fieldInvalid:'Revisa este campo.',
  };

  useEffect(() => {
    if (!open || !REPORT_API_URL || reportServiceWarmed.current) return;
    reportServiceWarmed.current = true;
    fetch(`${REPORT_API_URL}/health`, { mode: 'no-cors', cache: 'no-store' }).catch(() => {
      reportServiceWarmed.current = false;
    });
  }, [open]);

  const openReporter = () => {
    setErrors({});
    setCopyStatus('');
    setStatusTone('info');
    setOpen(true);
  };
  const applyFieldError = (field, fieldError) => {
    const nextErrors = { ...errors };
    if (fieldError) nextErrors[field] = fieldError;
    else delete nextErrors[field];
    setErrors(nextErrors);
    if (!Object.keys(nextErrors).length && copyStatus === bc.review) {
      setCopyStatus('');
      setStatusTone('info');
    }
  };
  const update = (field, value) => {
    const nextReport = { ...report, [field]: value };
    setReport(nextReport);
    if (statusTone === 'success') {
      setCopyStatus('');
      setStatusTone('info');
    }
    if (!errors[field]) return;
    applyFieldError(field, validateReportFields(nextReport, language)[field]);
  };
  const validateField = field => {
    applyFieldError(field, validateReportFields(report, language)[field]);
  };
  const focusFirstError = () => window.requestAnimationFrame(() => {
    formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
  });
  const validateAndShowErrors = () => {
    const nextErrors = validateReportFields(report, language);
    setErrors(nextErrors);
    if (!Object.keys(nextErrors).length) return true;
    setStatusTone('error');
    setCopyStatus(bc.review);
    focusFirstError();
    return false;
  };
  const reportBody = () => `# [Bug] ${report.title.trim()}\n\n## Nombre\n${report.name.trim()}\n\n## Correo\n${report.email.trim() || 'No proporcionado'}\n\n## Sección afectada\n${section}\n\n## Tipo de problema\n${report.type}\n\n## Descripción\n${report.description.trim()}\n\n## Pasos para reproducirlo\n${report.steps.trim() || 'No especificados.'}\n\n---\nReporte generado desde DSA Lab.`;
  const copyReport = async () => {
    if (!validateAndShowErrors()) return;
    try {
      await navigator.clipboard.writeText(reportBody());
      setStatusTone('success');
      setCopyStatus(language === 'en' ? 'Report copied. You can send it by email, chat, or your preferred channel.' : 'Reporte copiado. Puedes enviarlo por correo, chat o el medio que prefieras.');
    } catch {
      setStatusTone('error');
      setCopyStatus(language === 'en' ? 'The browser did not allow copying. Select the text and try again.' : 'El navegador no permitió copiar. Selecciona el texto e inténtalo nuevamente.');
    }
  };
  const submit = async event => {
    event.preventDefault();
    if (sending) return;
    if (!validateAndShowErrors()) return;
    if (!REPORT_API_URL) {
      setStatusTone('error');
      setCopyStatus(language === 'en' ? 'Sending is not configured yet. Add VITE_REPORT_API_URL in Vercel.' : 'El envío todavía no está configurado. Agrega VITE_REPORT_API_URL en Vercel.');
      return;
    }
    setSending(true);
    setStatusTone('info');
    setCopyStatus(language === 'en' ? 'Sending report…' : 'Enviando reporte…');
    const slowResponseNotice = window.setTimeout(() => {
      setCopyStatus(language === 'en' ? 'The delivery is taking a little longer. Keep this window open; your report will be sent automatically.' : 'El envío está tardando un poco más. Mantén esta ventana abierta; tu reporte se enviará automáticamente.');
    }, 8_000);
    try {
      const response = await fetch(`${REPORT_API_URL}/api/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...report, section, pageUrl: window.location.href, userAgent: navigator.userAgent }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (result.errors && typeof result.errors === 'object') {
          const localErrors = validateReportFields(report, language);
          const serverErrors = Object.keys(result.errors).reduce((mapped, field) => {
            if (field in report) mapped[field] = localErrors[field] || bc.fieldInvalid;
            return mapped;
          }, {});
          setErrors(serverErrors);
          if (Object.keys(serverErrors).length) focusFirstError();
        }
        throw new Error(result.message || (language === 'en' ? 'The report could not be sent.' : 'No fue posible enviar el reporte.'));
      }
      setReport(EMPTY_REPORT);
      setErrors({});
      setStatusTone('success');
      setCopyStatus(language === 'en' ? 'Thank you! The report was sent successfully.' : '¡Gracias! El reporte fue enviado correctamente.');
    } catch (error) {
      setStatusTone('error');
      setCopyStatus(error.message || (language === 'en' ? 'The report could not be sent. Check your connection and try again.' : 'No fue posible enviar el reporte. Comprueba tu conexión e inténtalo nuevamente.'));
    } finally {
      window.clearTimeout(slowResponseNotice);
      setSending(false);
    }
  };

  return <>
    <button className="bug-fab" onClick={openReporter} aria-label={t('reportProblem')}><Bug size={20}/><span>{t('reportProblem')}</span></button>
    {open && <div className="bug-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
      <section ref={dialogRef} tabIndex="-1" className="bug-modal" role="dialog" aria-modal="true" aria-labelledby="bug-report-title">
        <header><div className="bug-modal-icon"><Bug size={20}/></div><div><span>{language === 'en' ? 'Help us improve' : 'Ayúdanos a mejorar'}</span><h2 id="bug-report-title">{language === 'en' ? 'Did you find something unusual?' : '¿Encontraste algo extraño?'}</h2></div><button type="button" onClick={close} aria-label={t('closeForm')}><X size={18}/></button></header>
        <p className="bug-intro">{language === 'en' ? 'Tell us what happened and how we can reproduce it. These details help us find and fix the problem.' : 'Cuéntanos qué pasó y cómo podemos repetirlo. Con esos datos será mucho más fácil encontrar y corregir el problema.'}</p>
        <div className="bug-section-label"><small>{language === 'en' ? 'You were viewing' : 'Estabas viendo'}</small><strong>{section}</strong></div>
        <form ref={formRef} noValidate onSubmit={submit}>
          <label><span>{bc.name} <small className="bug-required">{bc.required}</small></span><input required minLength="2" maxLength="80" autoComplete="name" value={report.name} onChange={event => update('name', event.target.value)} onBlur={() => validateField('name')} placeholder={bc.namePh} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'bug-error-name' : undefined}/>{errors.name && <small id="bug-error-name" className="bug-field-error" role="alert">{errors.name}</small>}</label>
          <label><span>{bc.email}</span><input type="email" maxLength="254" autoComplete="email" value={report.email} onChange={event => update('email', event.target.value)} onBlur={() => validateField('email')} placeholder={bc.emailPh} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'bug-error-email' : undefined}/>{errors.email && <small id="bug-error-email" className="bug-field-error" role="alert">{errors.email}</small>}</label>
          <label className="bug-field-wide"><span>{bc.summary} <small className="bug-required">{bc.required}</small></span><input required maxLength="120" value={report.title} onChange={event => update('title', event.target.value)} onBlur={() => validateField('title')} placeholder={bc.summaryPh} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? 'bug-error-title' : undefined}/>{errors.title && <small id="bug-error-title" className="bug-field-error" role="alert">{errors.title}</small>}</label>
          <label><span>{bc.type} <small className="bug-required">{bc.required}</small></span><select required value={report.type} onChange={event => update('type', event.target.value)} onBlur={() => validateField('type')} aria-invalid={Boolean(errors.type)} aria-describedby={errors.type ? 'bug-error-type' : undefined}><option value="" disabled>{bc.typePh}</option>{bc.types.map(type => <option key={type}>{type}</option>)}</select>{errors.type && <small id="bug-error-type" className="bug-field-error" role="alert">{errors.type}</small>}</label>
          <label className="bug-field-wide"><span>{bc.happened} <small className="bug-required">{bc.required}</small></span><textarea required minLength="10" maxLength="3000" rows="4" value={report.description} onChange={event => update('description', event.target.value)} onBlur={() => validateField('description')} placeholder={bc.happenedPh} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'bug-error-description' : undefined}/>{errors.description && <small id="bug-error-description" className="bug-field-error" role="alert">{errors.description}</small>}</label>
          <label className="bug-field-wide"><span>{bc.repeat}</span><textarea maxLength="3000" rows="3" value={report.steps} onChange={event => update('steps', event.target.value)} placeholder={bc.repeatPh}/></label>
          <label className="bug-honeypot" aria-hidden="true"><span>{bc.website}</span><input tabIndex="-1" autoComplete="off" value={report.website} onChange={event => update('website', event.target.value)}/></label>
          {copyStatus && <p className={`bug-copy-status bug-copy-status-${statusTone}`} role="status" aria-live="polite">{copyStatus}</p>}
          <div className="bug-form-actions"><p><Bug size={13}/> {bc.delivery}</p><button type="button" disabled={sending} onClick={close}>{bc.later}</button><button className="copy-report" type="button" disabled={sending} onClick={copyReport}><ClipboardCopy size={15}/> {bc.copy}</button><button type="submit" disabled={sending}>{sending ? bc.sending : bc.send} <Bug size={15}/></button></div>
        </form>
      </section>
    </div>}
  </>;
}
