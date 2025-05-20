import { commands, ParamType } from './commandData';
import { validateParamValue, isLikelyParamType } from './validateParamValue';
import { WordPosition, ParsedParameter } from './commandUtils';

/**
 * Checks if a command is complete (all required parameters are filled)
 */
export function isCommandComplete(
  command: (typeof commands)[0],
  params: Record<string, ParsedParameter>
): boolean {
  return command.params
    .filter(param => param.required)
    .every(param => params?.[param.id]?.complete);
}

/**
 * Assigns parameters by type priority, not by input order
 * This allows for smarter parameter value substitution and more accurate command parsing
 */
export function assignParametersByType(
  command: (typeof commands)[0],
  parsedParams: Record<string, ParsedParameter>,
  wordPositions: WordPosition[]
): void {
  // If there are no words or parameters, return directly
  if (wordPositions.length === 0 || command.params.length === 0) {
    return;
  }

  // Create a copy of word positions to avoid modifying the original data
  const availableWordPositions: (WordPosition | undefined)[] = [...wordPositions];

  // Define type priority order
  const typeOrder = [ParamType.Amount, ParamType.Token, ParamType.Address, ParamType.Text];

  // Create parameter mapping grouped by type
  const paramsByType: Record<ParamType, (typeof command.params)[0][]> = {
    [ParamType.Amount]: [],
    [ParamType.Token]: [],
    [ParamType.Address]: [],
    [ParamType.Text]: [],
  };

  // Group parameters by type
  for (const param of command.params) {
    paramsByType[param.type].push(param);
  }

  // Special handling: preserve completed TokenNode parameters
  const preservedTokenParams = new Set<string>();
  for (const paramId in parsedParams) {
    if (parsedParams[paramId]?.complete && parsedParams[paramId]?.value?.startsWith('@TOKEN:')) {
      preservedTokenParams.add(paramId);
    }
  }

  // Process each type in priority order
  for (const currentType of typeOrder) {
    const paramsOfThisType = paramsByType[currentType];

    // Skip types with no parameters
    if (paramsOfThisType.length === 0) continue;

    // Find possible word positions for this type
    const candidatesForType: {
      wordIndex: number;
      word: WordPosition;
      score: number;
      isComplete: boolean;
    }[] = [];

    // Evaluate all available word positions
    for (let i = 0; i < availableWordPositions.length; i++) {
      const wordPos = availableWordPositions[i];
      if (!wordPos) continue; // Skip used positions

      const word = wordPos.word.trim();
      if (!word) continue; // Skip empty words

      // Check if this word could match the parameter type
      if (isLikelyParamType(word, currentType)) {
        const isComplete = validateParamValue(word, currentType);
        // Scoring: complete parameters first, then possible matches
        const score = isComplete ? 10 : 5;

        candidatesForType.push({
          wordIndex: i,
          word: wordPos,
          score,
          isComplete,
        });
      }
    }

    // Sort by score in descending order
    candidatesForType.sort((a, b) => b.score - a.score);

    // Assign parameters
    for (let i = 0; i < Math.min(paramsOfThisType.length, candidatesForType.length); i++) {
      const param = paramsOfThisType[i];

      // Skip preserved token parameters
      if (preservedTokenParams.has(param.id)) continue;

      const candidate = candidatesForType[i];
      if (!candidate) continue;

      // Mark this position as used
      availableWordPositions[candidate.wordIndex] = undefined;

      // Assign parameter
      parsedParams[param.id] = {
        paramId: param.id,
        value: candidate.word.word.trim(),
        startPos: candidate.word.startPos,
        endPos: candidate.word.endPos,
        complete: candidate.isComplete,
      };
    }
  }

  // Process any remaining unassigned parameters
  const unassignedParams = command.params.filter(
    p => !parsedParams[p.id] && !preservedTokenParams.has(p.id)
  );

  // Find remaining available word positions
  const remainingWords = availableWordPositions.filter((w): w is WordPosition => w !== undefined);

  // Assign remaining words to remaining parameters in order
  for (let i = 0; i < Math.min(unassignedParams.length, remainingWords.length); i++) {
    const param = unassignedParams[i];
    const wordPos = remainingWords[i];
    const cleanValue = wordPos.word.trim();
    const isComplete = validateParamValue(cleanValue, param.type);

    parsedParams[param.id] = {
      paramId: param.id,
      value: cleanValue,
      startPos: wordPos.startPos,
      endPos: wordPos.endPos,
      complete: isComplete,
    };
  }
}

/**
 * Collects word positions from text - preserves input order, strictly uses spaces as delimiters
 */
export function collectWordPositionsFrom(text: string, startIndex: number): WordPosition[] {
  const wordPositions: WordPosition[] = [];
  let currentPos = startIndex;

  // Skip any leading spaces
  while (currentPos < text.length && /\s/.test(text[currentPos])) {
    currentPos++;
  }

  // Process each space-separated word
  while (currentPos < text.length) {
    // Find next word boundary
    const wordStart = currentPos;
    let wordEnd = wordStart;

    // Find the end of the current word (advance until space or end of string)
    while (wordEnd < text.length && !/\s/.test(text[wordEnd])) {
      wordEnd++;
    }

    // If a word is found
    if (wordEnd > wordStart) {
      const word = text.substring(wordStart, wordEnd);

      // Only add when word is not empty
      if (word.trim().length > 0) {
        wordPositions.push({
          word,
          startPos: wordStart,
          endPos: wordEnd,
        });
      }
    }

    // Move to after this word and any subsequent spaces
    currentPos = wordEnd;
    while (currentPos < text.length && /\s/.test(text[currentPos])) {
      currentPos++;
    }
  }

  return wordPositions;
}

/**
 * Finds the parameter the cursor is currently in - based on position
 */
export function findCursorParam(
  params: Record<string, ParsedParameter>,
  cursorPosition: number,
  text: string,
  command: (typeof commands)[0]
): string | null {
  // If no parameters have been parsed yet but the command has parameters, return the first parameter ID
  if (Object.keys(params).length === 0 && command.params.length > 0) {
    return command.params[0].id;
  }

  // Special handling: check if there are any completed TokenNode parameters
  const completedTokenParamIds = new Set<string>();
  for (const paramId in params) {
    const param = params[paramId];
    // Parameters marked with the special TokenNode format are marked as completed
    if (param.complete && param.value.startsWith('@TOKEN:')) {
      completedTokenParamIds.add(paramId);
    }
  }

  // First check if the cursor is directly within a parameter's text position
  for (const paramId in params) {
    const param = params[paramId];
    // Skip completed token parameters - they are handled differently
    if (completedTokenParamIds.has(paramId)) {
      continue;
    }
    if (cursorPosition >= param.startPos && cursorPosition <= param.endPos) {
      return paramId;
    }
  }

  // If the cursor is in whitespace or at the end of input, determine which parameter it belongs to
  if (cursorPosition > 0) {
    // Find parameters before and after cursor
    let paramBeforeCursor: ParsedParameter | null = null;
    let paramAfterCursor: ParsedParameter | null = null;
    let maxEndBeforeCursor = -1;
    let minStartAfterCursor = Number.MAX_SAFE_INTEGER;

    // Find closest parameters to cursor position
    for (const paramId in params) {
      const param = params[paramId];
      // Skip completed token parameters
      if (completedTokenParamIds.has(paramId)) {
        continue;
      }

      if (param.endPos <= cursorPosition && param.endPos > maxEndBeforeCursor) {
        maxEndBeforeCursor = param.endPos;
        paramBeforeCursor = param;
      }
      if (param.startPos >= cursorPosition && param.startPos < minStartAfterCursor) {
        minStartAfterCursor = param.startPos;
        paramAfterCursor = param;
      }
    }

    // If cursor is right after a parameter with a space, check if we should move to the next parameter
    if (paramBeforeCursor && text[cursorPosition - 1] === ' ') {
      // Find parameter index in command definition
      const paramIndex = command.params.findIndex(p => p.id === paramBeforeCursor?.paramId);

      // If it's the last parameter, stay on current parameter
      if (paramIndex === command.params.length - 1) {
        return paramBeforeCursor.paramId;
      }

      // Get next parameter ID
      let nextParamId = command.params[paramIndex + 1].id;

      // If the next parameter is already completed as a TokenNode, skip to the one after it
      let nextParamIndex = paramIndex + 1;
      while (
        completedTokenParamIds.has(nextParamId) &&
        nextParamIndex < command.params.length - 1
      ) {
        nextParamIndex++;
        nextParamId = command.params[nextParamIndex].id;
      }

      // If the next parameter already has a value or the current parameter is incomplete, stay with current parameter
      if (params?.[nextParamId]?.value || !paramBeforeCursor.complete) {
        return paramBeforeCursor.paramId;
      }

      // Otherwise, move to the next parameter
      return nextParamId;
    }

    // If cursor is just before a parameter, use that parameter
    if (paramAfterCursor && text[cursorPosition - 1] === ' ') {
      return paramAfterCursor.paramId;
    }

    // If cursor is at the end of text with a space, find the next parameter to fill
    if (cursorPosition === text.length && cursorPosition > 0 && text[cursorPosition - 1] === ' ') {
      // Find the index of the last completed parameter
      let lastFilledParamIndex = -1;
      for (const paramId in params) {
        const param = params[paramId];
        if (param.complete) {
          const index = command.params.findIndex(p => p.id === paramId);
          if (index > lastFilledParamIndex) {
            lastFilledParamIndex = index;
          }
        }
      }

      // Try to move to the next unfilled parameter
      if (lastFilledParamIndex !== -1 && lastFilledParamIndex < command.params.length - 1) {
        let nextParamId = command.params[lastFilledParamIndex + 1].id;

        // Skip parameters already completed as TokenNodes
        let nextIndex = lastFilledParamIndex + 1;
        while (completedTokenParamIds.has(nextParamId) && nextIndex < command.params.length - 1) {
          nextIndex++;
          nextParamId = command.params[nextIndex].id;
        }

        return nextParamId;
      }

      // If no completed parameter is found, look for the first unfilled required parameter
      for (const param of command.params) {
        if (
          param.required &&
          !params?.[param.id]?.complete &&
          !completedTokenParamIds.has(param.id)
        ) {
          return param.id;
        }
      }

      // If all required parameters are filled, look for the first unfilled optional parameter
      for (const param of command.params) {
        if (
          !param.required &&
          !params?.[param.id]?.complete &&
          !completedTokenParamIds.has(param.id)
        ) {
          return param.id;
        }
      }
    } else if (paramBeforeCursor) {
      // If cursor is after a parameter but without a space, focus on that parameter
      return paramBeforeCursor.paramId;
    }
  }

  // If we can't determine the parameter from the cursor, but there are completed token parameters,
  // find the next parameter after the last completed token
  if (completedTokenParamIds.size > 0) {
    // Find the highest index of a completed token parameter
    let maxCompletedTokenIndex = -1;
    completedTokenParamIds.forEach(paramId => {
      const index = command.params.findIndex(p => p.id === paramId);
      if (index > maxCompletedTokenIndex) {
        maxCompletedTokenIndex = index;
      }
    });

    // If there are more parameters after the completed token, return the next one
    if (maxCompletedTokenIndex !== -1 && maxCompletedTokenIndex < command.params.length - 1) {
      const nextParamId = command.params[maxCompletedTokenIndex + 1].id;
      return nextParamId;
    }
  }

  // If no parameter is found but the command has parameters, return the first parameter
  if (command.params.length > 0) {
    return command.params[0].id;
  }

  return null;
}

/**
 * Gets the word at the specified position
 */
export function getWordAtPosition(text: string, position: number): WordPosition {
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
}
