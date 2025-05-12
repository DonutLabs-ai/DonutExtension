/**
 * @webext-pegasus/transport initialization
 *
 * This file is responsible for initializing the transport layer for different browser extension environments
 * Each environment (background, content script, popup, etc.) needs to use the corresponding initialization function
 */

import { initPegasusTransport as initBackground } from '@webext-pegasus/transport/background';
import { initPegasusTransport as initContentScript } from '@webext-pegasus/transport/content-script';
import { initPegasusTransport as initPopup } from '@webext-pegasus/transport/popup';
import { initPegasusTransport as initWindow } from '@webext-pegasus/transport/window';

/**
 * Initialize transport layer for background script
 * Call this in background.ts
 */
export function initBackgroundTransport() {
  return initBackground();
}

/**
 * Initialize transport layer for content script
 * Call this in content.ts
 */
export function initContentTransport() {
  return initContentScript();
}

/**
 * Initialize transport layer for popup
 * Call this in popup/main.tsx
 */
export function initPopupTransport() {
  return initPopup();
}

/**
 * Initialize transport layer for injected page
 * Call this in injected page script
 */
export function initWindowTransport() {
  return initWindow();
}
