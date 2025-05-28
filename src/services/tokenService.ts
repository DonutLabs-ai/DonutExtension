import { defineProxyService } from '@webext-core/proxy-service';
import { useTokenStore, type TokenInfo, getTokens } from '@/stores/tokenStore';
import { useWalletStore } from '@/stores/walletStore';
import { fetchWithRetry, isFulfilled } from '@/utils/fetch';

// ---- Constants ----
const TOKEN_LIST_TTL = 6 * 60 * 60 * 1000; // 6 hours
const PRICE_REFRESH_INTERVAL = 28 * 1000; // 28s
const BALANCE_REFRESH_INTERVAL = 9 * 1000; // 9s

// API Fetch settings
const API_TIMEOUT = 15000; // 15 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // Starting delay in ms

const JUP_BASE_TOKEN_URL = 'https://lite-api.jup.ag/tokens/v1';
const JUP_BASE_BALANCE_URL = 'https://lite-api.jup.ag/ultra/v1/balances';
const JUP_BASE_PRICE_URL = 'https://lite-api.jup.ag/price/v2';

interface JupiterToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
}

class TokenService {
  // Only track the last fetch time, no token data duplication
  private lastTokenListFetch = 0;
  private lastBalanceFetch = 0;
  private lastPriceFetch = 0;

  // Active refresh promises for debouncing
  private activeTokenListRefresh: Promise<void> | null = null;
  private activeBalanceRefresh: Promise<void> | null = null;
  private activePriceRefresh: Promise<void> | null = null;

  // ---- Public (proxied) methods ----
  async getTokens(): Promise<TokenInfo[]> {
    if (
      Date.now() - this.lastTokenListFetch > TOKEN_LIST_TTL ||
      Object.keys(useTokenStore.getState().tokens).length === 0
    ) {
      await this.refreshTokenList();
    }
    // If prices not yet populated, trigger one-time refresh
    return getTokens();
  }

  // ---- Internal helpers ----
  async refreshTokenList(): Promise<void> {
    // If there's an active refresh, return that promise
    if (this.activeTokenListRefresh) return this.activeTokenListRefresh;

    // Check time interval (debounce)
    if (Date.now() - this.lastTokenListFetch < TOKEN_LIST_TTL) return;

    // Set up the refresh promise
    this.activeTokenListRefresh = (async () => {
      try {
        // Use enhanced fetch with retry logic
        const data = await fetchWithRetry<JupiterToken[]>(
          `${JUP_BASE_TOKEN_URL}/tagged/verified`,
          {},
          {
            timeout: API_TIMEOUT,
            maxRetries: MAX_RETRIES,
            retryDelay: RETRY_DELAY,
          }
        );

        // Take top 50 tokens and normalize to TokenInfo
        const topTokens = data.slice(0, 100).map(
          (t: JupiterToken): TokenInfo => ({
            mint: t.address,
            symbol: t.symbol,
            name: t.name,
            decimals: t.decimals,
            logoURI: t.logoURI,
            balance: '0',
            uiBalance: 0,
            price: '0',
          })
        );

        this.lastTokenListFetch = Date.now();

        // Update store with tokens array
        useTokenStore.getState().setTokens(topTokens);
      } catch (err) {
        console.error('[TokenService] Failed to refresh token list', err);
        // Optionally trigger analytics or monitoring here
      } finally {
        // Clear the active promise
        this.activeTokenListRefresh = null;
      }
    })();

    return this.activeTokenListRefresh;
  }

  // Fetch information about a specific token by address
  async fetchTokenInfo(address: string): Promise<TokenInfo | null> {
    try {
      // Use enhanced fetch with shorter timeout and fewer retries for individual token info
      const token = await fetchWithRetry<JupiterToken>(
        `${JUP_BASE_TOKEN_URL}/token/${address}`,
        {},
        {
          timeout: 10000, // Shorter timeout for individual token fetches
          maxRetries: 2, // Fewer retries for individual token fetches
        }
      );

      if (!token) return null;

      return {
        mint: token.address,
        symbol: token.symbol ?? 'UNKNOWN',
        name: token.name ?? 'Unknown Token',
        decimals: token.decimals ?? 0,
        logoURI: token.logoURI ?? '',
        balance: '0',
        uiBalance: 0,
        price: '0',
        isUserDiscovered: true,
      };
    } catch (err) {
      console.error('[TokenService] Failed to fetch token info', address, err);
      return null;
    }
  }

  async refreshBalances(): Promise<void> {
    // If there's an active refresh, return that promise
    if (this.activeBalanceRefresh) return this.activeBalanceRefresh;

    // Check time interval (debounce)
    if (Date.now() - this.lastBalanceFetch < BALANCE_REFRESH_INTERVAL) return;

    const walletAddress = useWalletStore.getState().address;
    if (!walletAddress) return;

    // Set up the refresh promise
    this.activeBalanceRefresh = (async () => {
      try {
        // Use enhanced fetch with retry logic
        const json = await fetchWithRetry<
          Record<string, { amount: string; uiAmount: number; slot: number; isFrozen: boolean }>
        >(
          `${JUP_BASE_BALANCE_URL}/${walletAddress}`,
          {},
          {
            timeout: API_TIMEOUT,
            maxRetries: MAX_RETRIES,
            retryDelay: RETRY_DELAY,
          }
        );

        // Access store tokens
        const storeState = useTokenStore.getState();
        const tokensByMint = storeState.tokens;

        // Balance map to update store
        const balanceMap: Record<string, { balance: string; uiBalance: number }> = {};
        // Track unknown tokens
        const unknownTokenAddresses = new Set<string>();
        // Pre-process balance data for faster access
        const balanceData = new Map<string, { amount: string; uiAmount: number }>();

        // Pre-process balance data
        Object.entries(json).forEach(([mint, info]) => {
          balanceData.set(mint, {
            amount: info.amount,
            uiAmount: info.uiAmount,
          });
        });

        // Process the balances response
        for (const [mint, info] of balanceData.entries()) {
          const token = tokensByMint[mint];

          if (token) {
            // Found in our known tokens
            balanceMap[mint] = {
              balance: info.amount,
              uiBalance: info.uiAmount,
            };
          } else {
            if (mint !== 'SOL') {
              // Unknown token - add to fetch list
              unknownTokenAddresses.add(mint);
            }
          }
        }

        // Fetch any unknown tokens - use Promise.allSettled to handle partial failures
        if (unknownTokenAddresses.size > 0) {
          const fetchPromises = Array.from(unknownTokenAddresses).map(this.fetchTokenInfo);
          const results = await Promise.allSettled(fetchPromises);

          // Process valid tokens - handle mixed successes and failures
          const validTokens = results
            .filter(
              (result): result is PromiseFulfilledResult<TokenInfo> =>
                isFulfilled(result) && result.value !== null
            )
            .map(result => result.value);

          for (const token of validTokens) {
            // Add to store if not already there
            if (!tokensByMint[token.mint]) {
              // We'll add it when updating the store with newTokens below
              const balanceInfo = balanceData.get(token.mint);
              if (balanceInfo) {
                token.balance = balanceInfo.amount;
                token.uiBalance = balanceInfo.uiAmount;
                balanceMap[token.mint] = {
                  balance: balanceInfo.amount,
                  uiBalance: balanceInfo.uiAmount,
                };
              }
            }
          }

          // If we found any new valid tokens, add them to the store
          if (validTokens.length > 0) {
            // Create a new tokens array with all existing tokens plus new ones
            const allTokens = [...getTokens(), ...validTokens.filter(t => !tokensByMint[t.mint])];

            // Sort by UI balance (descending)
            allTokens.sort((a, b) => {
              const aBalance = balanceMap[a.mint]?.uiBalance || a.uiBalance;
              const bBalance = balanceMap[b.mint]?.uiBalance || b.uiBalance;
              return bBalance - aBalance;
            });

            // Update store with all tokens
            storeState.setTokens(allTokens);
          }
        } else {
          // Update balances for existing tokens
          // We only need to call updateBalances since we're not adding new tokens
          storeState.updateBalances(balanceMap);
        }

        // Update last fetch timestamp
        this.lastBalanceFetch = Date.now();
      } catch (err) {
        console.error('[TokenService] Failed to refresh balances', err);
        // Log detailed error information for debugging
        if (err instanceof Error) {
          console.debug('[TokenService] Error details:', {
            message: err.message,
            stack: err.stack,
            name: err.name,
          });
        }
      } finally {
        // Clear the active promise
        this.activeBalanceRefresh = null;
      }
    })();

    return this.activeBalanceRefresh;
  }

  async refreshPrices(): Promise<void> {
    // If there's an active refresh, return that promise
    if (this.activePriceRefresh) return this.activePriceRefresh;

    // Check time interval (debounce)
    if (Date.now() - this.lastPriceFetch < PRICE_REFRESH_INTERVAL) return;

    // Set up the refresh promise
    this.activePriceRefresh = (async () => {
      try {
        const tokensByMint = useTokenStore.getState().tokens;
        if (Object.keys(tokensByMint).length === 0) return;

        const mints = Object.keys(tokensByMint);
        const chunks: string[][] = [];
        for (let i = 0; i < mints.length; i += 100) {
          chunks.push(mints.slice(i, i + 100));
        }

        const priceMap: Record<string, string> = {};

        // Use Promise.allSettled to handle partial failures
        const results = await Promise.allSettled(
          chunks.map(async group => {
            const url = `${JUP_BASE_PRICE_URL}?ids=${group.join(',')}`;
            // Use enhanced fetch with retry logic
            const json = await fetchWithRetry<{
              data: Record<string, { id: string; price?: string }>;
            }>(
              url,
              {},
              {
                timeout: API_TIMEOUT,
                maxRetries: MAX_RETRIES,
                retryDelay: RETRY_DELAY,
              }
            );
            const keyed = json.data || {};
            Object.values(keyed).forEach(item => {
              priceMap[item.id] = item.price ?? '0';
            });
          })
        );

        // Log any chunk failures but continue with partial data
        results.forEach((result, index) => {
          if (!isFulfilled(result)) {
            console.warn(`[TokenService] Price chunk ${index} failed:`, result.reason);
          }
        });

        // Update prices directly via the store if we have any data
        if (Object.keys(priceMap).length > 0) {
          useTokenStore.getState().updatePrices(priceMap);
        }

        // Update last fetch timestamp
        this.lastPriceFetch = Date.now();
      } catch (err) {
        console.error('[TokenService] Failed to refresh prices', err);
      } finally {
        // Clear the active promise
        this.activePriceRefresh = null;
      }
    })();

    return this.activePriceRefresh;
  }
}

// ---- register service ----
export const [registerTokenService, getTokenService] = defineProxyService(
  'tokenService',
  () => new TokenService()
);
