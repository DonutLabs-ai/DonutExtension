import { create } from 'zustand';
import {
  initPegasusZustandStoreBackend,
  pegasusZustandStoreReady,
} from '@webext-pegasus/store-zustand';

interface WalletState {
  address: string | null;
  setAddress: (addr: string | null) => void;
}

// Create base zustand store
export const useWalletStore = create<WalletState>(set => ({
  address: null,
  setAddress: addr => set({ address: addr }),
}));

// Store name for cross-environment sharing
export const WALLET_STORE_NAME = 'donut-wallet-store';

// Initialize store backend in background
export const initWalletStoreBackend = () =>
  initPegasusZustandStoreBackend(WALLET_STORE_NAME, useWalletStore, {
    storageStrategy: 'local',
  });

// Wait for store to be ready in other environments
export const walletStoreReady = () => pegasusZustandStoreReady(WALLET_STORE_NAME, useWalletStore);
