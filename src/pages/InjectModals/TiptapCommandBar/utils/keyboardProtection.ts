// Classification of keyboard keys based on their function and risk level
export type KeyType = 'system-control' | 'high-risk' | 'navigation' | 'input' | 'other';

export interface SuggestionState {
  isShowingSuggestions: boolean;
  suggestionType: string;
}

export interface KeyboardProtectionConfig {
  editorElement: HTMLElement;
  tiptapEditor?: any;
  getSuggestionState?: () => SuggestionState;
}

export interface KeyboardProtectionInstance {
  destroy: () => void;
  reinitialize: (config: KeyboardProtectionConfig) => void;
  forceInsert: (character: string) => boolean;
}

// Key classification constants
const SYSTEM_CONTROL_KEYS = ['Escape']; // System control keys (usually should not be blocked)
const HIGH_RISK_KEYS = ['/', '、', '\\', '?']; // Keys that are often hijacked by pages
const NAVIGATION_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Tab'];
const INPUT_KEYS = ['Backspace', 'Delete', 'Home', 'End', 'PageUp', 'PageDown'];

/**
 * Protection strategy for different key types
 * - false: Don't protect (let page handle)
 * - true: Always protect
 * - 'contextual': Protect based on context (e.g., suggestion state)
 */
const PROTECTION_STRATEGY = {
  'system-control': false, // Don't interfere with system keys
  'high-risk': true, // Always protect high-risk keys (like slash)
  navigation: 'contextual', // Protect navigation only when no suggestions showing
  input: true, // Always protect input keys
  other: true, // Protect other keys by default
} as const;

/**
 * Check if the editor is currently focused
 * This function handles both regular DOM and Shadow DOM scenarios
 *
 * @param event - The keyboard event
 * @param editorElement - The editor DOM element
 * @returns true if editor is focused
 */
function isEditorFocused(event: Event, editorElement: HTMLElement): boolean {
  if (!event.target || !(event.target instanceof HTMLElement)) {
    return false;
  }

  const target = event.target;

  // Check if event target is the editor or inside the editor
  if (editorElement === target || editorElement.contains(target)) {
    return true;
  }

  // Check document active element
  const activeElement = document.activeElement;
  if (activeElement && (editorElement === activeElement || editorElement.contains(activeElement))) {
    return true;
  }

  // Check Shadow DOM active element (important for content scripts)
  const shadowRoot = editorElement.getRootNode();
  if (shadowRoot instanceof ShadowRoot) {
    const shadowActiveElement = shadowRoot.activeElement;
    if (
      shadowActiveElement &&
      (editorElement === shadowActiveElement || editorElement.contains(shadowActiveElement))
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Classify a keyboard key based on its function and potential risk
 *
 * @param key - The key string from keyboard event
 * @returns KeyType classification
 */
function classifyKey(key: string): KeyType {
  if (SYSTEM_CONTROL_KEYS.includes(key)) return 'system-control';
  if (HIGH_RISK_KEYS.includes(key)) return 'high-risk';
  if (NAVIGATION_KEYS.includes(key)) return 'navigation';
  if (INPUT_KEYS.includes(key) || key.length === 1) return 'input';
  return 'other';
}

/**
 * Determine if a key should be protected based on its type and current context
 *
 * @param keyType - The classified key type
 * @param suggestionState - Current suggestion display state
 * @returns true if the key should be protected
 */
function shouldProtectKey(keyType: KeyType, suggestionState: SuggestionState): boolean {
  const strategy = PROTECTION_STRATEGY[keyType];

  // Contextual protection: protect navigation keys only when suggestions are not showing
  // This prevents interference with suggestion navigation
  if (strategy === 'contextual') {
    return !suggestionState.isShowingSuggestions;
  }

  return Boolean(strategy);
}

/**
 * Create a keyboard protection instance for the editor
 *
 * This function sets up multi-level event listeners to intercept keyboard events
 * before they can be hijacked by the page. It uses both capture and bubble phases
 * for maximum protection coverage.
 *
 * @param config - Configuration for the protection instance
 * @returns KeyboardProtectionInstance with management methods
 */
export function createKeyboardProtection(
  config: KeyboardProtectionConfig
): KeyboardProtectionInstance {
  const { editorElement, tiptapEditor, getSuggestionState } = config;

  // Store all event listeners for cleanup
  const listeners: {
    element: EventTarget;
    event: string;
    handler: EventListener;
    options: boolean | AddEventListenerOptions;
  }[] = [];

  function addListener(
    element: EventTarget,
    event: string,
    handler: EventListener,
    options: boolean | AddEventListenerOptions = false
  ) {
    element.addEventListener(event, handler, options);
    listeners.push({ element, event, handler, options });
  }

  /**
   * Main protection handler that intercepts keyboard events
   *
   * This handler:
   * 1. Checks if the event is a keyboard event and editor is focused
   * 2. Classifies the key and determines protection strategy
   * 3. Blocks the event if protection is needed
   */
  const protectionHandler = (event: Event) => {
    // Only handle keyboard events when editor is focused
    if (!(event instanceof KeyboardEvent) || !isEditorFocused(event, editorElement)) {
      return false;
    }

    const key = event.key;
    const keyType = classifyKey(key);
    const suggestionState = getSuggestionState?.() || {
      isShowingSuggestions: false,
      suggestionType: 'None',
    };
    const shouldProtect = shouldProtectKey(keyType, suggestionState);

    if (shouldProtect) {
      // Stop event propagation to prevent page from handling it
      event.stopPropagation();
      event.stopImmediatePropagation();
      return true;
    }

    return false;
  };

  /**
   * Register protection event listeners on multiple levels
   *
   * We register on both window and document to ensure coverage,
   * and use capture phase for highest priority interception.
   */
  const registerProtection = () => {
    // Window level - highest priority
    addListener(window, 'keydown', protectionHandler, { capture: true, passive: false });
    // Document level - secondary protection
    addListener(document, 'keydown', protectionHandler, { capture: true, passive: false });
    // Keypress events for additional coverage
    addListener(document, 'keypress', protectionHandler, { capture: true, passive: false });
  };

  // Initialize protection
  registerProtection();

  // Clean up all event listeners
  const destroy = () => {
    listeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });
    listeners.length = 0;
  };

  // Reinitialize protection with new configuration
  const reinitialize = (newConfig: KeyboardProtectionConfig) => {
    destroy();
    return createKeyboardProtection(newConfig);
  };

  /**
   * Force insert a character into the editor
   *
   * This is used when we need to manually insert characters that were
   * intercepted by the protection system (e.g., slash for commands).
   *
   * @param character - The character to insert
   * @returns true if insertion was successful
   */
  const forceInsert = (character: string): boolean => {
    if (!tiptapEditor || tiptapEditor.isDestroyed) {
      return false;
    }

    try {
      const { dispatch } = tiptapEditor.view;
      const tr = tiptapEditor.state.tr;

      // Delete current selection if any
      if (!tiptapEditor.state.selection.empty) {
        tr.deleteSelection();
      }

      // Insert the character
      tr.insertText(character);
      dispatch(tr);
      return true;
    } catch (error) {
      return false;
    }
  };

  return { destroy, reinitialize, forceInsert };
}

/**
 * Convenience function to create protection specifically for slash key handling
 *
 * This is a specialized version of createKeyboardProtection that's optimized
 * for command bar scenarios where slash key protection is critical.
 *
 * @param editorElement - The editor DOM element
 * @param tiptapEditor - Tiptap editor instance
 * @param getSuggestionState - Function to get suggestion state
 * @returns KeyboardProtectionInstance
 */
export function createSlashKeyProtection(
  editorElement: HTMLElement,
  tiptapEditor?: any,
  getSuggestionState?: () => SuggestionState
): KeyboardProtectionInstance {
  return createKeyboardProtection({
    editorElement,
    tiptapEditor,
    getSuggestionState,
  });
}

// Alternative exports for different use cases
export { createKeyboardProtection as createUniversalKeyboardProtection };
export type UniversalKeyboardProtectionInstance = KeyboardProtectionInstance;
