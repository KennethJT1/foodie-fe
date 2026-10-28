import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from '@/app/App';
import '@/styles/index.css';

async function boot() {
  // Statically false in production builds without mocks, so src/mocks is tree-shaken away.
  if (import.meta.env.VITE_USE_MOCKS === 'true') {
    const { startMocks } = await import('./mocks/browser');
    await startMocks();
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

boot();
