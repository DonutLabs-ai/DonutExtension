import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/utils/shadcn';
import { useCommandInputStore, SuggestionType } from '../../store/commandInputStore';
import { COMMANDS } from '../../store/commandDefinitions';
import { replaceTextRange } from '../../utils/commandParser';

const CommandSuggestion = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { inputValue, setInputValue, setLastSelectionCursorPos, setActiveSuggestion } =
    useCommandInputStore();

  // Filter commands - enhanced filtering logic
  const filteredCommands = useMemo(() => {
    // If input is empty, show all commands
    if (!inputValue) {
      return COMMANDS;
    }

    // If input is just '/', show all commands
    if (inputValue === '/') {
      return COMMANDS;
    }

    // If input doesn't start with '/', don't show any commands
    if (!inputValue.startsWith('/')) {
      return [];
    }

    // Get filter query text, ignore '/' prefix, and only take the first word (before space)
    const queryParts = inputValue.slice(1).split(' ');
    const query = queryParts[0].toLowerCase();

    // If query is empty, return all commands
    if (!query) {
      return COMMANDS;
    }

    // First try exact match at beginning
    const startsWithMatches = COMMANDS.filter(cmd => cmd.name.toLowerCase().startsWith(query));

    // If there are commands starting with the query, prioritize these
    if (startsWithMatches.length > 0) {
      return startsWithMatches;
    }

    // Otherwise, return commands that include the query
    const includesMatches = COMMANDS.filter(
      cmd =>
        cmd.name.toLowerCase().includes(query) || cmd.description?.toLowerCase().includes(query)
    );

    return includesMatches;
  }, [inputValue]);

  // Handle command selection
  const handleCommandSelect = (commandId: string) => {
    const command = COMMANDS.find(cmd => cmd.id === commandId);
    if (!command) return;

    // Replace command part
    const commandText = `/${command.name}`;
    let newValue = inputValue;

    if (inputValue.startsWith('/')) {
      // Find first space or end of text
      const endOfCommand =
        inputValue.indexOf(' ') > 0 ? inputValue.indexOf(' ') : inputValue.length;
      newValue = replaceTextRange(inputValue, 0, endOfCommand, commandText);
    } else {
      newValue = commandText;
    }

    // Add space to start entering parameters
    newValue = newValue + ' ';
    setInputValue(newValue);

    // Set cursor position after command
    const newCursorPos = newValue.length;
    setLastSelectionCursorPos(newCursorPos);

    // Hide command suggestions, prepare to show parameter suggestions
    setActiveSuggestion(SuggestionType.None);
  };

  // Keyboard navigation logic
  useEffect(() => {
    if (filteredCommands.length === 0) return;

    // Ensure active index is within valid range
    if (activeIndex >= filteredCommands.length) {
      setActiveIndex(0);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard events when command suggestions are visible
      if (!document.activeElement) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
      } else if (e.key === 'Enter' || e.code === 'Space') {
        if (e.code === 'Space' && e.target instanceof HTMLInputElement) {
          // Only prevent space event under specific conditions
          const firstWord = e.target.value.split(' ')[0];
          if (firstWord.startsWith('/') && !firstWord.includes(' ')) {
            e.preventDefault();
            handleCommandSelect(filteredCommands[activeIndex].id);
          }
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleCommandSelect(filteredCommands[activeIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredCommands, activeIndex]);

  // Reset state when component unmounts
  useEffect(() => {
    return () => {
      setActiveIndex(0);
    };
  }, []);

  if (filteredCommands.length === 0) return null;

  return (
    <div className="w-full px-5 py-3 space-y-1">
      {filteredCommands.map((command, index) => (
        <div
          key={command.id}
          className={cn(
            'w-full px-3 py-2.5 rounded-lg font-medium cursor-pointer transition-all duration-150',
            'flex items-center',
            index === activeIndex ? 'bg-accent' : 'bg-background'
          )}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => handleCommandSelect(command.id)}
        >
          <span className="mr-2 text-sm px-1.5 py-0.5 bg-secondary rounded text-foreground">/</span>
          {command.name}
          {command.description && (
            <span className="ml-2 text-sm text-muted-foreground">{command.description}</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default CommandSuggestion;
