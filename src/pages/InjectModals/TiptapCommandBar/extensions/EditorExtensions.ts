import { Extension } from '@tiptap/react';
import { Plugin, PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

/**
 * Disable Enter key extension
 * Blocks Enter key events to prevent line breaks
 */
export const DisableEnter = Extension.create({
  name: 'disableEnter',
  addKeyboardShortcuts() {
    return {
      Enter: () => true, // Block Enter key events
    };
  },
});

/**
 * Extension to fix trailing nodes in ProseMirror
 * Handles DOM manipulation to hide unwanted trailing elements
 */
export const FixTrailingNodesExtension = Extension.create({
  name: 'fixTrailingNodes',

  addProseMirrorPlugins() {
    const pluginKey = new PluginKey('fix-trailing-nodes');

    return [
      new Plugin({
        key: pluginKey,
        view: () => {
          // Function to handle trailing elements
          const fixTrailingElements = (view: EditorView) => {
            if (!view.dom) return;

            // Get all trailing elements
            const separators = view.dom.querySelectorAll('.ProseMirror-separator');
            const trailingBreaks = view.dom.querySelectorAll('.ProseMirror-trailingBreak');

            // Handle ProseMirror-separator
            separators.forEach((el: Element) => {
              if (el instanceof HTMLElement) {
                el.style.display = 'none';
                el.style.height = '0';
                el.style.width = '0';
                el.style.position = 'absolute';
                el.style.visibility = 'hidden';
              }
            });

            // Handle ProseMirror-trailingBreak
            trailingBreaks.forEach((el: Element) => {
              if (el instanceof HTMLElement) {
                el.style.display = 'inline';
                el.style.height = '0';
                el.style.width = '0';
                el.style.margin = '0';
                el.style.padding = '0';
              }
            });
          };

          return {
            update: (view: EditorView) => {
              fixTrailingElements(view);
            },
            destroy: () => {
              // Cleanup logic if needed
            },
          };
        },
        props: {
          handleDOMEvents: {
            input(view: EditorView) {
              const editorElement = view.dom;
              if (!editorElement) return false;

              // Get all trailing elements
              const separators = editorElement.querySelectorAll('.ProseMirror-separator');
              const trailingBreaks = editorElement.querySelectorAll('.ProseMirror-trailingBreak');
              const hasTokens = editorElement.querySelectorAll('.token-view-wrapper').length > 0;

              // If there are token nodes, ensure trailing elements don't affect layout
              if (hasTokens) {
                separators.forEach((el: Element) => {
                  if (el instanceof HTMLElement) {
                    el.style.display = 'none';
                    el.style.height = '0';
                    el.style.width = '0';
                    el.style.position = 'absolute';
                    el.style.visibility = 'hidden';
                  }
                });

                trailingBreaks.forEach((el: Element) => {
                  if (el instanceof HTMLElement) {
                    el.style.display = 'inline';
                    el.style.height = '0';
                    el.style.width = '0';
                    el.style.margin = '0';
                    el.style.padding = '0';
                  }
                });
              }

              return false; // Let other handlers process this event
            },
          },
        },
      }),
    ];
  },
});
