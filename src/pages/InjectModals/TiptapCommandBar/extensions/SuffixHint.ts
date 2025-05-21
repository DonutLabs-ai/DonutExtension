import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import type { Node as ProseMirrorNode } from 'prosemirror-model';
import { getDocVisualContent } from '../utils/editorUtils';
import { useTiptapCommandBarStore } from '../store/tiptapStore';

export interface SuffixHintOptions {
  // The hint text
  text: string;
  // The CSS class to display
  class: string;
  // Whether to enable
  enabled: boolean;
}

function processAiSuggestion(input: string): string {
  const store = useTiptapCommandBarStore.getState();
  const { aiSuggestion } = store;

  if (!input || !aiSuggestion) return '';

  const normalizeStr = (s: string) => s.replace(/\s+/g, ' ');
  const normalizedInput = normalizeStr(input.toLowerCase());
  const normalizedSuggestion = normalizeStr(aiSuggestion.toLowerCase());

  if (
    !normalizedSuggestion.startsWith(normalizedInput) ||
    normalizedSuggestion === normalizedInput
  ) {
    return '';
  }

  try {
    if (aiSuggestion.length > input.length) {
      return aiSuggestion.substring(normalizedInput.length);
    }
  } catch (error) {
    return '';
  }

  return '';
}

/**
 * Find the end position of the last content node (text or token node) in the document
 */
function findLastTextPos(doc: ProseMirrorNode): number {
  let lastTextPos = 0;

  doc.descendants((node, pos) => {
    // Handle text nodes
    if (node.isText && node.text && node.text.length > 0) {
      lastTextPos = pos + node.text.length;
    }
    // Handle token nodes - they're atomic nodes so we need to include their position
    else if (node.type?.name === 'tokenNode') {
      // For an atom node, we need to add 1 to get to the end of the node
      lastTextPos = pos + 1;
    }
    return true;
  });

  return lastTextPos;
}

// Plugin state interface
interface SuffixHintPluginState {
  version: number;
  hideHint: boolean;
}

export const SuffixHint = Extension.create<SuffixHintOptions>({
  name: 'suffixHint',

  addOptions() {
    return {
      text: '',
      class: 'suffix-hint',
      enabled: true,
    };
  },

  addProseMirrorPlugins() {
    const pluginKey = new PluginKey('suffix-hint');
    const { text, class: className, enabled } = this.options;
    const editor = this.editor;

    // Initialize storage
    this.editor.storage.suffixHint = {
      hideHint: false,
    };

    return [
      new Plugin<SuffixHintPluginState>({
        key: pluginKey,
        // Add state field to explicitly track document changes
        state: {
          init(): SuffixHintPluginState {
            return { version: 0, hideHint: false };
          },
          apply(tr, prevState: SuffixHintPluginState): SuffixHintPluginState {
            // Check for force update meta
            const forceUpdate = tr.getMeta('forceUpdateDecorations');
            const hideHint = tr.getMeta('hideHint');

            return {
              version: tr.docChanged || forceUpdate ? Date.now() : prevState.version,
              hideHint:
                hideHint !== undefined ? hideHint : editor?.storage.suffixHint?.hideHint || false,
            };
          },
        },
        props: {
          decorations: state => {
            try {
              if (!enabled) return DecorationSet.empty;
              if (editor.storage.suffixHint?.hideHint) return DecorationSet.empty;

              const { doc } = state;

              const visualContent = getDocVisualContent(doc);
              if (!visualContent || visualContent.trim() === '') return DecorationSet.empty;

              const lastTextPos = findLastTextPos(doc);
              if (lastTextPos === 0) return DecorationSet.empty;

              let hintText = '';
              try {
                hintText = processAiSuggestion(visualContent);
              } catch (error) {
                if (text) hintText = text;
              }

              if (!hintText) return DecorationSet.empty;

              const deco = Decoration.widget(
                lastTextPos,
                () => {
                  const span = document.createElement('span');
                  span.className = className;
                  // span.textContent = hintText;
                  span.contentEditable = 'false';
                  span.setAttribute('data-text', hintText);
                  return span;
                },
                { key: `suffix-hint-${visualContent.length}-${Date.now()}`, side: 1 }
              );

              return DecorationSet.create(doc, [deco]);
            } catch (error) {
              return DecorationSet.empty;
            }
          },
        },
      }),
    ];
  },
});
