import { create } from 'zustand';

/**
 * Defines the type of trigger for command or token suggestions
 * '/' - Command trigger (used at the start of input)
 * '$' - Token trigger (can be used anywhere in the input)
 */
export type TriggerType = '/' | '$';

/**
 * Context information for an active trigger
 */
export interface TriggerContext {
  /** Type of trigger that was activated ('/' or '$') */
  type: TriggerType;
  /** Index position of the trigger symbol in text */
  start: number;
  /** Substring between the trigger symbol and cursor, used for filtering suggestions */
  query: string;
}

/**
 * State management interface for the command input component
 * Handles text input, cursor position, suggestion triggers, and selection
 */
interface CommandInputState {
  /** Current text content of the command input */
  text: string;

  /** Current position of the cursor in the text */
  cursorIndex: number;

  /** Active trigger context (command or token) if one is active, otherwise null */
  trigger: TriggerContext | null;

  /** Index of the currently selected suggestion in the suggestion list */
  activeSuggestionIndex: number;

  /**
   * Function to insert a replacement for the triggered text
   * This is set by the CommandInput component and used by SuggestionPopover
   */
  insertReplacement?: (replacement: string) => void;

  /**
   * Updates the text content of the input
   * @param text - New text content
   */
  setText: (text: string) => void;

  /**
   * Updates the cursor position in the text
   * @param index - New cursor index
   */
  setCursorIndex: (index: number) => void;

  /**
   * Sets or clears the active trigger
   * Will reset activeSuggestionIndex when trigger changes
   * @param trigger - New trigger context or null to clear
   */
  setTrigger: (trigger: TriggerContext | null) => void;

  /**
   * Sets the active suggestion index directly
   * @param index - Index to set as active
   */
  setActiveSuggestionIndex: (index: number) => void;

  /**
   * Registers the replacement function from the CommandInput component
   * @param fn - Function that handles replacing triggered text with selected suggestion
   */
  setInsertReplacement: (fn: (replacement: string) => void) => void;

  /**
   * Increments the active suggestion index (moves down the list)
   * Wraps around to the start when reaching the end
   * @param totalItems - Total number of suggestions in the list
   */
  incrementActiveSuggestionIndex: (totalItems: number) => void;

  /**
   * Decrements the active suggestion index (moves up the list)
   * Wraps around to the end when reaching the start
   * @param totalItems - Total number of suggestions in the list
   */
  decrementActiveSuggestionIndex: (totalItems: number) => void;
}

/**
 * Zustand store for managing command input state
 * Handles text input, suggestions, and selection
 */
export const useCommandInputStore = create<CommandInputState>(set => ({
  text: '',
  cursorIndex: 0,
  trigger: null,
  activeSuggestionIndex: 0,
  setText: text => set({ text }),
  setCursorIndex: cursorIndex => set({ cursorIndex }),
  setTrigger: trigger =>
    set(state => {
      // Only reset the selected index when trigger changes
      const shouldResetIndex =
        !state.trigger ||
        !trigger ||
        state.trigger.type !== trigger.type ||
        state.trigger.query !== trigger.query;

      return {
        trigger,
        ...(shouldResetIndex ? { activeSuggestionIndex: 0 } : {}),
      };
    }),
  setActiveSuggestionIndex: index => set({ activeSuggestionIndex: index }),
  incrementActiveSuggestionIndex: totalItems =>
    set(state => ({
      activeSuggestionIndex: (state.activeSuggestionIndex + 1) % Math.max(1, totalItems),
    })),
  decrementActiveSuggestionIndex: totalItems =>
    set(state => ({
      activeSuggestionIndex:
        (state.activeSuggestionIndex - 1 + totalItems) % Math.max(1, totalItems),
    })),
  setInsertReplacement: fn => set({ insertReplacement: fn }),
}));
