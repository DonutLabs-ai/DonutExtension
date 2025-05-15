import { initTokenStoreBackend, tokenStoreReady } from './tokenStore';
import { initWalletStoreBackend, walletStoreReady } from './walletStore';
import { initPopupEventStoreBackend, popupEventStoreReady } from './popupEventStore';
import { initCommandHistoryStoreBackend, commandHistoryStoreReady } from './commandHistoryStore';
export * from './tokenStore';
export * from './walletStore';
export * from './popupEventStore';
export * from './commandHistoryStore';

export const initStoreBackend = () => {
  return Promise.all([
    initTokenStoreBackend(),
    initWalletStoreBackend(),
    initPopupEventStoreBackend(),
    initCommandHistoryStoreBackend(),
  ]);
};

export const initStoreReady = () => {
  return Promise.all([
    tokenStoreReady(),
    walletStoreReady(),
    popupEventStoreReady(),
    commandHistoryStoreReady(),
  ]);
};
