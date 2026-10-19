import { useEffect, useRef, useState } from 'react';
import { loadTurnstile } from '../logic/turnstileLoader.js';

export default function TurnstileWidget({ siteKey, language, onToken, onError, resetSignal }) {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const callbacksRef = useRef({ onToken, onError });
  callbacksRef.current = { onToken, onError };
  const [phase, setPhase] = useState('loading');

  useEffect(() => {
    let active = true;
    let widget = null;
    const fail = () => {
      if (!active) return;
      setPhase('error');
      callbacksRef.current.onToken('');
      callbacksRef.current.onError();
    };
    setPhase('loading');
    callbacksRef.current.onToken('');
    loadTurnstile().then(turnstile => {
      if (!active || !containerRef.current) return;
      setPhase('ready');
      const id = turnstile.render(containerRef.current, {
        sitekey: siteKey,
        action: 'report',
        theme: document.documentElement.dataset.darkMode === 'true' ? 'dark' : 'light',
        language: language === 'en' ? 'en' : 'es',
        callback: token => {
          if (!active) return;
          setPhase('ready');
          callbacksRef.current.onToken(token);
        },
        'expired-callback': fail,
        'error-callback': () => {
          fail();
          return true;
        },
      });
      if (id === null || id === undefined) throw new Error('TURNSTILE_WIDGET_UNAVAILABLE');
      widget = { id, api: turnstile, fail };
      widgetRef.current = widget;
    }).catch(fail);

    return () => {
      active = false;
      if (widgetRef.current === widget) widgetRef.current = null;
      if (widget) {
        // Removal failure must not notify an unmounted component or another widget.
        try { widget.api.remove(widget.id); } catch { /* The container is being removed. */ }
      }
    };
  }, [language, siteKey]);

  useEffect(() => {
    if (!resetSignal) return;
    callbacksRef.current.onToken('');
    const widget = widgetRef.current;
    if (!widget) return;
    try {
      setPhase('ready');
      widget.api.reset(widget.id);
    } catch {
      widget.fail();
    }
  }, [resetSignal]);

  return <div className="bug-turnstile-widget">
    <div ref={containerRef}/>
    {phase === 'loading' && <small role="status">{language === 'en' ? 'Loading security verification…' : 'Cargando verificación de seguridad…'}</small>}
    {phase === 'error' && <small role="status">{language === 'en'
      ? 'Security verification is unavailable. Close and reopen this form to try again.'
      : 'La verificación de seguridad no está disponible. Cierra y vuelve a abrir el formulario para reintentar.'}</small>}
  </div>;
}
