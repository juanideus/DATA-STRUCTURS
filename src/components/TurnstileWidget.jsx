import { useEffect, useRef, useState } from 'react';

const SCRIPT_ID = 'dsa-turnstile-script';
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let loader;

const loadTurnstile = () => {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (loader) return loader;

  loader = new Promise((resolve, reject) => {
    const finish = () => window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile no está disponible.'));
    let script = document.getElementById(SCRIPT_ID);
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = SCRIPT_URL;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', finish, { once: true });
    script.addEventListener('error', () => reject(new Error('No se pudo cargar Turnstile.')), { once: true });
  }).catch(error => {
    loader = null;
    throw error;
  });

  return loader;
};

export default function TurnstileWidget({ siteKey, language, onToken, onError, resetSignal }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadTurnstile().then(turnstile => {
      if (!active || !containerRef.current) return;
      widgetIdRef.current = turnstile.render(containerRef.current, {
        sitekey: siteKey,
        action: 'report',
        theme: 'light',
        language: language === 'en' ? 'en' : 'es',
        callback: token => {
          setLoading(false);
          onToken(token);
        },
        'expired-callback': () => {
          onToken('');
          onError();
        },
        'error-callback': () => {
          setLoading(false);
          onToken('');
          onError();
          return true;
        },
      });
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setLoading(false);
      onToken('');
      onError();
    });

    return () => {
      active = false;
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [language, onError, onToken, siteKey]);

  useEffect(() => {
    if (!resetSignal || widgetIdRef.current === null || !window.turnstile) return;
    window.turnstile.reset(widgetIdRef.current);
    onToken('');
  }, [onToken, resetSignal]);

  return <div className="bug-turnstile-widget">
    <div ref={containerRef}/>
    {loading && <small>{language === 'en' ? 'Loading security verification…' : 'Cargando verificación de seguridad…'}</small>}
  </div>;
}
