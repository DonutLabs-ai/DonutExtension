import React, { useState, useEffect, useMemo } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/shadcn/avatar';
import { BigNumber } from 'bignumber.js';
import ChevronDown from '@/assets/images/chevronDown.svg?react';
import Exchange from '@/assets/images/exchange.svg?react';
import { useDebouncedValue } from '@/hooks/useDebounce';
import { toRawAmount, toUiAmount } from '@/utils/amount';
import { useTokenStore } from '@/stores/tokenStore';
import { getSwapService } from '@/services/swapService';
import { numberIndent } from '@/utils/amount';
// Import necessary type definitions
interface ParsedCommand {
  commandId?: string;
  command?: any;
  isComplete?: boolean;
  parameters?: Record<string, any>;
  parsedParams?: Record<string, any>;
}

interface SwapPreviewProps {
  parsedCommand: ParsedCommand;
}

/**
 * Swap command preview component
 * Displays exchange amount, source token, target token and other information
 */
const SwapPreview: React.FC<SwapPreviewProps> = ({ parsedCommand }) => {
  // Extract information from parameters
  const amount = parsedCommand.parameters?.amount || '';
  const fromToken = parsedCommand.parameters?.fromToken || '';
  const toToken = parsedCommand.parameters?.toToken || '';

  const tokens = useTokenStore(state => state.tokens);

  const [estimatedOut, setEstimatedOut] = useState<string>('');
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const debouncedAmount = useDebouncedValue(amount, 400);

  const fromTokenInfo = useMemo(() => {
    return Object.values(tokens).find(t => t.symbol.toLowerCase() === fromToken.toLowerCase());
  }, [tokens, fromToken]);

  const toTokenInfo = useMemo(() => {
    return Object.values(tokens).find(t => t.symbol.toLowerCase() === toToken.toLowerCase());
  }, [tokens, toToken]);

  const rate = useMemo(() => {
    if (!fromTokenInfo || !toTokenInfo || !estimatedOut) return '';

    try {
      const rate = new BigNumber(estimatedOut).dividedBy(debouncedAmount).toFixed();
      return `1 ${fromTokenInfo.symbol} ≈ ${numberIndent(rate, { digits: 4 })} ${toTokenInfo.symbol}`;
    } catch (e) {
      return '';
    }
  }, [fromTokenInfo, toTokenInfo, estimatedOut, debouncedAmount]);

  // Get quote information
  useEffect(() => {
    if (!debouncedAmount || !fromTokenInfo || !toTokenInfo) {
      setEstimatedOut('');
      return;
    }

    const decimals = fromTokenInfo.decimals;
    const rawAmount = toRawAmount(debouncedAmount, decimals);

    const svc = getSwapService();
    const controller = new AbortController();
    setLoadingQuote(true);
    setQuoteError(null);

    svc
      .getQuote({
        inputMint: fromTokenInfo.mint,
        outputMint: toTokenInfo.mint,
        amount: rawAmount,
        slippageBps: 50,
      })
      .then(q => {
        const outDecimals = toTokenInfo.decimals;
        setEstimatedOut(toUiAmount(q.outAmount, outDecimals));
      })
      .catch(err => {
        setQuoteError(err?.message || 'Quote error');
        setEstimatedOut('');
      })
      .finally(() => {
        setLoadingQuote(false);
      });

    return () => controller.abort();
  }, [debouncedAmount, fromTokenInfo, toTokenInfo]);

  return (
    <div>
      <div className="text-sm font-medium mb-3">Swap Preview</div>
      {quoteError && (
        <div className="text-sm text-destructive mb-2 bg-destructive/10 rounded-base p-2 break-all">
          {quoteError}
        </div>
      )}
      {/* Exchange area */}
      <div className="flex items-center justify-between gap-6">
        {/* Sell area */}
        <div className="border border-border rounded-lg p-3 flex-1">
          <div className="text-sm mb-2">Selling</div>
          <div className="flex items-center">
            <div className="text-2xl flex-1 truncate">{numberIndent(amount, { digits: 4 })}</div>
            <div className="flex items-center gap-2 bg-accent rounded-xl py-2 px-3">
              <Avatar className="w-5 h-5">
                <AvatarImage src={fromTokenInfo?.logoURI} alt={fromTokenInfo?.symbol} />
                <AvatarFallback>{fromTokenInfo?.symbol?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-base">{fromTokenInfo?.symbol}</div>
              <ChevronDown />
            </div>
          </div>
        </div>

        {/* Exchange icon */}
        <div className="flex-shrink-0">
          <Exchange />
        </div>

        {/* Buy area */}
        <div className="border border-border rounded-lg p-3 flex-1">
          <div className="text-sm mb-2">Buying</div>
          <div className="flex items-center justify-between">
            <div className="text-2xl flex-1 truncate">
              {loadingQuote ? '...' : numberIndent(estimatedOut, { digits: 4 })}
            </div>
            <div className="flex items-center gap-2 bg-accent rounded-xl py-2 px-3">
              <Avatar className="w-5 h-5">
                <AvatarImage src={toTokenInfo?.logoURI} alt={toTokenInfo?.symbol} />
                <AvatarFallback>{toTokenInfo?.symbol?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-base">{toTokenInfo?.symbol}</div>
              <ChevronDown />
            </div>
          </div>
        </div>
      </div>

      {/* Transaction information */}
      {rate && (
        <div className="flex text-sm mt-4">
          <div className="text-muted-foreground mr-2">Rate</div>
          <div className="text-accent-foreground">{rate}</div>
        </div>
      )}
    </div>
  );
};

export default SwapPreview;
