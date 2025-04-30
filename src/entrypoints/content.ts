import React from 'react';
import { createRoot } from 'react-dom/client';
import InjectModals from '@/pages/InjectModals';
import '@/assets/styles/index.css';

let shadowRootContainer: HTMLElement | null = null;

export function getShadowRootContainer() {
  return shadowRootContainer;
}

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  async main(ctx) {
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

    await injectScript('/buildDomTree.js', {
      keepInDom: true,
    });

    console.log('Donut Extension content script loaded');
  },
});
