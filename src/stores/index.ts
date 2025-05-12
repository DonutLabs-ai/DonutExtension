import { initTokenStoreBackend, tokenStoreReady } from './tokenStore';
import { initWalletStoreBackend, walletStoreReady } from './walletStore';
import { initSwapStoreBackend, swapStoreReady } from './swapStore';
import { initPopupEventStoreBackend, popupEventStoreReady } from './popupEventStore';

export * from './tokenStore';
export * from './walletStore';
export * from './swapStore';
export * from './popupEventStore';

export const initStoreBackend = () => {
  return Promise.all([
    initTokenStoreBackend(),
    initWalletStoreBackend(),
    initSwapStoreBackend(),
    initPopupEventStoreBackend(),
  ]);
};

export const initStoreReady = () => {
  return Promise.all([
    tokenStoreReady(),
    walletStoreReady(),
    swapStoreReady(),
    popupEventStoreReady(),
  ]);
};
