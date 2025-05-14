import React from 'react';
import { createRoot } from 'react-dom/client';
import InjectModals from '@/pages/InjectModals';
import '@/assets/styles/index.css';
import { initContentTransport } from '@/utils/transport';
import { getTokenService } from '@/services/tokenService';
import { initStoreReady } from '@/stores';

let shadowRootContainer: HTMLElement | null = null;

export function getShadowRootContainer() {
  return shadowRootContainer;
}

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    try {
      // Initialize transport layer
      initContentTransport();

      // Wait for all stores to be ready
      await initStoreReady();

      // Initialize token data
      const tokenService = getTokenService();
      try {
        // Refresh token data - stores will automatically sync to all environments
        await tokenService.getTokens();
        await Promise.all([tokenService.refreshBalances(), tokenService.refreshPrices()]);
      } catch (err) {
        console.error('Failed to fetch initial token data', err);
      }

      // Create UI
      const ui = await createShadowRootUi(ctx, {
        name: 'donut-extension-ui',
        position: 'overlay',
        anchor: 'body',
        mode: 'closed',
        onMount: container => {
          shadowRootContainer = container;

          const root = createRoot(container);
          root.render(React.createElement(InjectModals));

          return root;
        },
        onRemove: root => {
          if (root) root.unmount();
          shadowRootContainer = null;
        },
      });

      ui.mount();
    } catch (error) {
      console.error('Fatal initialization error:', error);
    }
  },
});
