import { defineProxyService } from '@webext-core/proxy-service';
import { useTokenStore, type TokenInfo } from '@/stores/tokenStore';
import { useWalletStore } from '@/stores/walletStore';

// ---- Constants ----
const TOKEN_LIST_TTL = 6 * 60 * 60 * 1000; // 6 hours
const BALANCE_REFRESH_INTERVAL = 30 * 1000; // 30s
const PRICE_REFRESH_INTERVAL = 30 * 1000; // 30s

const JUP_BASE_TOKEN_URL = 'https://lite-api.jup.ag/tokens/v1';
const JUP_BASE_BALANCE_URL = 'https://lite-api.jup.ag/ultra/v1/balances';
const JUP_BASE_PRICE_URL = 'https://lite-api.jup.ag/price/v2';

class TokenService {
  private tokens: TokenInfo[] = [];
  private lastTokenListFetch = 0;

  // ---- Public (proxied) methods ----
  async getTokens(): Promise<TokenInfo[]> {
    if (Date.now() - this.lastTokenListFetch > TOKEN_LIST_TTL || this.tokens.length === 0) {
      await this.refreshTokenList();
    }
    // If prices not yet populated, trigger one-time refresh
    if (this.tokens.some(t => !t.price || t.price === 0)) {
      await this.refreshPrices();
    }
    return this.tokens;
  }

  // ---- Internal helpers ----
  async refreshTokenList(force = false) {
    if (!force && Date.now() - this.lastTokenListFetch < TOKEN_LIST_TTL) return;
    try {
      const res = await fetch(`${JUP_BASE_TOKEN_URL}/tagged/verified`);
      const data = await res.json();
      // Normalize to TokenInfo
      this.tokens = data.slice(0, 50).map((t: any) => ({
        mint: t.address,
        symbol: t.symbol,
        name: t.name,
        decimals: t.decimals,
        logoURI: t.logoURI,
        balance: '0',
        uiBalance: 0,
        price: 0,
      })) as TokenInfo[];
      this.lastTokenListFetch = Date.now();
      useTokenStore.getState().setTokens(this.tokens);
    } catch (err) {
      console.error('[TokenService] Failed to refresh token list', err);
    }
  }

  async refreshBalances() {
    const walletAddress = useWalletStore.getState().address;
    if (!walletAddress) return;

    try {
      const res = await fetch(`${JUP_BASE_BALANCE_URL}/${walletAddress}`);
      const json = await res.json();
      // json looks like { "SOL": { amount: '0', uiAmount: 0, ... }, ... }
      const balanceMap: Record<string, { balance: string; uiBalance: number }> = {};
      Object.entries(json).forEach(([symbol, info]: [string, any]) => {
        const token = this.tokens.find(t => t.symbol === symbol);
        if (token) {
          balanceMap[token.mint] = {
            balance: info.amount,
            uiBalance: info.uiAmount,
          };
        }
      });
      if (Object.keys(balanceMap).length > 0) {
        // mutate local cache
        this.tokens = this.tokens.map(t => {
          const upd = balanceMap[t.mint];
          return upd ? { ...t, uiBalance: upd.uiBalance, balance: upd.balance } : t;
        });
        useTokenStore.getState().updateBalances(balanceMap);
      }
    } catch (err) {
      console.error('[TokenService] Failed to refresh balances', err);
    }
  }

  async refreshPrices() {
    if (this.tokens.length === 0) return;
    const ids = this.tokens.map(t => t.mint);
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 100) {
      chunks.push(ids.slice(i, i + 100));
    }
    const priceMap: Record<string, number> = {};
    try {
      await Promise.all(
        chunks.map(async group => {
          const url = `${JUP_BASE_PRICE_URL}?ids=${group.join(',')}`;
          const res = await fetch(url);
          const json = await res.json();
          const keyed = json.data || {};
          Object.values(keyed).forEach((item: any) => {
            priceMap[item.id] = item.price ?? item.buyPrice ?? 0;
          });
        })
      );
      if (Object.keys(priceMap).length > 0) {
        // mutate local cache
        this.tokens = this.tokens.map(t => {
          const p = priceMap[t.mint];
          return p !== undefined ? { ...t, price: p } : t;
        });
        useTokenStore.getState().updatePrices(priceMap);
      }
    } catch (err) {
      console.error('[TokenService] Failed to refresh prices', err);
    }
  }
}

// ---- register service ----
export const [registerTokenService, getTokenService] = defineProxyService(
  'tokenService',
  () => new TokenService()
);

// Helper to start background timers after registration
export function startTokenServiceSchedulers() {
  const service = getTokenService();
  // Initial refreshes
  service.refreshTokenList(true);
  service.refreshBalances();
  service.refreshPrices();

  // Schedulers
  setInterval(() => service.refreshTokenList(false), TOKEN_LIST_TTL);
  setInterval(() => service.refreshBalances(), BALANCE_REFRESH_INTERVAL);
  setInterval(() => service.refreshPrices(), PRICE_REFRESH_INTERVAL);
}
