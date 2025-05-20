import { commands, CommandOption } from './commandData';

/**
 * Word position interface, represents position of a word in text
 */
export interface WordPosition {
  word: string;
  startPos: number;
  endPos: number;
}

/**
 * Parameter interface, defines the structure of a parsed parameter
 */
export interface ParsedParameter {
  paramId: string;
  value: string;
  startPos: number;
  endPos: number;
  complete: boolean;
}

/**
 * Command interface, defines the structure of a parsed command
 */
export interface ParsedCommand {
  startsWithSlash: boolean;
  commandId?: string;
  command?: CommandOption;
  isComplete?: boolean;
  parameters?: Record<string, string>;
  parsedParams?: Record<string, ParsedParameter>;
  commandConfirmed?: boolean;
  cursorParamId?: string | null;
  nextParamNeedingSuggestionId?: string | null;
}

// TokenInfo interface definition, to avoid import errors
interface TokenInfo {
  symbol: string;
  mint: string;
  [key: string]: any;
}

/**
 * Parse commands from text
 * @param text Input text
 * @param cursorPosition Cursor position
 * @param collectWordPositionsFrom Function to collect word positions
 * @param assignParametersByType Function to assign parameters
 * @param findCursorParam Function to find parameter at cursor
 * @param isCommandComplete Function to check if command is complete
 * @param findFirstUnfilledParamNeedingSuggestion Function to find next parameter needing suggestion
 * @returns Parsed command object
 */
export function parseCommandFromText(
  text: string,
  cursorPosition: number = text.length,
  collectWordPositionsFrom: (text: string, startIndex: number) => WordPosition[],
  assignParametersByType: (
    command: CommandOption,
    parsedParams: Record<string, ParsedParameter>,
    wordPositions: WordPosition[]
  ) => void,
  findCursorParam: (
    params: Record<string, ParsedParameter>,
    cursorPosition: number,
    text: string,
    command: CommandOption
  ) => string | null,
  isCommandComplete: (command: CommandOption, params: Record<string, ParsedParameter>) => boolean,
  findFirstUnfilledParamNeedingSuggestion: (
    command: CommandOption,
    parameters: Record<string, any>
  ) => CommandOption['params'][0] | null
): ParsedCommand | null {
  // If no slash, no command
  if (!text.includes('/')) {
    return null;
  }

  // Check if text starts with slash
  const startsWithSlash = text.trim().startsWith('/');

  // Extract command part (from / to first space)
  const commandRegex = /\/([^\s\u00A0\u2000-\u200B\u3000]+)/;
  const commandMatch = commandRegex.exec(text);

  // If no command format match, return basic info
  if (!commandMatch) {
    return {
      startsWithSlash,
      commandId: undefined,
      command: undefined,
      commandConfirmed: false,
    };
  }

  // Extract command name
  const commandName = commandMatch[1].trim();

  // Find command position in text
  const commandPart = `/${commandName}`;
  const commandStartIndex = text.indexOf(commandPart);
  const commandEndIndex = commandStartIndex + commandPart.length;

  // Find matching command - using exact match not prefix match
  const matchedCommand = commands.find(
    cmd => cmd.title.toLowerCase() === commandName.toLowerCase()
  );

  // If no matching command found
  if (!matchedCommand) {
    return {
      startsWithSlash,
      commandId: undefined,
      command: undefined,
      commandConfirmed: false,
    };
  }

  // Determine if command is confirmed - only when there's a space after it
  let commandConfirmed = false;

  // Check if there's a space character after command (including various Unicode spaces)
  if (commandEndIndex < text.length) {
    const nextChar = text[commandEndIndex];
    const isSpaceChar = /[\s\u00A0\u2000-\u200B\u3000]/.test(nextChar);
    if (isSpaceChar) {
      commandConfirmed = true;
    }
  }

  // If command not confirmed (no space), return basic command info
  if (!commandConfirmed) {
    return {
      startsWithSlash,
      commandId: matchedCommand.id,
      command: matchedCommand,
      isComplete: matchedCommand.params.length === 0, // If no parameters, consider complete
      parameters: {},
      parsedParams: {},
      commandConfirmed: false,
    };
  }

  // Command confirmed, parse parameters
  const parsedParams: Record<string, ParsedParameter> = {};

  // Skip spaces after command name
  let parametersStartIndex = commandEndIndex;
  while (parametersStartIndex < text.length && /\s/.test(text[parametersStartIndex])) {
    parametersStartIndex++;
  }

  // Collect word positions from input
  const wordPositions = collectWordPositionsFrom(text, parametersStartIndex);

  // Assign parameters by type
  assignParametersByType(matchedCommand, parsedParams, wordPositions);

  // Identify current parameter based on cursor position
  const cursorParamId = findCursorParam(parsedParams, cursorPosition, text, matchedCommand);

  // Check if command is complete (all required parameters filled)
  const isComplete = isCommandComplete(matchedCommand, parsedParams);

  // Build simplified parameters object
  const parameters: Record<string, string> = {};
  for (const [paramId, param] of Object.entries(parsedParams)) {
    parameters[paramId] = param.value;
  }

  // Find next parameter needing suggestion
  let nextParamNeedingSuggestionId: string | null = null;

  // If command not complete, look for next parameter needing suggestion
  if (!isComplete) {
    const unfilledParam = findFirstUnfilledParamNeedingSuggestion(matchedCommand, parameters);
    if (unfilledParam) {
      nextParamNeedingSuggestionId = unfilledParam.id;
    }
  }

  return {
    startsWithSlash,
    commandId: matchedCommand.id,
    command: matchedCommand,
    isComplete,
    parameters,
    parsedParams,
    commandConfirmed,
    cursorParamId,
    nextParamNeedingSuggestionId, // Add next parameter ID needing suggestion
  };
}
