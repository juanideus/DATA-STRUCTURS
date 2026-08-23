import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import App from './App.jsx';
import AppErrorBoundary from './components/AppErrorBoundary.jsx';
import { AccessibilityProvider } from './accessibility/AccessibilityContext.jsx';
import { LanguageProvider } from './i18n.jsx';
import './styles.css';
import './accessibility.css';

const isLocalEnvironment = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
const root = document.getElementById('root');

// El build incluye contenido HTML rastreable. React lo reemplaza por la aplicación interactiva.
root.replaceChildren();

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <LanguageProvider><AccessibilityProvider><App /></AccessibilityProvider></LanguageProvider>
      {!isLocalEnvironment && <Analytics />}
      {!isLocalEnvironment && <SpeedInsights />}
    </AppErrorBoundary>
  </React.StrictMode>,
);
