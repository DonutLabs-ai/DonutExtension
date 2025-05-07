import React, { useEffect, useRef } from 'react';
import { useCommandInputStore } from '@/stores/commandInputStore';
import { TriggerContext, TriggerType } from '@/stores/commandInputStore';

interface CommandInputProps {
  className?: string;
}

// Moved parseTrigger function into component file
function parseTrigger(text: string, cursorIndex: number): TriggerContext | null {
  if (cursorIndex === 0) return null;
  // Case 1: '/' trigger at index 0
  if (text.startsWith('/')) {
    const query = text.slice(1, cursorIndex);
    return { type: '/' as TriggerType, start: 0, query };
  }
  // Case 2: '$' trigger anywhere before cursor
  const slice = text.slice(0, cursorIndex);
  const dollarIndex = slice.lastIndexOf('$');
  if (dollarIndex !== -1) {
    const query = slice.slice(dollarIndex + 1);
    return { type: '$', start: dollarIndex, query };
  }
  return null;
}

const CommandInput: React.FC<CommandInputProps> = ({ className }) => {
  const { setText, setCursorIndex, setTrigger, setInsertReplacement } = useCommandInputStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Register replace function once to avoid recreation loops
  useEffect(() => {
    setInsertReplacement(replacement => {
      const state = useCommandInputStore.getState();
      const currentTrigger = state.trigger;
      const currentCursor = state.cursorIndex;

      if (!textareaRef.current || !currentTrigger) return;

      const textarea = textareaRef.current;
      const start = currentTrigger.start;
      const end = currentCursor;
      const text = textarea.value;
      const newText = text.slice(0, start) + replacement + text.slice(end);

      textarea.value = newText;
      textarea.selectionStart = textarea.selectionEnd = start + replacement.length;

      state.setText(newText);
      state.setCursorIndex(start + replacement.length);
      state.setTrigger(null);

      // Force focus back to textarea after replacement
      textarea.focus();
    });
  }, []);

  // Initialize with focus on textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const updateState = () => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;

    // Update store state
    setCursorIndex(cursorPos);
    setText(textarea.value);

    // Parse trigger
    const t = parseTrigger(textarea.value, cursorPos);
    setTrigger(t);
  };

  // Unified event handler
  const handleEvent = () => updateState();

  // Special key handling
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter key should not create a new line in the single-line command input
    if (e.key === 'Enter') {
      e.preventDefault();
    }

    // Skip updating for arrow navigation to prevent reset of selection
    const isArrowNavigation = e.key === 'ArrowUp' || e.key === 'ArrowDown';
    if (!isArrowNavigation) {
      requestAnimationFrame(updateState);
    }
  };

  return (
    <textarea
      ref={textareaRef}
      className={`w-full resize-none outline-none font-mono overflow-hidden whitespace-nowrap ${className}`}
      placeholder="Type / for commands or $ for tokens..."
      rows={1}
      onInput={handleEvent}
      onKeyDown={handleKeyDown}
      onSelect={handleEvent}
      onClick={handleEvent}
      onFocus={handleEvent}
      spellCheck={false}
      autoFocus
      style={{
        height: '40px',
        maxHeight: '40px',
        lineHeight: '24px',
        padding: '8px 12px',
      }}
    />
  );
};

export default CommandInput;
