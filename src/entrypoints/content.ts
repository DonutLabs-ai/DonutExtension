import React from 'react';
import { createRoot } from 'react-dom/client';
import InjectModals from '@/pages/InjectModals';
import '@/assets/styles/index.css';
import { getTokenService } from '@/services/tokenService';
import { useTokenStore } from '@/store/tokenStore';
import { onTokenMessage } from '@/messaging/tokenMessaging';

let shadowRootContainer: HTMLElement | null = null;

export function getShadowRootContainer() {
  return shadowRootContainer;
}

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    // Initialize token store from background service
    const tokenService = getTokenService();
    try {
      const tokenList = await tokenService.getTokens();
      useTokenStore.getState().setTokens(tokenList);
      // Trigger immediate balance & price refresh for this tab
      await Promise.all([tokenService.refreshBalances(), tokenService.refreshPrices()]);
    } catch (err) {
      console.error('[Content] Failed to fetch initial token data', err);
    }

    // Subscribe to token updates via messaging
    onTokenMessage('token/tokensUpdated', message => {
      useTokenStore.getState().setTokens(message.data);
    });

    onTokenMessage('token/balanceUpdated', message => {
      useTokenStore.getState().updateBalances(message.data);
    });

    onTokenMessage('token/priceUpdated', message => {
      useTokenStore.getState().updatePrices(message.data);
    });

    const ui = await createShadowRootUi(ctx, {
      name: 'donut-extension-ui',
      position: 'overlay',
      anchor: 'body',
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

    console.log('Donut Extension content script loaded');
  },
});
