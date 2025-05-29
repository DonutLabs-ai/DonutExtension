import { create } from 'zustand';
import {
  initPegasusZustandStoreBackend,
  pegasusZustandStoreReady,
} from '@webext-pegasus/store-zustand';

export interface TokenInfo {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  balance: string; // raw amount string from API
  uiBalance: number; // balance / 10 ** decimals
  price: string; // USDC price
  isUserDiscovered?: boolean; // flag for tokens discovered from user's wallet but not in official list
}

interface TokenStoreState {
  tokens: Record<string, TokenInfo>; // key by mint address
  priceWatchList: string[]; // array of mint addresses that user is watching
  lastUpdated: {
    list: number;
    balance: number;
    price: number;
  };
  // actions
  setTokens: (list: TokenInfo[]) => void;
  updateBalances: (map: Partial<Record<string, { balance: string; uiBalance: number }>>) => void;
  updatePrices: (map: Partial<Record<string, string>>) => void;
  // watchList actions
  addToWatchList: (mint: string) => void;
  removeFromWatchList: (mint: string) => void;
  toggleWatchList: (mint: string) => void;
  isInWatchList: (mint: string) => boolean;
}

// Create base zustand store
export const useTokenStore = create<TokenStoreState>((set, get) => ({
  tokens: {},
  priceWatchList: [
    'SonicxvLud67EceaEzCLRnMTBqzYUUYNr93DBkBdDES', // SONIC
    'So11111111111111111111111111111111111111112', // SOL
    '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh', // BTC
    '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // ETH
  ],
  lastUpdated: {
    list: 0,
    balance: 0,
    price: 0,
  },
  setTokens: list => {
    const tokensMap: Record<string, TokenInfo> = {};
    list.forEach(token => {
      tokensMap[token.mint] = token;
    });

    set({
      tokens: tokensMap,
      lastUpdated: {
        ...get().lastUpdated,
        list: Date.now(),
      },
    });
  },
  updateBalances: balanceMap => {
    set(state => {
      const updatedTokens = { ...state.tokens };

      Object.entries(balanceMap).forEach(([mint, data]) => {
        if (updatedTokens[mint]) {
          updatedTokens[mint] = {
            ...updatedTokens[mint],
            ...data,
          };
        }
      });

      return {
        tokens: updatedTokens,
        lastUpdated: {
          ...state.lastUpdated,
          balance: Date.now(),
        },
      };
    });
  },
  updatePrices: priceMap => {
    set(state => {
      const updatedTokens = { ...state.tokens };

      Object.entries(priceMap).forEach(([mint, price]) => {
        if (updatedTokens[mint]) {
          updatedTokens[mint] = {
            ...updatedTokens[mint],
            price: price ?? '0',
          };
        }
      });

      return {
        tokens: updatedTokens,
        lastUpdated: {
          ...state.lastUpdated,
          price: Date.now(),
        },
      };
    });
  },
  // Watchlist management methods
  addToWatchList: mint => {
    set(state => {
      if (!state.priceWatchList.includes(mint)) {
        return {
          priceWatchList: [mint, ...state.priceWatchList],
        };
      }
      return state;
    });
  },
  removeFromWatchList: mint => {
    set(state => ({
      priceWatchList: state.priceWatchList.filter(m => m !== mint),
    }));
  },
  toggleWatchList: mint => {
    set(state => {
      if (state.priceWatchList.includes(mint)) {
        return {
          priceWatchList: state.priceWatchList.filter(m => m !== mint),
        };
      } else {
        return {
          priceWatchList: [mint, ...state.priceWatchList],
        };
      }
    });
  },
  isInWatchList: (mint: string): boolean => {
    return get().priceWatchList.includes(mint);
  },
}));

// Store name for cross-environment sharing
export const TOKEN_STORE_NAME = 'donut-token-store';

// Initialize store backend in background
export const initTokenStoreBackend = () =>
  initPegasusZustandStoreBackend(TOKEN_STORE_NAME, useTokenStore, {
    storageStrategy: 'local',
  });

// Wait for store to be ready in other environments
export const tokenStoreReady = () => pegasusZustandStoreReady(TOKEN_STORE_NAME, useTokenStore);

// Helper to get tokens synchronously (non-reactive)
export function getTokens(): TokenInfo[] {
  return Object.values(useTokenStore.getState().tokens);
}
