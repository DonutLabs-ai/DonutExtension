import { ParsedCommand, getWordAtPosition, replaceTextRange, parseCommand } from './commandParser';
import { SuggestionType } from '../store/commandInputStore';

interface SelectHandlerParams {
  // Current input value
  inputValue: string;
  // Current cursor position
  cursorPosition: number;
  // Value to insert
  selectedValue: string;
  // Parsed command
  parsedCommand: ParsedCommand | null;
  // Function to set input value
  setInputValue: (value: string) => void;
  // Function to set cursor position
  setCursorPosition: (position: number) => void;
  // Function to set parsed command
  setParsedCommand: (parsed: ParsedCommand | null) => void;
}

/**
 * Unified handler for suggestion selection
 */
export function handleSuggestionSelect({
  inputValue,
  cursorPosition,
  selectedValue,
  parsedCommand,
  setInputValue,
  setCursorPosition,
  setParsedCommand,
}: SelectHandlerParams): void {
  // Ensure we have a command
  if (!parsedCommand?.command) {
    return;
  }

  // Get word at cursor position
  const currentWord = getWordAtPosition(inputValue, cursorPosition);

  // Special case: current word is part of the command, should not be replaced
  const isCommandPart = currentWord.word.startsWith('/') || currentWord.startPos === 0;
  let newValue = '';

  if (isCommandPart) {
    // Command part should not be replaced, we should add value after the command
    if (!inputValue.includes(' ')) {
      // No space after command, add space and value
      newValue = inputValue + ' ' + selectedValue + ' ';
    } else {
      // Command already has spaces, may have other parameters
      // Find the last space position and add value after it
      const lastSpaceIndex = inputValue.lastIndexOf(' ');
      newValue = inputValue.substring(0, lastSpaceIndex + 1) + selectedValue + ' ';
    }
  }
  // If current word is not empty, replace it
  else if (currentWord.word.trim() !== '') {
    // Normal replacement of current word
    newValue = replaceTextRange(
      inputValue,
      currentWord.startPos,
      currentWord.endPos,
      selectedValue
    );

    // Check if space needs to be added
    const newCursorPos = currentWord.startPos + selectedValue.length;
    const needSpace = newCursorPos === newValue.length || newValue[newCursorPos] !== ' ';

    if (needSpace) {
      // Add space
      newValue = newValue.substring(0, newCursorPos) + ' ' + newValue.substring(newCursorPos);
    }
  }
  // If there is no current word, add to the end of the command
  else {
    // If cursor is not on a word, try to add after the command
    // Ensure command has a space after it
    if (!inputValue.includes(' ')) {
      // No space after command, add space and value
      newValue = inputValue + ' ' + selectedValue + ' ';
    } else {
      // Command already has spaces, may have other parameters
      // Find the last space position and add value after it
      const lastSpaceIndex = inputValue.lastIndexOf(' ');
      newValue = inputValue.substring(0, lastSpaceIndex + 1) + selectedValue + ' ';
    }
  }

  // Update input value
  setInputValue(newValue);

  // Parse updated command
  const updatedParsedCmd = parseCommand(newValue, newValue.length);

  // Update parsed result
  setParsedCommand(updatedParsedCmd);

  // Set cursor position to end of string
  setCursorPosition(newValue.length);
}
