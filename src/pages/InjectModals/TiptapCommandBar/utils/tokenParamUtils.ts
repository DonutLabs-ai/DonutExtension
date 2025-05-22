import { ParamType } from './commandData';
import { Editor } from '@tiptap/core';
import { useTokenStore } from '@/stores/tokenStore';
import type { TokenInfo } from '@/stores/tokenStore';

// Special format marker for token parameters
const TOKEN_PREFIX = '@TOKEN:';
const TOKEN_SUFFIX = '@';

/**
 * Extended ParsedCommand interface, containing all fields we need
 */
export interface ExtendedParsedCommand {
  startsWithSlash: boolean;
  commandId?: string;
  command?: any;
  isComplete?: boolean;
  parameters?: Record<string, any>;
  cursorParamId?: string | null;
  commandConfirmed?: boolean;
  // Extended fields
  parsedParams?: Record<
    string,
    {
      paramId: string;
      value: string;
      startPos: number;
      endPos: number;
      complete: boolean;
    }
  >;
  nextParamNeedingSuggestionId?: string | null;
}

/**
 * Command parameter type interface
 */
export interface CommandParamType {
  id: string;
  name: string;
  type: ParamType;
  required: boolean;
  placeholder?: string;
}

/**
 * Word position interface, represents position of a word in text
 */
export interface WordPosition {
  word: string;
  startPos: number;
  endPos: number;
}

/**
 * Gets the word at the specified position
 */
export const getWordAtPosition = (text: string, position: number): WordPosition => {
  if (position < 0 || position > text.length) {
    return { word: '', startPos: 0, endPos: 0 };
  }

  // Find word start position
  let startPos = position;
  while (startPos > 0 && !/\s/.test(text[startPos - 1])) {
    startPos--;
  }

  // Find word end position
  let endPos = position;
  while (endPos < text.length && !/\s/.test(text[endPos])) {
    endPos++;
  }

  return {
    word: text.substring(startPos, endPos),
    startPos,
    endPos,
  };
};

/**
 * Find word boundaries around cursor based on ProseMirror offset
 */
export function getWordRangeAroundCursor(doc: any, from: number): { start: number; end: number } {
  const docSize = doc.content.size;

  // Search forward for word start (find space or document beginning)
  let start = from;
  while (start > 0) {
    const char = doc.textBetween(start - 1, start, '', '');
    if (/\s/.test(char) || char === '') break;
    start--;
  }

  // Search backward for word end (find space or document end)
  let end = from;
  while (end < docSize) {
    const char = doc.textBetween(end, end + 1, '', '');
    if (/\s/.test(char) || char === '') break;
    end++;
  }

  return { start, end };
}

/**
 * Check if a parameter value is a token reference (using special format to store mint address)
 */
export function isTokenReference(value: string): boolean {
  return value?.startsWith(TOKEN_PREFIX) && value?.endsWith(TOKEN_SUFFIX);
}

/**
 * Extract mint address from a token reference
 */
export function extractMintFromTokenReference(value: string): string | null {
  if (!isTokenReference(value)) return null;

  // Remove prefix and suffix
  return value.substring(TOKEN_PREFIX.length, value.length - TOKEN_SUFFIX.length);
}

/**
 * Create a token reference string
 */
export function createTokenReference(mint: string): string {
  return `${TOKEN_PREFIX}${mint}${TOKEN_SUFFIX}`;
}

/**
 * Get complete token information from a reference
 */
export function getTokenInfoFromReference(value: string): TokenInfo | null {
  const mint = extractMintFromTokenReference(value);
  if (!mint) return null;

  const tokens = useTokenStore.getState().tokens;
  return tokens[mint] || Object.values(tokens).find(t => t.mint === mint) || null;
}

/**
 * Identify completed token parameters
 */
export function identifyCompletedTokenParams(parsedParams?: Record<string, any>): Set<string> {
  const completedTokenParams = new Set<string>();

  if (!parsedParams) return completedTokenParams;

  for (const paramId in parsedParams) {
    const param = parsedParams[paramId];
    if (param?.complete && isTokenReference(param.value)) {
      completedTokenParams.add(paramId);
    }
  }

  return completedTokenParams;
}

/**
 * Select next parameter needing token suggestion based on priority
 */
export function selectNextTokenParam(
  tokenParams: CommandParamType[],
  completedTokenParams: Set<string>,
  nextParamNeedingSuggestionId?: string | null,
  cursorParamId?: string | null
): CommandParamType | undefined {
  // Priority 1: Use nextParamNeedingSuggestionId
  if (nextParamNeedingSuggestionId) {
    const param = tokenParams.find(p => p.id === nextParamNeedingSuggestionId);
    if (param && !completedTokenParams.has(nextParamNeedingSuggestionId)) {
      return param;
    }
  }

  // Priority 2: Use cursorParamId
  if (cursorParamId) {
    const param = tokenParams.find(p => p.id === cursorParamId);
    if (param && !completedTokenParams.has(cursorParamId)) {
      return param;
    }
  }

  // Priority 3: Use first uncompleted token parameter
  for (const param of tokenParams) {
    if (!completedTokenParams.has(param.id)) {
      return param;
    }
  }

  return undefined;
}

/**
 * Extract valid token search keyword from text
 */
export function extractTokenSearchQuery(text: string): string {
  if (!text || text.trim() === '') return '';

  let query = text.toLowerCase().trim();

  // Extract valid token characters
  const validTokenChars = query.match(/[a-zA-Z0-9._-]+/g);
  if (validTokenChars && validTokenChars.length > 0) {
    // Use the last match as filter condition
    query = validTokenChars[validTokenChars.length - 1].toLowerCase();
  }

  return query;
}

/**
 * Extract current word from editor cursor position
 */
export function extractCursorWord(editor: Editor): string {
  try {
    const { state } = editor;
    const { doc, selection } = state;
    const { from } = selection;

    // Get word around cursor
    const { start, end } = getWordRangeAroundCursor(doc, from);
    return doc.textBetween(start, end, '', '').trim();
  } catch (error) {
    return '';
  }
}

/**
 * Determine current parameter value, considering cursor position and parsed parameters
 */
export function determineCurrentParamValue(
  editor: Editor,
  nextParam: CommandParamType,
  parameters?: Record<string, any>
): string {
  // First, get value from parsed parameters
  let currentParamValue = parameters?.[nextParam.id] || '';
  currentParamValue = currentParamValue.trim();

  // If current value is a token reference, we shouldn't override it with cursor text
  if (isTokenReference(currentParamValue)) {
    // Get token info and return its symbol as display value
    const tokenInfo = getTokenInfoFromReference(currentParamValue);
    return tokenInfo?.symbol || currentParamValue;
  }

  // Then, try to get updated value from cursor position
  const cursorWordText = extractCursorWord(editor);

  // If there's meaningful text at cursor position, and it's different from parameter value,
  // it likely represents the current parameter value the user is typing
  if (cursorWordText && cursorWordText !== currentParamValue) {
    // Only use it when cursor text doesn't match any existing parameter
    const matchesExistingParam = Object.values(parameters || {}).some(
      value => value === cursorWordText
    );

    if (!matchesExistingParam) {
      currentParamValue = cursorWordText;
    }
  }

  return currentParamValue;
}

/**
 * Enhances command parameters with complete token information
 * This function enriches token type parameters with full token information based on:
 * 1. Token references (containing mint addresses) from parsedParams
 * 2. Token symbols from regular parameters
 *
 * @param commandDef Command definition containing parameter specifications
 * @param parameters Command parameters to enhance
 * @param parsedParams Optional parsed parameters that may contain token references
 * @returns Enhanced parameters with complete token information
 */
export function enhanceParameters(
  commandDef: any,
  parameters: Record<string, any>,
  parsedParams?: Record<string, any>
): Record<string, any> {
  const enhancedParameters: Record<string, any> = { ...parameters };
  const tokens = useTokenStore.getState().tokens;

  // Process all token type parameters
  commandDef.params.forEach((param: any) => {
    if ([ParamType.Token, ParamType.TokenAddress].includes(param.type) && parameters[param.id]) {
      // First check if we have a token reference in parsedParams
      const paramRef = parsedParams?.[param.id]?.value;

      if (paramRef && isTokenReference(paramRef)) {
        // Extract mint from reference and get complete token info
        const tokenInfo = getTokenInfoFromReference(paramRef);
        if (tokenInfo) {
          // Replace parameter value with complete token info object
          enhancedParameters[param.id] = tokenInfo;
        }
      } else {
        // Try to find token by symbol
        const paramValue = parameters[param.id];
        const tokenInfo = Object.values(tokens).find(
          t => t.symbol.toLowerCase() === paramValue.toLowerCase()
        );
        if (tokenInfo) {
          enhancedParameters[param.id] = tokenInfo;
        }
      }
    }
  });

  return enhancedParameters;
}
