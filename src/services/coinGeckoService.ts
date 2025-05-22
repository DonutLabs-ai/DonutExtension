import { defineProxyService } from '@webext-core/proxy-service';

/**
 * Interface for coin search response
 */
export interface CoinSearchResult {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number;
  thumb: string;
  large: string;
}

/**
 * Interface for coin search API response
 */
export interface CoinSearchResponse {
  coins: CoinSearchResult[];
}

/**
 * Interface for market chart data point
 */
export interface MarketDataPoint {
  time: number;
  value: number;
}

/**
 * Interface for OHLC data point
 */
export interface OHLCDataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

/**
 * Interface for market chart data
 */
export interface MarketChartData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

/**
 * Interface for OHLC data response
 */
export interface OHLCData {
  ohlc: [number, number, number, number, number][];
}

/**
 * Available time periods for chart data
 */
export type ChartTimePeriod = '1d' | '7d' | '14d' | '30d' | '90d' | '180d' | '365d';

/**
 * CoinGecko API service
 */
class CoinGeckoService {
  private baseURL = 'https://api.coingecko.com/api/v3';

  /**
   * Search for coins by query
   * @param query Search query
   * @returns Search results
   */
  async searchCoins(query: string): Promise<CoinSearchResult[]> {
    try {
      const response = await fetch(`${this.baseURL}/search?query=${encodeURIComponent(query)}`, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = (await response.json()) as CoinSearchResponse;
      return data.coins || [];
    } catch (error) {
      console.error('[CoinGeckoService] Error searching coins:', error);
      return [];
    }
  }

  /**
   * Get coin ID from symbol
   * Best effort to find a coin ID from a symbol (not always accurate due to duplicate symbols)
   * @param symbol Coin symbol (e.g., 'BTC', 'ETH')
   * @returns Coin ID or null if not found
   */
  async getCoinIdFromSymbol(symbol: string): Promise<string | null> {
    try {
      const searchResults = await this.searchCoins(symbol);

      if (searchResults.length === 0) {
        return null;
      }

      // Try to find exact symbol match
      const exactMatch = searchResults.find(
        coin => coin.symbol.toLowerCase() === symbol.toLowerCase()
      );

      if (exactMatch) {
        return exactMatch.id;
      }

      // If no exact match, return first result
      return searchResults[0].id;
    } catch (error) {
      console.error('[CoinGeckoService] Error getting coin ID:', error);
      return null;
    }
  }

  /**
   * Get time period in days for API request
   * @param period Time period
   * @returns Days as string
   */
  private getTimeInDays(period: ChartTimePeriod): string {
    switch (period) {
      case '1d':
        return '1';
      case '7d':
        return '7';
      case '14d':
        return '14';
      case '30d':
        return '30';
      case '90d':
        return '90';
      case '180d':
        return '180';
      case '365d':
        return '365';
      default:
        return '7';
    }
  }

  /**
   * Get market chart data for a coin
   * @param coinId Coin ID
   * @param currency Currency (default: 'usd')
   * @param period Time period (default: '7d')
   * @returns Market chart data
   */
  async getMarketChart(
    coinId: string,
    currency = 'usd',
    period: ChartTimePeriod = '7d'
  ): Promise<MarketDataPoint[]> {
    try {
      const days = this.getTimeInDays(period);
      const url = `${this.baseURL}/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}`;

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = (await response.json()) as MarketChartData;

      // Transform the data for use with lightweight-charts
      return data.prices.map(([timestamp, price]: [number, number]) => ({
        time: timestamp / 1000, // Convert milliseconds to seconds
        value: price,
      }));
    } catch (error) {
      console.error('[CoinGeckoService] Error fetching market chart:', error);
      return [];
    }
  }

  /**
   * Get coin OHLC data
   * @param coinId Coin ID
   * @param currency Currency (default: 'usd')
   * @param period Time period (default: '7d')
   * @returns OHLC data points
   */
  async getCoinOHLC(
    coinId: string,
    currency = 'usd',
    period: ChartTimePeriod = '7d'
  ): Promise<OHLCDataPoint[]> {
    try {
      // For OHLC, CoinGecko only supports specific time periods: 1, 7, 14, 30, 90, 180, 365 days
      const days = this.getTimeInDays(period);
      const url = `${this.baseURL}/coins/${coinId}/ohlc?vs_currency=${currency}&days=${days}`;

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      // CoinGecko returns OHLC data as an array of [timestamp, open, high, low, close]
      const data = (await response.json()) as [number, number, number, number, number][];

      // Transform the data for use with lightweight-charts
      return data.map(([timestamp, open, high, low, close]) => ({
        time: timestamp / 1000, // Convert milliseconds to seconds
        open,
        high,
        low,
        close,
      }));
    } catch (error) {
      console.error('[CoinGeckoService] Error fetching OHLC data:', error);
      return [];
    }
  }
}

// Create service instance
const coinGeckoService = new CoinGeckoService();

// Export the proxy service for use in components
export const [registerCoinGeckoService, getCoinGeckoService] = defineProxyService(
  'coinGeckoService',
  () => coinGeckoService
);

// Default export for convenience
export default getCoinGeckoService;
