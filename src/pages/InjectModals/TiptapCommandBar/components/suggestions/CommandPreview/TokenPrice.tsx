import { useState, useEffect, useCallback } from 'react';
import { useTokenStore } from '@/stores/tokenStore';
import { getMCPService } from '@/services/mcpService';
import { isAddress } from '@/utils/address';
import { useDebouncedValue } from '@/hooks/useDebounce';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/shadcn/avatar';
import { Skeleton } from '@/components/shadcn/skeleton';
import { useTiptapCommandBarStore } from '../../../store/tiptapStore';
import { getDocVisualContent } from '../../../utils/editorUtils';
import CollectedIcon from '../../../images/collected.svg?react';
import UnCollectedIcon from '../../../images/uncollected.svg?react';

const SKELETON_COUNT = 5;
const DEBOUNCE_DELAY = 500;
const PRICE_REFRESH_INTERVAL = 10000; // 10 seconds

interface TokenData {
  mint: string;
  symbol: string;
  name: string;
  logoURI: string;
  current_price: number;
  price_change_percentage_24h: number;
}

const StarIcon = ({ isFavorited, onClick }: { isFavorited: boolean; onClick: () => void }) => (
  <button onClick={onClick} className="w-7 h-7 hover:bg-accent rounded transition-colors">
    {isFavorited ? <CollectedIcon /> : <UnCollectedIcon />}
  </button>
);

const PriceBadge = ({ value, isPositive }: { value: string; isPositive: boolean }) => (
  <div
    className={`px-2 py-0.5 rounded text-sm font-semibold ${
      isPositive ? 'bg-chart-2/30 text-chart-2' : 'bg-chart-4/30 text-chart-4'
    }`}
  >
    {value}
  </div>
);

const SkeletonItem = () => (
  <div className="flex items-center gap-2 py-1">
    <Skeleton className="w-7 h-7 rounded" />
    <Skeleton className="w-5 h-5 rounded-full" />
    <div className="flex-1 flex items-center gap-2">
      <Skeleton className="w-20 h-4 rounded" />
      <Skeleton className="w-12 h-4 rounded" />
    </div>
    <div className="flex items-center gap-2">
      <Skeleton className="w-16 h-6 rounded" />
      <Skeleton className="w-12 h-6 rounded" />
    </div>
  </div>
);

const EmptyState = ({ isSearch }: { isSearch: boolean }) => (
  <div className="text-center py-8">
    <div className="text-sm text-muted-foreground">
      {isSearch ? 'No tokens found' : 'No tokens in watchlist'}
    </div>
  </div>
);

const TokenPrice = () => {
  const { editor } = useTiptapCommandBarStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<TokenData[]>([]);
  const [watchListTokens, setWatchListTokens] = useState<TokenData[]>([]);
  // force update to avoid re-rendering the same token
  const [forceUpdate, setForceUpdate] = useState(0);

  const debouncedQuery = useDebouncedValue(searchQuery, DEBOUNCE_DELAY);

  const getStoreData = useCallback(() => useTokenStore.getState(), []);

  const fetchTokenPrices = useCallback(async (mints: string[]) => {
    if (mints.length === 0) return {};

    try {
      const mcpService = getMCPService();
      const result = await mcpService.callTool('GET_TOKEN_MARKET_INFO_BATCH', { tokens: mints });
      const text = result.content[0]?.text;

      if (!text) return {};

      const json = JSON.parse(text);
      if (json.status === 'success' && json.supportedTokens?.length > 0) {
        const marketData: Record<string, any> = {};
        json.supportedTokens.forEach((token: any) => {
          marketData[token.symbol.toLowerCase()] = token;
        });
        return marketData;
      }
    } catch (error) {
      console.error('Failed to fetch token prices:', error);
    }

    return {};
  }, []);

  const convertToken = useCallback(
    (token: any, marketData: Record<string, any> = {}): TokenData => {
      const tokenSymbol = (token.symbol || '').toLowerCase();
      const marketInfo = marketData[tokenSymbol];

      return {
        mint: token.mint,
        symbol: token.symbol.toUpperCase(),
        name: token.name,
        logoURI: token.logoURI,
        current_price: marketInfo?.current_price || parseFloat(token.price) || 0,
        price_change_percentage_24h: marketInfo?.price_change_percentage_24h || 0,
      };
    },
    []
  );

  const createFallbackTokens = useCallback(
    (priceWatchList: string[], tokens: Record<string, any>) => {
      return priceWatchList
        .map(mint => tokens[mint])
        .filter(Boolean)
        .map(token => ({
          mint: token.mint,
          symbol: token.symbol.toUpperCase(),
          name: token.name,
          logoURI: token.logoURI,
          current_price: parseFloat(token.price) || 0,
          price_change_percentage_24h: 0,
        }));
    },
    []
  );

  // Main functions
  const loadWatchListTokens = useCallback(async () => {
    const { tokens, priceWatchList } = getStoreData();

    if (priceWatchList.length === 0) {
      setWatchListTokens([]);
      return;
    }

    setLoading(true);

    try {
      const watchedTokens = priceWatchList.map(mint => tokens[mint]).filter(Boolean);

      if (watchedTokens.length > 0) {
        const mints = watchedTokens.map(t => t.mint);
        const marketData = await fetchTokenPrices(mints);
        const enrichedTokens = watchedTokens.map(token => convertToken(token, marketData));
        setWatchListTokens(enrichedTokens);
      } else {
        setWatchListTokens([]);
      }
    } catch (error) {
      console.error('Error loading watchlist tokens:', error);
      const fallbackTokens = createFallbackTokens(priceWatchList, getStoreData().tokens);
      setWatchListTokens(fallbackTokens);
    } finally {
      setLoading(false);
    }
  }, [getStoreData, fetchTokenPrices, convertToken, createFallbackTokens]);

  const searchTokens = useCallback(
    async (query: string) => {
      setLoading(true);

      try {
        const { tokens } = getStoreData();
        let results: TokenData[] = [];

        if (isAddress(query)) {
          // Search by address
          const marketData = await fetchTokenPrices([query]);
          const marketToken = Object.values(marketData)[0];
          if (marketToken) {
            results = [convertToken({ ...marketToken, mint: query }, marketData)];
          }
        } else {
          // Search by name/symbol
          const filteredTokens = Object.values(tokens)
            .filter(
              token =>
                token.symbol.toLowerCase().includes(query.toLowerCase()) ||
                token.name.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, SKELETON_COUNT);

          if (filteredTokens.length > 0) {
            const mints = filteredTokens.map(t => t.mint);
            const marketData = await fetchTokenPrices(mints);
            results = filteredTokens.map(token => convertToken(token, marketData));
          }
        }

        setSearchResults(results);
      } catch (error) {
        console.error('Error searching tokens:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    },
    [getStoreData, fetchTokenPrices, convertToken]
  );

  const refreshPrices = useCallback(async () => {
    const tokensToRefresh = debouncedQuery ? searchResults : watchListTokens;

    if (tokensToRefresh.length === 0) return;

    try {
      const symbols = tokensToRefresh.map(token => token.symbol.toLowerCase());
      const marketData = await fetchTokenPrices(symbols);

      const updateTokens = (tokens: TokenData[]) =>
        tokens.map(token => {
          const marketInfo = marketData[token.symbol.toLowerCase()];
          if (marketInfo) {
            return {
              ...token,
              current_price: marketInfo.current_price || token.current_price,
              price_change_percentage_24h:
                marketInfo.price_change_percentage_24h || token.price_change_percentage_24h,
            };
          }
          return token;
        });

      if (debouncedQuery) {
        setSearchResults(prev => updateTokens(prev));
      } else {
        setWatchListTokens(prev => updateTokens(prev));
      }
    } catch (error) {
      console.error('Error refreshing prices:', error);
    }
  }, [debouncedQuery, searchResults, watchListTokens, fetchTokenPrices]);

  const toggleWatchList = useCallback(
    (mint: string) => {
      const store = getStoreData();
      if (store.priceWatchList.includes(mint)) {
        store.removeFromWatchList(mint);
      } else {
        store.addToWatchList(mint);
      }
      setForceUpdate(prev => prev + 1);
    },
    [getStoreData]
  );

  const checkIsInWatchList = useCallback(
    (mint: string) => getStoreData().priceWatchList.includes(mint),
    [getStoreData]
  );

  useEffect(() => {
    if (!editor?.state?.doc) {
      setSearchQuery('');
      return;
    }
    const fullContent = getDocVisualContent(editor.state.doc);
    const query = fullContent.replace(/^\/\w+\s*/, '').trim();
    setSearchQuery(query);
  }, [editor?.state?.doc]);

  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      loadWatchListTokens();
    }
  }, [debouncedQuery, loadWatchListTokens]);

  useEffect(() => {
    if (!debouncedQuery) return;
    searchTokens(debouncedQuery);
  }, [debouncedQuery, searchTokens]);

  // Auto refresh prices every 10 seconds
  useEffect(() => {
    const interval = setInterval(refreshPrices, PRICE_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [refreshPrices]);

  // Render functions
  const renderTokenItem = (token: TokenData) => {
    const isPositive = token.price_change_percentage_24h >= 0;
    const isWatched = checkIsInWatchList(token.mint);

    return (
      <div key={`${token.mint}-${forceUpdate}`} className="flex items-center gap-2 py-1">
        <StarIcon isFavorited={isWatched} onClick={() => toggleWatchList(token.mint)} />

        <Avatar className="w-5 h-5">
          <AvatarImage src={token.logoURI} alt={token.symbol} />
          <AvatarFallback className="text-xs bg-muted text-muted-foreground">
            {token.symbol?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 flex items-center gap-2 text-base font-semibold text-foreground">
          <div className="truncate">{token.name}</div>
          <div>${token.symbol}</div>
        </div>

        <PriceBadge value={`$${token.current_price}`} isPositive={isPositive} />

        <PriceBadge
          value={`${isPositive ? '+' : ''}${token.price_change_percentage_24h.toFixed(2)}% (1d)`}
          isPositive={isPositive}
        />
      </div>
    );
  };

  // Main render
  const tokensToDisplay = debouncedQuery ? searchResults : watchListTokens;

  return (
    <div className="w-full">
      <div className="pb-3 break-all">
        {debouncedQuery ? `Search Results for "${searchQuery}"` : 'Tokens in Watchlist'}
      </div>

      <div>
        {loading ? (
          Array.from({ length: SKELETON_COUNT }, (_, index) => <SkeletonItem key={index} />)
        ) : tokensToDisplay.length > 0 ? (
          tokensToDisplay.map(renderTokenItem)
        ) : (
          <EmptyState isSearch={!!searchQuery} />
        )}
      </div>
    </div>
  );
};

export default TokenPrice;
