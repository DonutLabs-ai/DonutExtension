import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { initPopupTransport } from '@/utils/transport';
import { initStoreReady } from '@/stores';
// Initialization function
async function initializePopup() {
  try {
    // Initialize transport layer
    initPopupTransport();

    // Wait for all stores to be ready
    await initStoreReady();

    // Render application
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Fatal initialization error:', error);
    // Show error message in UI
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; color: red; font-family: sans-serif;">
          <h2>Initialization Error</h2>
          <p>An error occurred while loading the extension. Please try restarting your browser.</p>
          <p>Error details: ${error instanceof Error ? error.message : String(error)}</p>
        </div>
      `;
    }
  }
}

// Start initialization
initializePopup();
