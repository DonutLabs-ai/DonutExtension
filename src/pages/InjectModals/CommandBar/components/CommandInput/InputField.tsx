import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { cn } from '@/utils/shadcn';
import { useCommandInput } from '../../hooks/useCommandInput';
import { getAICompletionService } from '@/services/aiCompletionService';
import { useCommandInputStore } from '../../store/commandInputStore';

interface InputFieldProps {
  className?: string;
}

const InputField: React.FC<InputFieldProps> = ({ className }) => {
  const {
    inputRef,
    inputValue,
    handleInputChange,
    handleSelectionChange,
    handleKeyDown,
    parsedCommand,
  } = useCommandInput();
  const { setInputValue, setLastSelectionCursorPos } = useCommandInputStore();

  // Local state for AI suggestion
  const [aiSuggestion, setAiSuggestion] = useState('');

  // Create a ref to store the timeout ID for debouncing
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if command is ready for AI suggestions
  const isCommandRecognized = useCallback(() => {
    if (!parsedCommand?.startsWithSlash) return false;
    if (!parsedCommand.commandId || !parsedCommand.command) return false;
    return true;
  }, [parsedCommand]);

  // Check if the input matches the current suggestion
  const inputMatchesSuggestion = useCallback((input: string, suggestion: string) => {
    if (!suggestion) return false;
    return suggestion.toLowerCase().startsWith(input.toLowerCase());
  }, []);

  // Fetch AI suggestion when input changes with debouncing
  useEffect(() => {
    const commandId = parsedCommand?.commandId;
    // If the input is empty or the command is not recognized, reset the state
    if (!inputValue || !commandId || !isCommandRecognized()) {
      setAiSuggestion('');
      return;
    }

    // If the input fully matches the current suggestion, no need to request again
    if (inputMatchesSuggestion(inputValue, aiSuggestion)) {
      return;
    }

    // Clear the previous timeout to implement debouncing
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set a new timeout
    timeoutRef.current = setTimeout(() => {
      getAICompletionService()
        .getSuggestion(inputValue, commandId)
        .then(result => setAiSuggestion(result))
        .catch(error => {
          console.error('Error getting AI suggestion:', error);
          setAiSuggestion('');
        });
    }, 300); // 300ms debounce delay
  }, [
    inputValue,
    parsedCommand?.commandId,
    aiSuggestion,
    inputMatchesSuggestion,
    isCommandRecognized,
  ]);

  // Process suggestion display
  const processSuggestion = useMemo(() => {
    // Basic checks
    if (!isCommandRecognized() || !aiSuggestion) return null;

    // Extract suggestion text
    const inputLower = inputValue.toLowerCase();
    const suggestionLower = aiSuggestion.toLowerCase();

    // Check if the suggestion should be displayed
    if (!suggestionLower.startsWith(inputLower) || suggestionLower === inputLower) return null;

    // Prepare display content
    const alreadyTyped = inputValue;
    const suggestionPart = aiSuggestion.slice(alreadyTyped.length);

    // If there is no actual suggestion part, do not display
    if (!suggestionPart) return null;

    return { alreadyTyped, suggestionPart, full: aiSuggestion };
  }, [isCommandRecognized, aiSuggestion, inputValue]);

  // Handle Tab key accepting suggestion
  const handleKeyDownWithSuggestion = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && !e.shiftKey && processSuggestion) {
      e.preventDefault();
      setAiSuggestion('');

      setInputValue(processSuggestion.full);
      setLastSelectionCursorPos(processSuggestion.full.length);
      return;
    }

    // Pass other keys to the original processor
    handleKeyDown(e);
  };

  return (
    <div className={cn('relative w-full', className)}>
      <input
        ref={inputRef}
        type="text"
        placeholder="Type / to start a command..."
        value={inputValue}
        onChange={handleInputChange}
        onSelect={handleSelectionChange}
        onKeyDown={handleKeyDownWithSuggestion}
        autoFocus
        className={cn('w-full text-lg bg-transparent focus:outline-none', className)}
      />

      {processSuggestion && (
        <div className="absolute inset-0 pointer-events-none text-lg w-full overflow-hidden">
          <span className="opacity-0 whitespace-pre">{processSuggestion.alreadyTyped}</span>
          <span className="text-muted-foreground/70 whitespace-pre">
            {processSuggestion.suggestionPart}
          </span>
        </div>
      )}
    </div>
  );
};

export default InputField;
