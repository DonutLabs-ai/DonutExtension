import { create } from 'zustand';
import { ParsedCommand } from '../utils/commandParser';

export enum SuggestionType {
  None = 'none',
  Command = 'command',
  Token = 'token',
  Address = 'address',
  Preview = 'preview', // Command preview type
}

interface CommandInputState {
  // Input text value
  inputValue: string;
  // Cursor position
  cursorPosition: number;
  // Parsed command object
  parsedCommand: ParsedCommand | null;
  // Current active suggestion type
  activeSuggestion: SuggestionType;
  // Last cursor position when selecting a suggestion, used to fix cursor position after selection
  lastSelectionCursorPos: number | null;

  // Actions
  setInputValue: (value: string) => void;
  setCursorPosition: (position: number) => void;
  setParsedCommand: (parsed: ParsedCommand | null) => void;
  setActiveSuggestion: (type: SuggestionType) => void;
  setLastSelectionCursorPos: (position: number | null) => void;
  resetInput: () => void;
}

export const useCommandInputStore = create<CommandInputState>(set => ({
  inputValue: '',
  cursorPosition: 0,
  parsedCommand: null,
  activeSuggestion: SuggestionType.None,
  lastSelectionCursorPos: null,

  setInputValue: (value: string) => set({ inputValue: value }),
  setCursorPosition: (position: number) => set({ cursorPosition: position }),
  setParsedCommand: (parsed: ParsedCommand | null) => set({ parsedCommand: parsed }),
  setActiveSuggestion: (type: SuggestionType) => set({ activeSuggestion: type }),
  setLastSelectionCursorPos: (position: number | null) => set({ lastSelectionCursorPos: position }),
  resetInput: () =>
    set({
      inputValue: '',
      cursorPosition: 0,
      parsedCommand: null,
      activeSuggestion: SuggestionType.None,
      lastSelectionCursorPos: null,
    }),
}));
