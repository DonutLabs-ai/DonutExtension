import { useMemo } from 'react';
import { ParsedCommand } from '../utils/commandParser';
import { SuggestionType } from '../store/commandInputStore';
import { ParamType } from '../store/commandDefinitions';

/**
 * Determine the current suggestion type based on the command parsing result
 * In SuggestionType, except for None, all other types correspond to dropdown display types
 * Directly match SuggestionType based on parameter type name
 */
export function useSuggestionType(parsedCommand: ParsedCommand | null): SuggestionType {
  return useMemo(() => {
    // Basic check
    if (!parsedCommand) return SuggestionType.None;

    // Input not starting with "/" doesn't show any suggestions
    if (!parsedCommand.startsWithSlash) return SuggestionType.None;

    // Command recognition phase
    if (parsedCommand.commandId === null && parsedCommand.command === null) {
      return SuggestionType.Command;
    }

    // Command is complete, show transaction preview
    if (parsedCommand.isComplete) return SuggestionType.Preview;

    // Get parameter list
    const params = parsedCommand.command?.params || [];
    if (params.length === 0) return SuggestionType.None;

    // Function to map parameter type to suggestion type
    const getSuggestionType = (paramType: ParamType): SuggestionType => {
      switch (paramType) {
        case ParamType.Token:
          return SuggestionType.Token;
        case ParamType.Address:
          return SuggestionType.Address;
        // Amount and Text types don't need special suggestion UI, use regular input
        default:
          return SuggestionType.None;
      }
    };

    // Strategy 1: First check parameter where cursor is located
    if (parsedCommand.cursorParamId) {
      const cursorParam = params.find(p => p.id === parsedCommand.cursorParamId);
      if (cursorParam) {
        const suggestionType = getSuggestionType(cursorParam.type);
        // If there's a corresponding suggestion type (not None), return it directly
        if (suggestionType !== SuggestionType.None) {
          return suggestionType;
        }
        // For parameter types that don't need dropdowns (like Amount), try to find next parameter that needs suggestions
      }
    }

    // Strategy 2: Find all incomplete required parameters
    for (const param of params) {
      // Check if parameter is incomplete
      if (param.required && !parsedCommand.params[param.id]?.complete) {
        const suggestionType = getSuggestionType(param.type);
        // If a parameter type that needs a dropdown is found, return the corresponding suggestion type
        if (suggestionType !== SuggestionType.None) {
          return suggestionType;
        }
      }
    }

    // No parameters that need dropdown display
    return SuggestionType.None;
  }, [parsedCommand]);
}
