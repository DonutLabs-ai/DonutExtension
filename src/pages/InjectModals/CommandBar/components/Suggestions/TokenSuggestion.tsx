import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/utils/shadcn';
import { useCommandInputStore } from '../../store/commandInputStore';
import { getWordAtPosition } from '../../utils/commandParser';
import { handleSuggestionSelect } from '../../utils/handleSuggestionSelect';

interface Token {
  symbol: string;
  name: string;
  value: string;
}

// Example token list - in a real application, this should be fetched from an API or data store
export const tokens: Token[] = [
  { symbol: 'SOL', name: 'Solana', value: 'SOL' },
  { symbol: 'USDC', name: 'USD Coin', value: 'USDC' },
  { symbol: 'ETH', name: 'Ethereum', value: 'ETH' },
  { symbol: 'BTC', name: 'Bitcoin', value: 'BTC' },
  { symbol: 'USDT', name: 'Tether', value: 'USDT' },
  { symbol: 'DAI', name: 'Dai', value: 'DAI' },
  { symbol: 'MATIC', name: 'Polygon', value: 'MATIC' },
  { symbol: 'LINK', name: 'Chainlink', value: 'LINK' },
];

const TokenSuggestion: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const {
    inputValue,
    cursorPosition,
    setInputValue,
    setCursorPosition,
    setActiveSuggestion,
    setParsedCommand,
    parsedCommand,
  } = useCommandInputStore();

  // Get word at cursor position
  const currentWord = useMemo(() => {
    return getWordAtPosition(inputValue, cursorPosition);
  }, [inputValue, cursorPosition]);

  // Filter tokens
  const filteredTokens = useMemo(() => {
    // If current word is empty or only spaces, show all tokens
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
  }, [currentWord]);

  // Handle token selection - using the generic handler function
  const handleTokenSelect = (tokenSymbol: string) => {
    handleSuggestionSelect({
      inputValue,
      cursorPosition,
      selectedValue: tokenSymbol,
      parsedCommand,
      setInputValue,
      setCursorPosition,
      setActiveSuggestion,
      setParsedCommand,
    });
  };

  // Simplified keyboard navigation, only supports up/down arrows
  useEffect(() => {
    if (filteredTokens.length === 0) return;

    // Ensure active index is within valid range
    if (activeIndex >= filteredTokens.length) {
      setActiveIndex(0);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev < filteredTokens.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : filteredTokens.length - 1));
      } else if (e.key === 'Enter') {
        // Select the currently active token with Enter key
        e.preventDefault();
        handleTokenSelect(filteredTokens[activeIndex].symbol);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredTokens, activeIndex, handleTokenSelect]);

  // Reset state when component unmounts
  useEffect(() => {
    return () => {
      setActiveIndex(0);
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
              'px-3 py-2 rounded-lg cursor-pointer transition-colors duration-150',
              'flex items-center justify-between',
              activeIndex === index ? 'bg-accent' : 'bg-background hover:bg-muted'
            )}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => handleTokenSelect(token.symbol)}
          >
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs mr-2">
                {token.symbol.charAt(0)}
              </div>
              <span className="font-medium">{token.symbol}</span>
            </div>
            <span className="text-xs text-muted-foreground truncate max-w-[80px]">
              {token.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TokenSuggestion;
