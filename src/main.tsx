console.log("main.tsx: Execution started");
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';

// Handle dynamic import failures (chunk load errors)
window.addEventListener('error', (e) => {
  if (e.message && (
    e.message.includes('Failed to fetch dynamically imported module') ||
    e.message.includes('Importing a dangling module') ||
    e.message.includes('Loading chunk') ||
    e.message.includes('MIME type')
  )) {
    console.warn('Dynamic import failed, refreshing page...', e.message);
    window.location.reload();
  }
}, true);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
);
