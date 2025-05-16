import { useState, useEffect, useMemo, useCallback } from 'react';
import { cn } from '@/utils/shadcn';
import { getTokenService } from '@/services/tokenService';
import { useTokenStore } from '@/stores/tokenStore';
import type { TokenInfo } from '@/stores/tokenStore';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/shadcn/avatar';
import { numberIndent } from '@/utils/amount';
import { useCommandInputStore } from '../../store/commandInputStore';
import { getWordAtPosition } from '../../utils/commandParser';
import { handleSuggestionSelect } from '../../utils/handleSuggestionSelect';

interface TokenItem {
  symbol: string;
  name: string;
  logoURI?: string;
  price: string;
  balance: number;
}

const TokenSuggestion = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const tokensObj = useTokenStore(state => state.tokens);
  const tokens = useMemo<TokenItem[]>(
    () =>
      Object.values<TokenInfo>(tokensObj).map(t => ({
        symbol: t.symbol,
        name: t.name,
        logoURI: t.logoURI,
        price: t.price,
        balance: t.uiBalance,
      })),
    [tokensObj]
  );
  const {
    inputValue,
    cursorPosition,
    setInputValue,
    setCursorPosition,
    setParsedCommand,
    parsedCommand,
  } = useCommandInputStore();

  // Get word at cursor position
  const currentWord = useMemo(() => {
    return getWordAtPosition(inputValue, cursorPosition);
  }, [inputValue, cursorPosition]);

  // Filter tokens
  const filteredTokens: TokenItem[] = useMemo(() => {
    if (tokens.length === 0) return [];
    // If current word is empty or only spaces, show first 50 tokens
    if (!currentWord.word || currentWord.word.trim() === '') {
      return tokens;
    }

    const query = currentWord.word.toLowerCase();
    const filtered = tokens.filter(
      token =>
        token.symbol.toLowerCase().includes(query) || token.name.toLowerCase().includes(query)
    );

    // If no matches found, return all tokens
    return filtered.length > 0 ? filtered : tokens;
  }, [currentWord, tokens]);

  // Handle token selection - using the generic handler function
  const handleTokenSelect = useCallback(
    (tokenSymbol: string) => {
      handleSuggestionSelect({
        inputValue,
        cursorPosition,
        selectedValue: tokenSymbol,
        parsedCommand,
        setInputValue,
        setCursorPosition,
        setParsedCommand,
      });
    },
    [inputValue, cursorPosition, parsedCommand, setInputValue, setCursorPosition, setParsedCommand]
  );

  // Add keyboard navigation listener once
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev < filteredTokens.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : filteredTokens.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        // Guard index range
        if (filteredTokens[activeIndex]) {
          handleTokenSelect(filteredTokens[activeIndex].symbol);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredTokens, activeIndex, handleTokenSelect]);

  // Ensure activeIndex stays within bounds when token list changes
  useEffect(() => {
    if (activeIndex >= filteredTokens.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, filteredTokens.length]);

  // Reset state when component unmounts
  useEffect(() => {
    return () => {
      setActiveIndex(0);
    };
  }, []);

  // auto refresh token list price and balance
  useEffect(() => {
    const tokenService = getTokenService();
    const refreshTokenData = async () => {
      await tokenService.refreshBalances();
      await tokenService.refreshPrices();
    };
    refreshTokenData();

    const interval = setInterval(refreshTokenData, 10000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  if (filteredTokens.length === 0) {
    return (
      <div className="w-full px-5 py-3">
        <div className="text-muted-foreground text-sm">No matching tokens found</div>
      </div>
    );
  }

  return (
    <div className="w-full px-5 py-3">
      <div className="text-sm font-medium text-muted-foreground mb-2">Select Token</div>
      <div className="grid grid-cols-2 gap-2">
        {filteredTokens.map((token, index) => (
          <div
            key={token.symbol}
            className={cn(
              'px-3 py-2 rounded-lg cursor-pointer transition-colors duration-150 border border-border',
              'flex items-center gap-2 overflow-hidden',
              activeIndex === index && 'bg-accent'
            )}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => handleTokenSelect(token.symbol)}
          >
            <Avatar className="w-6 h-6">
              <AvatarImage src={token.logoURI} alt={token.symbol} />
              <AvatarFallback>{token.symbol.charAt(0)}</AvatarFallback>
            </Avatar>

            <div className="flex flex-col space-y-1 flex-1 overflow-hidden">
              <div className="truncate text-accent-foreground">{token.symbol}</div>
              <div className="truncate text-xs text-muted-foreground leading-none">
                {token.name}
              </div>
            </div>

            <div className="flex flex-col items-end space-y-1">
              <div className="text-accent-foreground">
                {numberIndent(token.balance, { digits: 2 })}
              </div>
              <div className="text-xs text-muted-foreground">
                ${numberIndent(token.price, { digits: 2 })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TokenSuggestion;
