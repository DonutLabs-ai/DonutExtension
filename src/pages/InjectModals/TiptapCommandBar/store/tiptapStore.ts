import { create } from 'zustand';
import { Editor } from '@tiptap/core';
import { ParsedCommand } from '../utils/commandUtils';

export enum SuggestionType {
  None = 'none',
  Command = 'command',
  Token = 'token',
  Address = 'address',
  Preview = 'preview',
}

interface TiptapCommandBarState {
  // Editor state
  content: string;
  activeSuggestion: SuggestionType;
  selectedCommandId: string | null;
  parsedCommand: ParsedCommand | null;
  lastSelectionCursorPos: number;
  parameters: Record<string, any>;
  editor: Editor | null;

  // AI suggestion state
  aiSuggestion: string;

  // Command execution state
  isExecuting: boolean;

  // Actions
  setContent: (content: string) => void;
  setActiveSuggestion: (type: SuggestionType) => void;
  setSelectedCommand: (commandId: string | null) => void;
  setParsedCommand: (parsedCommand: ParsedCommand | null) => void;
  setLastSelectionCursorPos: (position: number) => void;
  setParameter: (key: string, value: any) => void;
  setEditor: (editor: Editor | null) => void;
  setAiSuggestion: (suggestion: string) => void;
  setIsExecuting: (isExecuting: boolean) => void;
  updateMultipleStates: (updates: Partial<TiptapCommandBarState>) => void;
  reset: () => void;
}

export const useTiptapCommandBarStore = create<TiptapCommandBarState>(set => ({
  // Initial state
  content: '',
  activeSuggestion: SuggestionType.None,
  selectedCommandId: null,
  parsedCommand: null,
  lastSelectionCursorPos: 0,
  parameters: {},
  editor: null,
  aiSuggestion: '',
  isExecuting: false,

  // Actions
  setContent: content => set({ content }),

  setActiveSuggestion: type => set({ activeSuggestion: type }),

  setSelectedCommand: commandId =>
    set({
      selectedCommandId: commandId,
      // Reset parameters when changing commands
      parameters: {},
    }),

  setParsedCommand: parsedCommand => set({ parsedCommand }),

  setLastSelectionCursorPos: position => set({ lastSelectionCursorPos: position }),

  setParameter: (key, value) =>
    set(state => ({
      parameters: {
        ...state.parameters,
        [key]: value,
      },
    })),

  setEditor: editor => set({ editor }),

  setAiSuggestion: suggestion => set({ aiSuggestion: suggestion }),

  setIsExecuting: isExecuting => set({ isExecuting }),

  updateMultipleStates: updates => set(state => ({ ...state, ...updates })),

  reset: () =>
    set({
      content: '',
      activeSuggestion: SuggestionType.None,
      selectedCommandId: null,
      parsedCommand: null,
      lastSelectionCursorPos: 0,
      parameters: {},
      aiSuggestion: '',
      isExecuting: false,
    }),
}));
