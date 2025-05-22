import { useCallback } from 'react';
import { CommandOption, CommandParam, ParamType } from '../utils/commandData';
import { SuggestionType } from '../store/tiptapStore';
import {
  parameterNeedsSuggestion,
  getSuggestionTypeForParam,
  findFirstUnfilledParamNeedingSuggestion,
} from '../utils/suggestionUtils';
import { ParsedCommand } from '../utils/commandUtils';

/**
 * Hook for managing suggestion display logic
 */
export const useSuggestionHandler = () => {
  /**
   * Determine which suggestion type to show based on command state
   * @param parsed The parsed command object
   * @returns The appropriate suggestion type to display
   */
  const determineSuggestionType = useCallback((parsed: ParsedCommand | null): SuggestionType => {
    // If no command is parsed, show no suggestion
    if (!parsed) {
      return SuggestionType.None;
    }

    // If there's no command ID but has slash, show command menu
    if (!parsed.commandId) {
      if (parsed.startsWithSlash) {
        return SuggestionType.Command;
      } else {
        return SuggestionType.None;
      }
    }

    // Find the corresponding command
    const command = parsed.command;
    if (!command) {
      return SuggestionType.None;
    }

    // If command is complete, show preview
    if (parsed.isComplete) {
      return SuggestionType.Preview;
    }

    // If command is not confirmed, show command menu
    if (!parsed.commandConfirmed) {
      return SuggestionType.Command;
    }

    // If command is confirmed, determine which parameter suggestion to show

    // First, check if there are any completed TokenNode parameters
    const hasCompletedTokenParams = Object.values(parsed.parsedParams || {}).some(
      (param: any) => param.complete && param.value.startsWith('@TOKEN:')
    );

    // Get next parameter that needs suggestion
    let nextParamNeedingSuggestionId = parsed.nextParamNeedingSuggestionId;

    // If there are completed TokenNode parameters, reassess current parameter and next parameter needing suggestion
    if (hasCompletedTokenParams && !nextParamNeedingSuggestionId) {
      // Calculate next parameter needing suggestion
      const nextParam = findFirstUnfilledParamNeedingSuggestion(command, parsed.parameters || {});

      if (nextParam) {
        nextParamNeedingSuggestionId = nextParam.id;
      }
    }

    // If parsing result has next parameter needing suggestion
    if (nextParamNeedingSuggestionId) {
      const nextParam = command.params.find(p => p.id === nextParamNeedingSuggestionId);

      if (nextParam && parameterNeedsSuggestion(nextParam.type)) {
        const suggestionType = getSuggestionTypeForParam(nextParam.type);
        if (suggestionType) {
          return suggestionType;
        }
      }
    }

    // Handle special case: cursor positioning with multiple parameters of same type
    // If next parameter can't be found, but cursor parameter needs suggestion and is different from previous
    if (parsed.cursorParamId) {
      const cursorParam = command.params.find(p => p.id === parsed.cursorParamId);

      // Only follow cursor parameter when it's different from nextParamNeedingSuggestionId
      // This helps resolve cases with multiple parameters of same type
      if (
        cursorParam &&
        parameterNeedsSuggestion(cursorParam.type) &&
        cursorParam.id !== nextParamNeedingSuggestionId
      ) {
        const suggestionType = getSuggestionTypeForParam(cursorParam.type);
        if (suggestionType) {
          return suggestionType;
        }
      }
    }

    // If no parameter needing suggestion is found, don't show suggestion box
    return SuggestionType.None;
  }, []);

  return { determineSuggestionType };
};
