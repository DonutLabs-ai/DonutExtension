import { useCallback, useEffect, useRef } from 'react';
import { useCommandInputStore, SuggestionType } from '../store/commandInputStore';
import { parseCommand } from '../utils/commandParser';
import { useSuggestionType } from './useSuggestionType';

/**
 * Custom hook for handling command input, parsing, and suggestion display
 */
export const useCommandInput = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    inputValue,
    cursorPosition,
    setInputValue,
    setCursorPosition,
    setParsedCommand,
    setActiveSuggestion,
    lastSelectionCursorPos,
    setLastSelectionCursorPos,
    parsedCommand,
  } = useCommandInputStore();

  // Use centralized hook to determine the current suggestion type
  const currentSuggestionType = useSuggestionType(parsedCommand);

  // Command parsing logic
  const updateParsedCommand = useCallback(
    (value: string, position: number) => {
      // If input is empty, reset all states
      if (!value.trim()) {
        setParsedCommand({
          commandId: null,
          command: null,
          params: {},
          cursorParamId: null,
          isComplete: false,
          startsWithSlash: false,
        });
        setActiveSuggestion(SuggestionType.None);
        return;
      }

      // Parse command
      const parsedCmd = parseCommand(value, position);
      setParsedCommand(parsedCmd);

      // Special case: only handle specially when just typed /
      if (value === '/') {
        setActiveSuggestion(SuggestionType.Command);
      }
    },
    [setParsedCommand, setActiveSuggestion]
  );

  // Automatically update active suggestion type
  useEffect(() => {
    setActiveSuggestion(currentSuggestionType);
  }, [currentSuggestionType, setActiveSuggestion]);

  // Handle cursor position fix after selection and display of next suggestion
  useEffect(() => {
    if (lastSelectionCursorPos !== null && inputRef.current) {
      // Set cursor position
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(lastSelectionCursorPos, lastSelectionCursorPos);
          inputRef.current.focus();

          // Re-parse command to determine current state
          updateParsedCommand(inputValue, lastSelectionCursorPos);

          // Clear saved cursor position
          setLastSelectionCursorPos(null);
        }
      }, 0);
    }
  }, [lastSelectionCursorPos, inputValue, setLastSelectionCursorPos, updateParsedCommand]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const newPosition = e.target.selectionStart || 0;

    // Detect if just typed "/"
    const justTypedSlash =
      newValue.length > inputValue.length &&
      newValue[newPosition - 1] === '/' &&
      (newPosition === 1 || newValue[newPosition - 2] === ' ');

    setInputValue(newValue);
    setCursorPosition(newPosition);

    // If just typed /, immediately show command suggestions
    if (justTypedSlash) {
      setActiveSuggestion(SuggestionType.Command);
    }

    // Handle command parsing
    updateParsedCommand(newValue, newPosition);
  };

  // Handle selection change, update cursor position
  const handleSelectionChange = () => {
    if (inputRef.current) {
      const newPosition = inputRef.current.selectionStart || 0;
      setCursorPosition(newPosition);

      // If position changed, update parsing result
      if (newPosition !== cursorPosition) {
        updateParsedCommand(inputValue, newPosition);
      }
    }
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Clear input when Escape key is pressed
    if (e.key === 'Escape' && inputValue) {
      e.preventDefault();
      setInputValue('');
      setCursorPosition(0);
      setParsedCommand({
        commandId: null,
        command: null,
        params: {},
        cursorParamId: null,
        isComplete: false,
        startsWithSlash: false,
      });
      setActiveSuggestion(SuggestionType.None);
    }
  };

  return {
    inputRef,
    inputValue,
    parsedCommand,
    handleInputChange,
    handleSelectionChange,
    handleKeyDown,
  };
};
