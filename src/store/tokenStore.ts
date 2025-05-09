import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { customStorage } from './middlewares/customStorage';

export interface TokenInfo {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  balance: string; // raw amount string from API
  uiBalance: number; // balance / 10 ** decimals
  price: number; // USDC price
}

interface LastUpdated {
  list: number;
  balance: number;
  price: number;
}

interface TokenStoreState {
  tokens: Record<string, TokenInfo>; // key by mint address
  lastUpdated: LastUpdated;
  // actions
  setTokens: (list: TokenInfo[]) => void;
  updateBalances: (map: Partial<Record<string, { balance: string; uiBalance: number }>>) => void;
  updatePrices: (map: Partial<Record<string, number>>) => void;
}

const initialLastUpdated: LastUpdated = { list: 0, balance: 0, price: 0 };

export const useTokenStore = create(
  persist<TokenStoreState>(
    set => ({
      tokens: {},
      lastUpdated: initialLastUpdated,
      setTokens: list =>
        set(state => {
          const newMap: Record<string, TokenInfo> = {};
          list.forEach(t => {
            const existing = state.tokens[t.mint];
            newMap[t.mint] = { ...existing, ...t } as TokenInfo;
          });
          return { tokens: newMap, lastUpdated: { ...state.lastUpdated, list: Date.now() } };
        }),
      updateBalances: map =>
        set(state => {
          const updated: Record<string, TokenInfo> = { ...state.tokens };
          Object.entries(map).forEach(([mint, data]) => {
            if (!updated[mint]) return;
            updated[mint] = { ...updated[mint], ...data } as TokenInfo;
          });
          return { tokens: updated, lastUpdated: { ...state.lastUpdated, balance: Date.now() } };
        }),
      updatePrices: map =>
        set(state => {
          const updated: Record<string, TokenInfo> = { ...state.tokens };
          Object.entries(map).forEach(([mint, price]) => {
            if (!updated[mint]) return;
            updated[mint] = { ...updated[mint], price } as TokenInfo;
          });
          return { tokens: updated, lastUpdated: { ...state.lastUpdated, price: Date.now() } };
        }),
    }),
    {
      name: 'donut-token-store',
      storage: createJSONStorage(() => customStorage),
    }
  )
);

// Helper to get tokens synchronously (non-reactive)
export function getTokens(): TokenInfo[] {
  return Object.values(useTokenStore.getState().tokens);
}
