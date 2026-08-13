import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import App from './App.jsx';
import AppErrorBoundary from './components/AppErrorBoundary.jsx';
import { LanguageProvider } from './i18n.jsx';
import './styles.css';

const isLocalEnvironment = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <LanguageProvider><App /></LanguageProvider>
      {!isLocalEnvironment && <Analytics />}
      {!isLocalEnvironment && <SpeedInsights />}
    </AppErrorBoundary>
  </React.StrictMode>,
);
