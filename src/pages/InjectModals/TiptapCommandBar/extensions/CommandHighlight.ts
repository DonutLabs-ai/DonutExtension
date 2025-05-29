import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, Transaction, EditorState } from 'prosemirror-state';
import { Node } from 'prosemirror-model';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { useTiptapCommandBarStore } from '../store/tiptapStore';

interface CommandHighlightOptions {
  HTMLAttributes: Record<string, any>;
}

interface CommandHighlightStorage {
  unsubscribe?: () => void;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    commandHighlight: {
      updateCommandHighlight: () => ReturnType;
    };
  }
}

function findCommandPosition(
  text: string,
  parsedCommand: any
): { from: number; to: number } | null {
  if (!parsedCommand?.command?.title) {
    return null;
  }

  const commandText = `/${parsedCommand.command.title}`;
  const commandStart = text.toLowerCase().indexOf(commandText.toLowerCase());

  if (commandStart === -1) return null;

  return {
    from: commandStart + 1,
    to: commandStart + commandText.length + 1,
  };
}

function createCommandDecorations(doc: Node, className: string): DecorationSet {
  const store = useTiptapCommandBarStore.getState();
  const { parsedCommand } = store;

  if (!parsedCommand?.commandConfirmed) {
    return DecorationSet.empty;
  }

  const commandPos = findCommandPosition(doc.textContent, parsedCommand);

  if (!commandPos) {
    return DecorationSet.empty;
  }

  const decoration = Decoration.inline(commandPos.from, commandPos.to, {
    class: className,
  });

  return DecorationSet.create(doc, [decoration]);
}

export const CommandHighlight = Extension.create<CommandHighlightOptions, CommandHighlightStorage>({
  name: 'commandHighlight',

  addOptions() {
    return { HTMLAttributes: { class: 'command-completed' } };
  },

  addStorage() {
    return { unsubscribe: void 0 };
  },

  addCommands() {
    return {
      updateCommandHighlight:
        () =>
        ({ tr, dispatch, state }) => {
          const newTr = state.tr.setMeta('forceUpdate', true);
          if (dispatch) {
            dispatch(newTr);
          }
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;

    return [
      new Plugin({
        key: new PluginKey('commandHighlight'),

        state: {
          init(): DecorationSet {
            return DecorationSet.empty;
          },

          apply(tr: Transaction, decorationSet: DecorationSet): DecorationSet {
            if (tr.docChanged || tr.getMeta('forceUpdate')) {
              return createCommandDecorations(tr.doc, options.HTMLAttributes.class);
            }

            return decorationSet.map(tr.mapping, tr.doc);
          },
        },

        props: {
          decorations(state: EditorState): DecorationSet {
            return this.getState(state)!;
          },
        },
      }),
    ];
  },

  onCreate() {
    const unsubscribe = useTiptapCommandBarStore.subscribe(() => {
      if (this.editor && !this.editor.isDestroyed) {
        this.editor.commands.updateCommandHighlight();
      }
    });

    this.storage.unsubscribe = unsubscribe;
  },

  onDestroy() {
    if (this.storage.unsubscribe) {
      this.storage.unsubscribe();
    }
  },
});
