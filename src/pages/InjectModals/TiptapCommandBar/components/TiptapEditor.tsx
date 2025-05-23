import React, { useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { cn } from '@/utils/shadcn';
import { useTiptapCommandBarStore, SuggestionType } from '../store/tiptapStore';
import { TokenNode } from '../extensions/TokenNode';
import { TokenReplacer } from '../extensions/TokenReplacer';
import { SpaceTransformer } from '../extensions/SpaceTransformer';
import { DisableEnter, FixTrailingNodesExtension } from '../extensions/EditorExtensions';
import { SuffixHint } from '../extensions/SuffixHint';
import { CommandHighlight } from '../extensions/CommandHighlight';
import {
  removeTrailingNodesWithEditor,
  maintainCursorPosition,
  addDOMObserver,
} from '../utils/editorUtils';
import useCommandExecution from '../hooks/useCommandExecution';
import { useCommandParser } from '../hooks/useCommandParser';
import { useTokenNodeHandler } from '../hooks/useTokenNodeHandler';
import { useSuggestionHandler } from '../hooks/useSuggestionHandler';
import { useAiSuggestion } from '../hooks/useAiSuggestion';
import '../styles/tiptap-global.css';

interface TiptapEditorProps {
  className?: string;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({ className }) => {
  const {
    setContent,
    updateMultipleStates,
    parsedCommand,
    selectedCommandId,
    reset: resetStore,
    content,
    setEditor,
    aiSuggestion,
  } = useTiptapCommandBarStore();

  const { executeCurrentCommand } = useCommandExecution();
  const { parseCommand } = useCommandParser();
  const { processTokenNodes, calculateNextParamNeedingSuggestion } = useTokenNodeHandler();
  const { determineSuggestionType } = useSuggestionHandler();
  const { applySuggestion } = useAiSuggestion();

  /**
   * Handler for command updates
   * Processes text input and updates command state
   */
  const handleCommandUpdate = useCallback(
    (editorInstance: any) => {
      const text = editorInstance.getText();

      // First update just the content to ensure it's in sync
      setContent(text);

      // Process trailing nodes
      removeTrailingNodesWithEditor(editorInstance);

      // Get current cursor position
      const { from } = editorInstance.state.selection;

      // Parse commands in text
      const parsed = parseCommand(text, from);

      // Prepare state updates object
      const stateUpdates: any = {};

      // If no command is parsed, clear all states
      if (!parsed) {
        updateMultipleStates({
          parsedCommand: null,
          selectedCommandId: null,
          activeSuggestion: SuggestionType.None,
        });
        return;
      }

      // If a command is parsed and confirmed, process token nodes
      if (parsed.commandId && parsed.commandConfirmed && parsed.command) {
        // Process TokenNodes and update parameters
        const { parsedParams, parameters, isComplete } = processTokenNodes(
          editorInstance,
          parsed.command,
          parsed.parsedParams,
          parsed.parameters
        );

        // Update parsed command with the processed parameters
        parsed.parsedParams = parsedParams;
        parsed.parameters = parameters;
        parsed.isComplete = isComplete;

        // Calculate next parameter needing suggestion
        if (parsed.parsedParams) {
          parsed.nextParamNeedingSuggestionId = calculateNextParamNeedingSuggestion(
            parsed.command,
            parsed.parsedParams,
            parsed.parameters || {}
          );
        }
      }

      // Determine suggestion type
      const suggestionType = determineSuggestionType(parsed);

      // Check if command ID has changed
      const commandIdChanged = parsed.commandId && selectedCommandId !== parsed.commandId;

      // Add all necessary updates to the state update object
      stateUpdates.parsedCommand = parsed;
      stateUpdates.activeSuggestion = suggestionType;

      if (commandIdChanged) {
        stateUpdates.selectedCommandId = parsed.commandId;
      }

      // Apply all updates in a single state update
      updateMultipleStates(stateUpdates);
    },
    [
      parseCommand,
      processTokenNodes,
      calculateNextParamNeedingSuggestion,
      determineSuggestionType,
      updateMultipleStates,
      setContent,
      selectedCommandId,
    ]
  );

  // Initialize editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable features that might cause multi-line
        hardBreak: false,
        heading: false,
        blockquote: false,
        horizontalRule: false,
        listItem: false,
        bulletList: false,
        orderedList: false,
      }),
      Placeholder.configure({
        placeholder: 'Type / to start a command...',
        emptyEditorClass: 'is-editor-empty',
      }),
      SuffixHint.configure({
        text: '',
        class: 'suffix-hint',
        enabled: true,
      }),
      DisableEnter,
      TokenNode.configure({
        HTMLAttributes: {
          class: 'custom-token-node',
        },
      }),
      TokenReplacer,
      SpaceTransformer,
      FixTrailingNodesExtension,
      CommandHighlight.configure({
        HTMLAttributes: {
          class: 'command-completed',
        },
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: cn('outline-none w-full text-lg tiptap-editor'),
      },
      // Handle key presses
      handleKeyDown: (view, event) => {
        // Handle Tab key for accepting AI suggestion
        if (event.key === 'Tab' && !event.shiftKey && aiSuggestion) {
          event.preventDefault();
          applySuggestion();
          return true;
        }

        // Show command menu when slash is typed
        if (event.key === '/') {
          updateMultipleStates({
            activeSuggestion: SuggestionType.Command,
          });
          return false; // Let Tiptap also handle the key
        }

        // Handle Enter key for command execution
        if (event.key === 'Enter' && !event.shiftKey && parsedCommand?.isComplete) {
          event.preventDefault();
          executeCurrentCommand();
          return true; // Prevent default Enter behavior
        }

        return false;
      },
    },
    // Listen for updates to detect slash commands
    onUpdate: ({ editor }) => {
      handleCommandUpdate(editor);
    },
  });

  // Monitor content changes in store and sync editor content
  useEffect(() => {
    if (!editor || !content) return;

    // Only update when content is actually different to avoid loops
    if (content === editor.getText()) return;

    // Save current selection
    const { from, to } = editor.state.selection;

    // Update content
    editor.commands.setContent(content);

    // Try to maintain cursor position, or move to end
    maintainCursorPosition(editor, content, from, to);
  }, [editor, content]);

  // Handle trailing elements after each editor update
  useEffect(() => {
    if (!editor) return;

    // Add DOM observer with cleanup
    const cleanupObserver = addDOMObserver(editor, () => {
      removeTrailingNodesWithEditor(editor);
    });

    // Return cleanup function
    return cleanupObserver;
  }, [editor]);

  // Focus editor when mounted and cleanup on unmount
  useEffect(() => {
    if (!editor) return;

    // Use a ref to track the timeout to ensure proper cleanup
    const timeoutRef = { current: null as NodeJS.Timeout | null };

    timeoutRef.current = setTimeout(() => {
      if (editor.isDestroyed) return;

      // Focus editor
      editor.commands.focus();

      // Set editor in store
      setEditor(editor);
    }, 100);

    // Cleanup on component unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      resetStore();
    };
  }, [editor, resetStore, setEditor]);

  return (
    <div className={cn('relative w-full', className)}>
      <div className="relative">
        <EditorContent
          editor={editor}
          className="w-full text-lg bg-transparent focus:outline-none"
        />
      </div>
    </div>
  );
};

export default TiptapEditor;
