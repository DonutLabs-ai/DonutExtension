import { create } from 'zustand';
import {
  initPegasusZustandStoreBackend,
  pegasusZustandStoreReady,
} from '@webext-pegasus/store-zustand';

export interface SwapRecord {
  id: string; // unique ID for the swap action
  timestamp: number; // epoch ms
  inputMint: string;
  outputMint: string;
  amountIn: string; // raw string amount in input token's decimals
  amountOut: string; // raw string amount in output token's decimals
  txSignature: string; // confirmed signature
}

interface SwapStoreState {
  history: SwapRecord[];
  addRecord: (rec: SwapRecord) => void;
  clear: () => void;
}

// Create base zustand store
export const useSwapStore = create<SwapStoreState>(set => ({
  history: [],
  addRecord: rec =>
    set(state => ({
      history: [rec, ...state.history].slice(0, 50), // keep only the 50 most recent records
    })),
  clear: () => set({ history: [] }),
}));

// Store name for cross-environment sharing
export const SWAP_STORE_NAME = 'donut-swap-store';

// Initialize store backend in background
export const initSwapStoreBackend = () =>
  initPegasusZustandStoreBackend(SWAP_STORE_NAME, useSwapStore, {
    storageStrategy: 'local',
  });

// Wait for store to be ready in other environments
export const swapStoreReady = () => pegasusZustandStoreReady(SWAP_STORE_NAME, useSwapStore);
