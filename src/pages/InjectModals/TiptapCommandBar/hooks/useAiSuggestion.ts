import { useCallback, useEffect, useRef, useState } from 'react';
import { useTiptapCommandBarStore } from '../store/tiptapStore';
import { getAICompletionService } from '@/services/aiCompletionService';
import { getDocVisualContent } from '../utils/editorUtils';

function safeStringStartsWith(str: string, prefix: string): boolean {
  const normalizeStr = (s: string) => s.replace(/\s+/g, ' ');

  const normalizedStr = normalizeStr(str);
  const normalizedPrefix = normalizeStr(prefix);

  return normalizedStr.startsWith(normalizedPrefix);
}

export const useAiSuggestion = () => {
  const { content, parsedCommand, aiSuggestion, setAiSuggestion, editor } =
    useTiptapCommandBarStore();

  const [visualContent, setVisualContent] = useState('');

  useEffect(() => {
    if (!editor?.state) return;

    try {
      const fullContent = getDocVisualContent(editor.state.doc);
      setVisualContent(fullContent);
    } catch (error) {
      setVisualContent('');
    }
  }, [editor, content]);

  // Create a ref to store the timeout ID for debouncing
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if command is ready for AI suggestions
  const isCommandRecognized = useCallback(() => {
    if (!parsedCommand?.startsWithSlash) return false;
    if (!parsedCommand.commandId || !parsedCommand.command) return false;
    return parsedCommand.commandConfirmed === true;
  }, [parsedCommand]);

  // Check if the input matches the current suggestion
  const inputMatchesSuggestion = useCallback((input: string, suggestion: string) => {
    if (!suggestion) return false;
    return safeStringStartsWith(suggestion.toLowerCase(), input.toLowerCase());
  }, []);

  // Process suggestion for display
  const processSuggestion = useCallback(() => {
    // Basic checks
    if (!isCommandRecognized() || !aiSuggestion || !visualContent) {
      return null;
    }

    // Extract suggestion text
    const inputLower = visualContent.toLowerCase();
    const suggestionLower = aiSuggestion.toLowerCase();

    const doesStartWith = safeStringStartsWith(suggestionLower, inputLower);
    const isEqual = suggestionLower.trim() === inputLower.trim();

    // Check if the suggestion should be displayed
    if (!doesStartWith || isEqual) return null;

    const suggestionPart = aiSuggestion.slice(visualContent.length);
    if (!suggestionPart) return null;

    return {
      alreadyTyped: visualContent,
      suggestionPart,
      full: aiSuggestion,
    };
  }, [isCommandRecognized, aiSuggestion, visualContent]);

  // Apply suggestion to the editor content
  const applySuggestion = useCallback(() => {
    const suggestion = processSuggestion();
    if (!suggestion || !editor) {
      return;
    }

    // Insert the full suggestion
    editor.commands.setContent(suggestion.full);
    editor.commands.insertContent('\u00A0');

    // Move cursor to the end
    editor.commands.focus('end');
  }, [processSuggestion, editor]);

  // Fetch AI suggestion when content changes with debouncing
  useEffect(() => {
    const commandId = parsedCommand?.commandId;
    if (!visualContent || !commandId || !isCommandRecognized()) {
      setAiSuggestion('');
      return;
    }

    // If the input fully matches the current suggestion, no need to request again
    if (inputMatchesSuggestion(visualContent, aiSuggestion)) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      getAICompletionService()
        .getSuggestion(visualContent, commandId)
        .then(result => setAiSuggestion(result))
        .catch(error => setAiSuggestion(''));
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    visualContent,
    parsedCommand?.commandId,
    aiSuggestion,
    inputMatchesSuggestion,
    isCommandRecognized,
    setAiSuggestion,
  ]);

  return {
    aiSuggestion,
    processSuggestion,
    applySuggestion,
    visualContent,
  };
};
