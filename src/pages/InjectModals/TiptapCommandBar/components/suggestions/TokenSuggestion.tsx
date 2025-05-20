import { useEffect, useMemo, useCallback } from 'react';
import { cn } from '@/utils/shadcn';
import { useTiptapCommandBarStore } from '../../store/tiptapStore';
import { ParamType } from '../../utils/commandData';
import { useTokenStore } from '@/stores/tokenStore';
import type { TokenInfo } from '@/stores/tokenStore';
import { getTokenService } from '@/services/tokenService';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/shadcn/avatar';
import { numberIndent } from '@/utils/amount';
import {
  ExtendedParsedCommand,
  CommandParamType,
  getWordRangeAroundCursor,
  identifyCompletedTokenParams,
  selectNextTokenParam,
  extractTokenSearchQuery,
  determineCurrentParamValue,
} from '../../utils/tokenParamUtils';
import useKeyboardNavigation from '../../hooks/useKeyboardNavigation';

interface TokenItem {
  symbol: string;
  name: string;
  logoURI?: string;
  price: string;
  balance: number;
  mint: string;
}

const TokenSuggestion = () => {
  const { parsedCommand, setContent, editor } = useTiptapCommandBarStore();

  // Get token data
  const tokensObj = useTokenStore(state => state.tokens);
  const tokens = useMemo<TokenItem[]>(
    () =>
      Object.values<TokenInfo>(tokensObj).map(t => ({
        symbol: t.symbol,
        name: t.name,
        logoURI: t.logoURI,
        price: t.price,
        balance: t.uiBalance,
        mint: t.mint,
      })),
    [tokensObj]
  );

  // Extract command related information
  const commandInfo = useMemo(() => {
    if (!parsedCommand?.command || !editor) {
      return { valid: false };
    }

    // Convert to extended interface to access all fields
    const extendedCommand = parsedCommand as ExtendedParsedCommand;

    // Find all Token type parameters
    const tokenParams = extendedCommand.command.params.filter(
      (param: CommandParamType) => param.type === ParamType.Token && param.required
    );

    if (tokenParams.length === 0) {
      return { valid: false };
    }

    // Identify completed Token parameters (already converted to TokenNodes)
    const completedTokenParams = identifyCompletedTokenParams(extendedCommand.parsedParams);

    // Select next parameter needing suggestion based on priority
    const nextParam = selectNextTokenParam(
      tokenParams,
      completedTokenParams,
      extendedCommand.nextParamNeedingSuggestionId,
      extendedCommand.cursorParamId
    );

    // If no parameter needs suggestion, return invalid
    if (!nextParam) {
      return { valid: false };
    }

    // Determine current parameter value
    const currentParamValue = determineCurrentParamValue(
      editor,
      nextParam,
      extendedCommand.parameters
    );

    return {
      valid: true,
      nextParam,
      currentParamValue,
      command: extendedCommand.command,
      parameters: extendedCommand.parameters || {},
    };
  }, [parsedCommand, editor]);

  // Filter tokens
  const filteredTokens = useMemo(() => {
    if (tokens.length === 0 || !commandInfo.valid) return [];

    // If current parameter value is empty, show all tokens
    if (!commandInfo.currentParamValue) {
      return tokens;
    }

    // Extract valid token search keyword
    const query = extractTokenSearchQuery(commandInfo.currentParamValue);

    if (!query) return tokens;

    // Filter tokens
    const filtered = tokens.filter(
      token =>
        token.symbol.toLowerCase().includes(query) || token.name.toLowerCase().includes(query)
    );

    // If no matches but have query, try more relaxed matching
    if (filtered.length === 0) {
      // Check if any part of token is included in query
      return tokens.filter(
        token =>
          query.includes(token.symbol.toLowerCase()) || query.includes(token.name.toLowerCase())
      );
    }

    return filtered.length > 0 ? filtered : tokens;
  }, [tokens, commandInfo.currentParamValue, commandInfo.valid]);

  // Handle token selection
  const handleTokenSelect = useCallback(
    (token: TokenItem) => {
      if (!commandInfo.valid || !parsedCommand?.command || !editor) return;

      try {
        const { state } = editor;
        const { doc, selection } = state;
        const { from } = selection;

        // Get word range around cursor
        const { start, end } = getWordRangeAroundCursor(doc, from);

        // Get word to replace
        const wordToReplace = doc.textBetween(start, end, '', '').trim();

        if (wordToReplace.trim()) {
          // First select word to replace
          editor.commands.setTextSelection({ from: start, to: end });
          // Delete selection
          editor.commands.deleteSelection();
        }

        // Get complete token information
        const allTokens = useTokenStore.getState().tokens;
        const tokenInfo = token.mint
          ? allTokens[token.mint] || Object.values(allTokens).find(t => t.mint === token.mint)
          : Object.values(allTokens).find(
              t => t.symbol.toLowerCase() === token.symbol.toLowerCase()
            );

        if (!tokenInfo) {
          // If complete information cannot be found, fall back to using only symbol and mint
          // Insert token node
          editor.commands.setTokenNode({
            symbol: token.symbol,
            mint: token.mint,
          });
        } else {
          // Use complete token information
          // Now we only pass symbol and mint, keeping interface compatibility
          // TokenView component will use mint to get complete information from TokenStore
          editor.commands.setTokenNode({
            symbol: tokenInfo.symbol,
            mint: tokenInfo.mint,
          });
        }

        // Insert non-breaking space to ensure spacing after node
        editor.commands.insertContent('\u00A0');
      } catch (error) {
        // Improved error handling
        // Recovery strategy after error: try simpler method to insert node
        try {
          // Fall back to directly inserting token node
          editor.commands.setTokenNode({
            symbol: token.symbol,
            mint: token.mint,
          });
          editor.commands.insertContent('\u00A0');
        } catch (fallbackError) {
          // Notify user of error
          alert('Failed to insert token, please try again');
        }
      }

      // Update content, trigger parameter state and suggestion box refresh
      if (editor?.getText) {
        setContent(editor.getText());
      }
    },
    [commandInfo.valid, parsedCommand, editor, setContent]
  );

  // Use custom hook to handle keyboard navigation
  const { activeIndex, setActiveIndex } = useKeyboardNavigation({
    items: filteredTokens,
    onSelect: handleTokenSelect,
    isEnabled: commandInfo.valid && filteredTokens.length > 0,
  });

  // Auto refresh token data
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

  // If command info is invalid, return null
  if (!commandInfo.valid) {
    return null;
  }

  // If no tokens, show no matches message
  if (filteredTokens.length === 0) {
    return (
      <div className="w-full p-5">
        <div className="text-muted-foreground text-sm">No matching tokens found</div>
      </div>
    );
  }

  return (
    <div className="w-full p-5">
      <div className="text-sm font-medium text-muted-foreground mb-2">Select Token</div>
      <div className="grid grid-cols-2 gap-2">
        {filteredTokens.map((token, index) => (
          <div
            key={token.symbol + token.mint.slice(0, 6)}
            className={cn(
              'px-3 py-2 rounded-2xl cursor-pointer transition-colors duration-150 border border-accent bg-accent',
              'flex items-center gap-2 overflow-hidden',
              activeIndex === index && 'border-primary'
            )}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => handleTokenSelect(token)}
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
