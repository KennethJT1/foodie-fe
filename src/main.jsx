import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from '@/app/App';
import '@/styles/index.css';

async function boot() {
  // Statically false in production builds without mocks, so src/mocks is tree-shaken away.
  if (import.meta.env.VITE_USE_MOCKS === 'true') {
    try {
      const { startMocks } = await import('./mocks/browser');
      await startMocks();
    } catch (error) {
      // Some embedded browsers block service workers; render anyway so the UI can be inspected.
      console.error('[KJT Foodie] Mock API failed to start. API calls will fail.', error);
    }
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

boot();
