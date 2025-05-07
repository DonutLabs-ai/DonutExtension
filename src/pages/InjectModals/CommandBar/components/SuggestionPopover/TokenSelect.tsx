import { CommandInputType, useCommandInputStore } from '../../store/commandInputStore';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { cn } from '@/utils/shadcn';

interface Token {
  symbol: string;
  name: string;
  value: string;
}

export const tokens: Token[] = [
  { symbol: 'SOL', name: 'Solana', value: 'SOL' },
  { symbol: 'USDC', name: 'USD Coin', value: 'USDC' },
  { symbol: 'ETH', name: 'Ethereum', value: 'ETH' },
  { symbol: 'BTC', name: 'Bitcoin', value: 'BTC' },
];

const TokenSelect = () => {
  const { activeInputId, inputStack, updateInput, pushInput } = useCommandInputStore();
  const [activeIndex, setActiveIndex] = useState(0);

  const activeInputInfo = useMemo(() => {
    return inputStack.find(input => input.id === activeInputId);
  }, [activeInputId, inputStack]);

  const filteredTokens = useMemo(() => {
    if (!activeInputInfo || activeInputInfo?.type !== CommandInputType.Token) return [];

    if (!activeInputInfo.value) return tokens;

    return tokens.filter(
      token =>
        token.symbol.toLowerCase().includes(activeInputInfo.value.toLowerCase()) ||
        token.name.toLowerCase().includes(activeInputInfo.value.toLowerCase())
    );
  }, [activeInputInfo]);

  const handleTokenSelect = useCallback(
    (token: Token) => {
      if (!activeInputId) return;
      updateInput(activeInputId, {
        value: token.symbol,
      });
      activeInputInfo?.onComplete?.();
    },
    [activeInputId, activeInputInfo?.onComplete, updateInput]
  );

  // Keyboard navigation
  useEffect(() => {
    if (filteredTokens.length === 0) return;
    if (activeIndex > filteredTokens.length - 1) {
      setActiveIndex(0);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        if (activeIndex < filteredTokens.length - 1) {
          setActiveIndex(activeIndex + 1);
        } else {
          setActiveIndex(0);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        if (activeIndex > 0) {
          setActiveIndex(activeIndex - 1);
        } else {
          setActiveIndex(filteredTokens.length - 1);
        }
      } else if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        e.stopPropagation();
        const selectedToken = filteredTokens[activeIndex];
        handleTokenSelect(selectedToken);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredTokens, activeIndex, handleTokenSelect, activeInputId, activeInputInfo]);

  useEffect(() => {
    return () => {
      setActiveIndex(0);
    };
  }, [activeInputId]);

  if (filteredTokens.length === 0) return null;

  return (
    <div className="w-full px-5 py-3 border-t border-muted-foreground grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2">
      {filteredTokens.map((token, index) => (
        <div
          key={token.value}
          className={cn(
            'w-full px-3 py-2.5 rounded-lg font-medium cursor-pointer transition-all duration-150 border border-accent',
            activeIndex === index ? 'bg-[#BBB1D938] ' : 'bg-white'
          )}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => handleTokenSelect(token)}
        >
          {token.name}
        </div>
      ))}
    </div>
  );
};

export default TokenSelect;
