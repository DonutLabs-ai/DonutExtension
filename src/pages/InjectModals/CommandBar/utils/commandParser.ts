import { COMMANDS, CommandDefinition, ParamType } from '../store/commandDefinitions';
import { getTokens } from '@/stores/tokenStore';
import { validateParamValue } from './validateParamValue';

export interface ParsedParam {
  paramId: string;
  value: string;
  startPos: number;
  endPos: number;
  complete: boolean;
}

export interface ParsedCommand {
  commandId: string | null;
  command: CommandDefinition | null;
  params: Record<string, ParsedParam>;
  cursorParamId: string | null;
  isComplete: boolean;
  startsWithSlash: boolean;
}

/**
 * Check if a word is likely to be a certain parameter type
 * @param word Word to check
 * @param paramType Parameter type
 * @returns Whether the word is likely to be of that parameter type
 */
function isLikelyParamType(word: string, paramType: ParamType): boolean {
  if (!word || word.trim() === '') return false;

  // Base58 character pattern for Solana addresses
  const base58Pattern = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;

  switch (paramType) {
    case ParamType.Amount:
      // Numbers or strings with decimal points, or mixed strings starting with a number
      return (/^\d*\.?\d*$/.test(word) && word !== '.') || /^\d+/.test(word);

    case ParamType.Token:
      // Smart Token matching:
      // 1. Exact match to any token symbol (case insensitive)
      // 2. Token symbol contains or is contained by the word (case insensitive)
      // 3. Matches the beginning of a token name (case insensitive)
      return getTokens().some(token => {
        const w = word.toLowerCase();
        const sym = token.symbol.toLowerCase();
        const name = token.name.toLowerCase();

        // Exact symbol match always qualifies
        if (sym === w) return true;

        return sym.includes(w) || w.includes(sym) || name.startsWith(w);
      });

    case ParamType.Address:
      // Text that looks like a Solana address:
      // 1. Only contains Base58 character set (no 0, O, I, l)
      // 2. Length >= 8 characters (user might have typed only part of an address)
      return base58Pattern.test(word) && word.length >= 8;

    case ParamType.Text:
      // Any non-empty string could be a text parameter
      return word.length > 0;

    default:
      // In case of uncertainty, it could be any type
      return true;
  }
}

/**
 * Parse command input text
 * @param text Input text
 * @param cursorPosition Cursor position
 * @returns Parsing result
 */
export function parseCommand(text: string, cursorPosition: number): ParsedCommand {
  // Check if input starts with '/'
  const startsWithSlash = text.startsWith('/');

  // If not a command format, return empty result
  if (!startsWithSlash) {
    return createEmptyParseResult(false);
  }

  // Split command and parameters
  const words = text.split(' ').filter(word => word.trim() !== '');
  if (words.length === 0) {
    return createEmptyParseResult(true);
  }

  // Find matching command
  const commandName = words[0].slice(1); // Remove '/'
  const command = COMMANDS.find(cmd => cmd.name.toLowerCase() === commandName.toLowerCase());

  if (!command) {
    return createEmptyParseResult(true);
  }

  // Find word at cursor position
  const cursorWord = getWordAtPosition(text, cursorPosition);

  // Parse parameters
  const { params, currentParamId } = parseCommandParams(
    command,
    text,
    words,
    cursorPosition,
    cursorWord
  );

  // Check if command is complete
  const isComplete = command.params
    .filter(param => param.required)
    .every(param => params[param.id]?.complete);

  return {
    commandId: command.id,
    command,
    params,
    cursorParamId: currentParamId,
    isComplete,
    startsWithSlash: true,
  };
}

/**
 * Create empty parse result
 */
function createEmptyParseResult(startsWithSlash: boolean): ParsedCommand {
  return {
    commandId: null,
    command: null,
    params: {},
    cursorParamId: null,
    isComplete: false,
    startsWithSlash,
  };
}

/**
 * Parse command parameters
 */
function parseCommandParams(
  command: CommandDefinition,
  text: string,
  words: string[],
  cursorPosition: number,
  cursorWord: { word: string; startPos: number; endPos: number }
): { params: Record<string, ParsedParam>; currentParamId: string | null } {
  const params: Record<string, ParsedParam> = {};
  let currentParamId: string | null = null;
  const currentWordStart = 0;

  // Collect position information for all words
  const wordPositions = collectWordPositions(text, words, currentWordStart);

  // Process different parameter types sequentially
  assignParameters(
    ParamType.Amount,
    command,
    params,
    wordPositions,
    cursorPosition,
    currentParamId
  );
  assignParameters(ParamType.Token, command, params, wordPositions, cursorPosition, currentParamId);
  assignParameters(
    ParamType.Address,
    command,
    params,
    wordPositions,
    cursorPosition,
    currentParamId
  );

  // Process remaining unassigned parameters
  assignRemainingParameters(command, params, wordPositions, cursorPosition, currentParamId);

  // Process cursor parameter logic
  currentParamId = findCursorParam(
    params,
    cursorWord,
    cursorPosition,
    text,
    command,
    currentParamId
  );

  return { params, currentParamId };
}

/**
 * Collect position information for all words
 */
function collectWordPositions(
  text: string,
  words: string[],
  currentWordStart: number
): { word: string; startPos: number; endPos: number }[] {
  const wordPositions: { word: string; startPos: number; endPos: number }[] = [];

  // Iterate through each word, collecting position information
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wordStartPos = text.indexOf(word, currentWordStart);
    const wordEndPos = wordStartPos + word.length;
    currentWordStart = wordEndPos;

    // Only consider words after the command
    if (i > 0) {
      wordPositions.push({
        word,
        startPos: wordStartPos,
        endPos: wordEndPos,
      });
    }
  }

  return wordPositions;
}

/**
 * Assign parameters of specified type
 */
function assignParameters(
  paramType: ParamType,
  command: CommandDefinition,
  params: Record<string, ParsedParam>,
  wordPositions: { word: string; startPos: number; endPos: number }[],
  cursorPosition: number,
  currentParamId: string | null
): void {
  const iterable =
    paramType === ParamType.Token
      ? [...wordPositions].sort((a, b) => {
          const aComplete = validateParamValue(a.word, ParamType.Token) ? 1 : 0;
          const bComplete = validateParamValue(b.word, ParamType.Token) ? 1 : 0;
          return bComplete - aComplete; // complete first
        })
      : wordPositions;

  for (const wordPos of iterable) {
    const { word } = wordPos;

    // Skip if already assigned
    if (Object.values(params).some(p => p.startPos === wordPos.startPos)) {
      continue;
    }

    if (isLikelyParamType(word, paramType)) {
      const typeParam = command.params.find(
        p => p.type === paramType && !Object.keys(params).includes(p.id)
      );

      if (typeParam) {
        const isComplete = validateParamValue(word, paramType);
        params[typeParam.id] = {
          paramId: typeParam.id,
          value: word,
          startPos: wordPos.startPos,
          endPos: wordPos.endPos,
          complete: isComplete,
        };

        // Check if cursor is within this word
        if (cursorPosition >= wordPos.startPos && cursorPosition <= wordPos.endPos) {
          currentParamId = typeParam.id;
        }
      }
    }
  }
}

/**
 * Assign remaining unassigned parameters
 */
function assignRemainingParameters(
  command: CommandDefinition,
  params: Record<string, ParsedParam>,
  wordPositions: { word: string; startPos: number; endPos: number }[],
  cursorPosition: number,
  currentParamId: string | null
): void {
  for (const wordPos of wordPositions) {
    const { word } = wordPos;

    // Skip if already assigned
    if (Object.values(params).some(p => p.startPos === wordPos.startPos)) {
      continue;
    }

    // Try to find any unassigned parameter
    const availableParam = command.params.find(p => !Object.keys(params).includes(p.id));
    if (availableParam) {
      const isComplete = validateParamValue(word, availableParam.type);
      params[availableParam.id] = {
        paramId: availableParam.id,
        value: word,
        startPos: wordPos.startPos,
        endPos: wordPos.endPos,
        complete: isComplete,
      };

      // Check if cursor is within this word
      if (cursorPosition >= wordPos.startPos && cursorPosition <= wordPos.endPos) {
        currentParamId = availableParam.id;
      }
    }
  }
}

/**
 * Find the parameter where the cursor is located
 */
function findCursorParam(
  params: Record<string, ParsedParam>,
  cursorWord: { word: string; startPos: number; endPos: number },
  cursorPosition: number,
  text: string,
  command: CommandDefinition,
  currentParamId: string | null
): string | null {
  // If cursor is on a word in the text but not recognized as a parameter
  if (!currentParamId && cursorWord.word.trim() !== '') {
    // Check if cursor is on a parameter value
    for (const paramId in params) {
      const param = params[paramId];
      if (cursorPosition >= param.startPos && cursorPosition <= param.endPos) {
        currentParamId = paramId;
        break;
      }
    }
  }

  // Special case: if cursor is at a space position
  if (!currentParamId && text[cursorPosition - 1] === ' ') {
    currentParamId = findNextParamAfterSpace(params, cursorPosition, command);
  }

  // If cursor parameter still not found, but cursor is after the command, find next incomplete parameter
  if (!currentParamId && cursorPosition > text.indexOf(' ')) {
    currentParamId = findNextRequiredParam(command, params);
  }

  return currentParamId;
}

/**
 * Find next parameter after a space
 */
function findNextParamAfterSpace(
  params: Record<string, ParsedParam>,
  cursorPosition: number,
  command: CommandDefinition
): string | null {
  // Find the last parameter before the cursor
  let lastParamEndPos = -1;
  let lastParamId: string | null = null;

  for (const paramId in params) {
    const param = params[paramId];
    if (param.endPos < cursorPosition && param.endPos > lastParamEndPos) {
      lastParamEndPos = param.endPos;
      lastParamId = paramId;
    }
  }

  if (lastParamId) {
    // Find the first incomplete parameter after the cursor
    const lastParamIndex = command.params.findIndex(p => p.id === lastParamId);

    if (lastParamIndex >= 0 && lastParamIndex < command.params.length - 1) {
      // If cursor is after the last parameter, find the next required parameter
      const nextParams = command.params.slice(lastParamIndex + 1);
      const nextRequiredParam = nextParams.find(p => p.required && !params[p.id]?.complete);

      if (nextRequiredParam) {
        return nextRequiredParam.id;
      }
    }
  }

  return null;
}

/**
 * Find the next required parameter
 */
function findNextRequiredParam(
  command: CommandDefinition,
  params: Record<string, ParsedParam>
): string | null {
  // First check if there's an incomplete Token parameter
  const tokenParam = command.params.find(
    p => p.type === ParamType.Token && !params[p.id]?.complete
  );

  if (tokenParam) {
    return tokenParam.id;
  } else {
    // Find any incomplete required parameter
    const nextRequiredParam = command.params.find(p => p.required && !params[p.id]?.complete);

    if (nextRequiredParam) {
      return nextRequiredParam.id;
    }
  }

  return null;
}

/**
 * Get the word at a specific position in the text
 * @param text Text
 * @param position Position
 * @returns Word and its range
 */
export function getWordAtPosition(
  text: string,
  position: number
): { word: string; startPos: number; endPos: number } {
  if (position < 0 || position > text.length) {
    return { word: '', startPos: 0, endPos: 0 };
  }

  // Find the start position of the word
  let startPos = position;
  while (startPos > 0 && !/\s/.test(text[startPos - 1])) {
    startPos--;
  }

  // Find the end position of the word
  let endPos = position;
  while (endPos < text.length && !/\s/.test(text[endPos])) {
    endPos++;
  }

  return {
    word: text.substring(startPos, endPos),
    startPos,
    endPos,
  };
}

/**
 * Replace a range of text
 * @param originalText Original text
 * @param startPos Start position
 * @param endPos End position
 * @param replacement Replacement text
 * @returns Text after replacement
 */
export function replaceTextRange(
  originalText: string,
  startPos: number,
  endPos: number,
  replacement: string
): string {
  return originalText.substring(0, startPos) + replacement + originalText.substring(endPos);
}
