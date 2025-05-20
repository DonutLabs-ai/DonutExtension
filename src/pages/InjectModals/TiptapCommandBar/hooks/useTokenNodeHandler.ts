import { useCallback } from 'react';
import { Editor } from '@tiptap/core';
import { CommandOption, CommandParam, ParamType } from '../utils/commandData';
import { ParsedParameter } from '../utils/commandUtils';
import { isTokenReference, createTokenReference } from '../utils/tokenParamUtils';
import { findFirstUnfilledParamNeedingSuggestion } from '../utils/suggestionUtils';

export interface TokenNodeData {
  node: any;
  pos: number;
  symbol: string;
  mint: string;
}

/**
 * Hook for handling TokenNode logic in Tiptap editor
 */
export const useTokenNodeHandler = () => {
  /**
   * Process TokenNodes in the document and update parameters accordingly
   * @param editor Tiptap editor instance
   * @param command Current command definition
   * @param parsedParams Parsed parameters object to update
   * @param parameters Simple parameters object to update
   * @returns Updated { parsedParams, parameters, isComplete }
   */
  const processTokenNodes = useCallback(
    (
      editor: Editor,
      command: CommandOption,
      parsedParams: Record<string, ParsedParameter> = {},
      parameters: Record<string, string> = {}
    ) => {
      if (!editor || !command) {
        return { parsedParams, parameters, isComplete: false };
      }

      const doc = editor.state.doc;

      // Get all token parameters from the command
      const tokenParams = command.params.filter((p: CommandParam) => p.type === ParamType.Token);

      if (tokenParams.length === 0) {
        // No token parameters to process
        return {
          parsedParams,
          parameters,
          isComplete: command.params
            .filter(param => param.required)
            .every(param => parsedParams?.[param.id]?.complete),
        };
      }

      // First, collect all TokenNodes in the document with their positions
      let hasTokenNodes = false;
      const tokenNodeList: TokenNodeData[] = [];

      doc.descendants((node, pos) => {
        // Check if it's a TokenNode
        if (node.type.name === 'tokenNode') {
          const tokenSymbol = node.attrs.symbol;
          const tokenMint = node.attrs.mint;

          if (tokenSymbol) {
            hasTokenNodes = true;
            tokenNodeList.push({
              node,
              pos,
              symbol: tokenSymbol,
              mint: tokenMint,
            });
          }
        }
      });

      // Sort TokenNodes by position in the document
      tokenNodeList.sort((a, b) => a.pos - b.pos);

      // Make a copy of parsedParams and parameters to avoid mutating the originals
      const updatedParsedParams = { ...parsedParams };
      const updatedParameters = { ...parameters };

      // If there are token nodes in the document
      if (hasTokenNodes && tokenNodeList.length > 0) {
        // Reset parsed parameters for token type
        // This ensures plain text tokens don't take precedence over token nodes
        for (const param of tokenParams) {
          // Only clear token parameters that aren't already assigned to TokenNodes
          if (
            updatedParsedParams[param.id] &&
            !isTokenReference(updatedParsedParams[param.id]?.value)
          ) {
            delete updatedParsedParams[param.id];
            if (updatedParameters[param.id]) {
              delete updatedParameters[param.id];
            }
          }
        }

        // Assign TokenNodes to token parameters in order
        // This matches the first TokenNode to the first token parameter, and so on
        for (let i = 0; i < Math.min(tokenNodeList.length, tokenParams.length); i++) {
          const { symbol, pos, mint } = tokenNodeList[i];
          const param = tokenParams[i];

          updatedParameters[param.id] = symbol;
          updatedParsedParams[param.id] = {
            paramId: param.id,
            value: mint ? createTokenReference(mint) : symbol,
            startPos: pos,
            endPos: pos + tokenNodeList[i].node.nodeSize,
            complete: true,
          };
        }
      }

      // Recalculate if command is complete
      const isComplete = command.params
        .filter(param => param.required)
        .every(param => updatedParsedParams?.[param.id]?.complete);

      return {
        parsedParams: updatedParsedParams,
        parameters: updatedParameters,
        isComplete,
      };
    },
    []
  );

  /**
   * Calculate the next parameter that needs a suggestion
   * @param command Command definition
   * @param parsedParams Current parsed parameters
   * @param parameters Simple parameters object
   * @returns nextParamNeedingSuggestionId or null
   */
  const calculateNextParamNeedingSuggestion = useCallback(
    (
      command: CommandOption,
      parsedParams: Record<string, ParsedParameter>,
      parameters: Record<string, string> = {}
    ): string | null => {
      // Get all token parameters in order
      const orderedTokenParams = command.params.filter(
        (p: CommandParam) => p.type === ParamType.Token
      );

      // Build the set of completed token parameters
      const completedTokenParamIds = new Set<string>();
      for (const paramId in parsedParams) {
        if (parsedParams[paramId]?.complete && isTokenReference(parsedParams[paramId]?.value)) {
          completedTokenParamIds.add(paramId);
        }
      }

      // Find the first incomplete token parameter
      let nextTokenParamId: string | null = null;
      for (const param of orderedTokenParams) {
        const isCompleted = completedTokenParamIds.has(param.id);
        if (!isCompleted) {
          nextTokenParamId = param.id;
          break;
        }
      }

      // If we found an incomplete token parameter, use it
      if (nextTokenParamId) {
        return nextTokenParamId;
      }

      // If all token parameters are complete, look for other parameter types
      const nextParam = findFirstUnfilledParamNeedingSuggestion(command, parameters);

      return nextParam ? nextParam.id : null;
    },
    []
  );

  return {
    processTokenNodes,
    calculateNextParamNeedingSuggestion,
  };
};
