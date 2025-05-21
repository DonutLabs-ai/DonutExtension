/**
 * Editor utility functions
 * Contains ProseMirror DOM operations and editor helper functions
 */

import type { Node as ProseMirrorNode } from 'prosemirror-model';

// Define style cache to reduce the cost of repeated style settings
const hiddenElementStyle = {
  display: 'none',
  width: '0',
  height: '0',
  position: 'absolute',
  visibility: 'hidden',
};

const inlineBreakStyle = {
  display: 'inline',
  width: '0',
  height: '0',
  margin: '0',
  padding: '0',
};

/**
 * Efficiently removes trailing nodes added automatically by ProseMirror
 * Uses CSS class definitions and caching mechanism to reduce repeated DOM operations
 */
export function removeTrailingNodesWithEditor(editor: any): void {
  if (!editor?.view?.dom) return;

  // Get editor DOM
  const editorDOM = editor.view.dom;

  // Add a marker class to processed elements to avoid reprocessing the same elements
  const PROCESSED_CLASS = 'tiptap-trailing-processed';

  // Get all trailing elements
  const separators = editorDOM.querySelectorAll(`.ProseMirror-separator:not(.${PROCESSED_CLASS})`);
  const breaks = editorDOM.querySelectorAll(`.ProseMirror-trailingBreak:not(.${PROCESSED_CLASS})`);

  // Hide elements and mark as processed
  if (separators.length > 0) {
    separators.forEach((el: Element) => {
      if (el instanceof HTMLElement) {
        // Set all style properties at once, rather than one by one
        Object.assign(el.style, hiddenElementStyle);
        el.classList.add(PROCESSED_CLASS);
      }
    });
  }

  if (breaks.length > 0) {
    breaks.forEach((el: Element) => {
      if (el instanceof HTMLElement) {
        // Set all style properties at once
        Object.assign(el.style, inlineBreakStyle);
        el.classList.add(PROCESSED_CLASS);
      }
    });
  }
}

/**
 * Attempts to maintain cursor position or move to the end
 * Used after content updates
 */
export function maintainCursorPosition(
  editor: any,
  content: string,
  from: number,
  to: number
): void {
  if (!editor) return;

  try {
    // If the original selection position is still valid, maintain it
    if (from <= content.length && to <= content.length) {
      editor.commands.setTextSelection({ from, to });
    } else {
      // Otherwise move to the end
      editor.commands.focus('end');
    }

    // Process trailing elements after content update
    removeTrailingNodesWithEditor(editor);
  } catch (e) {
    editor.commands.focus('end');
  }
}

/**
 * Adds DOM observer to handle ProseMirror elements
 * Uses debouncing to reduce frequent DOM updates
 * Returns a cleanup function to use when the component unmounts
 */
export function addDOMObserver(editor: any, callback: () => void): () => void {
  if (!editor) {
    // Return an empty function, but don't use an empty arrow function to avoid linter errors
    return function cleanupNoop() {
      /* No operation */
    };
  }

  // Use debouncing to reduce frequent updates
  let debounceTimer: NodeJS.Timeout | null = null;

  // Debounced callback handler
  const debouncedCallback = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      if (callback) callback();
    }, 100); // 100ms debounce time
  };

  // Handle DOM updates
  const handleUpdate = () => {
    debouncedCallback();
  };

  // Listen for editor updates and selection updates
  editor.on('update', handleUpdate);
  editor.on('selectionUpdate', handleUpdate);

  // Add mutation observer to watch for DOM changes
  let observer: MutationObserver | null = null;

  if (typeof window !== 'undefined' && typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver(debouncedCallback);

    if (editor?.view?.dom) {
      observer.observe(editor.view.dom, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false,
      });
    }
  }

  // Return cleanup function
  return () => {
    editor.off('update', handleUpdate);
    editor.off('selectionUpdate', handleUpdate);
    if (observer) observer.disconnect();
    if (debounceTimer) clearTimeout(debounceTimer);
  };
}

/**
 * Get the "visual equivalent content" of the doc, the text node takes the text, and the tokenNode takes the symbol.
 */
export function getDocVisualContent(doc: ProseMirrorNode): string {
  let result = '';
  doc.descendants(node => {
    if (node.isText) {
      result += node.text;
    } else if (node.type && node.type.name === 'tokenNode' && node.attrs?.symbol) {
      result += node.attrs.symbol;
    }
    return true;
  });
  return result;
}
