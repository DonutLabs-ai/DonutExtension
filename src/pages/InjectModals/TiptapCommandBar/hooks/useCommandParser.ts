import { useCallback } from 'react';
import { commands, CommandOption, CommandIdType } from '../utils/commandData';
import { ParsedCommand, parseCommandFromText } from '../utils/commandUtils';
import {
  collectWordPositionsFrom,
  assignParametersByType,
  findCursorParam,
  isCommandComplete,
} from '../utils/parameterUtils';
import { findFirstUnfilledParamNeedingSuggestion } from '../utils/suggestionUtils';

/**
 * Hook to parse commands from input text
 * Encapsulates the command parsing logic to make components cleaner
 */
export const useCommandParser = () => {
  /**
   * Parse command from text
   * @param text Input text
   * @param cursorPosition Cursor position in the text
   * @returns Parsed command object or null if no command is found
   */
  const parseCommand = useCallback(
    (text: string, cursorPosition: number = text.length): ParsedCommand | null => {
      return parseCommandFromText(
        text,
        cursorPosition,
        collectWordPositionsFrom,
        assignParametersByType,
        findCursorParam,
        isCommandComplete,
        findFirstUnfilledParamNeedingSuggestion
      );
    },
    []
  );

  /**
   * Find command definition by ID
   * @param commandId Command ID to find
   * @returns Command definition or undefined if not found
   */
  const findCommandById = useCallback((commandId: CommandIdType): CommandOption | undefined => {
    return commands.find(cmd => cmd.id === commandId);
  }, []);

  return {
    parseCommand,
    findCommandById,
    commands,
  };
};
