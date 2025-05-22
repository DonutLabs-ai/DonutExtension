import { useMemo, useCallback } from 'react';
import { cn } from '@/utils/shadcn';
import { useTiptapCommandBarStore, SuggestionType } from '../../store/tiptapStore';
import { commands, ParamType, CommandOption, CommandParam } from '../../utils/commandData';
import {
  findFirstParamNeedingSuggestion,
  getSuggestionTypeForParam,
} from '../../utils/suggestionUtils';
import { Editor } from '@tiptap/core';
import useKeyboardNavigation from '../../hooks/useKeyboardNavigation';

const CommandSuggestion = () => {
  const {
    content,
    activeSuggestion,
    setActiveSuggestion,
    setSelectedCommand,
    setParsedCommand,
    editor,
  } = useTiptapCommandBarStore();

  // Use useMemo to optimize command filtering calculation, only recalculate when content changes
  const filteredCommands = useMemo(() => {
    // If input is empty or just '/', show all commands
    if (!content || content === '/') {
      return commands;
    }

    // If input doesn't start with '/', don't show any commands
    if (!content.startsWith('/')) {
      return [];
    }

    // Get filter query text, ignore '/' prefix, only take first word (before space)
    const queryParts = content.slice(1).split(' ');
    const query = queryParts[0].toLowerCase();

    // If query is empty, return all commands
    if (!query) {
      return commands;
    }

    // First try to match commands that start with the query
    const startsWithMatches = commands.filter(cmd => cmd.title.toLowerCase().startsWith(query));

    // If there are commands that start with the query, return these commands first
    if (startsWithMatches.length > 0) {
      return startsWithMatches;
    }

    // Otherwise, return commands that contain the query (in title or description)
    return commands.filter(
      cmd =>
        cmd.title.toLowerCase().includes(query) || cmd.description?.toLowerCase().includes(query)
    );
  }, [content]);

  // Insert command into editor
  const insertCommandInEditor = useCallback(
    (command: CommandOption, editor: Editor | null): boolean => {
      if (!editor) {
        return false;
      }

      try {
        // Find command text in current input
        const text = editor.getText();
        let slashPos = -1;

        // Find position of last slash, which is usually the command being entered
        if (text.includes('/')) {
          slashPos = text.lastIndexOf('/');
        }

        // If slash is found, replace everything from slash to current cursor position
        if (slashPos >= 0) {
          // Get current selection position
          const { from, to } = editor.state.selection;

          // Create transaction, delete all content from slash to current position
          editor.commands.setTextSelection({
            from: slashPos,
            to: to,
          });

          // Delete selection and insert new command
          editor.commands.deleteSelection();
          editor.commands.insertContent(`/${command.title} `);
        } else {
          // If no slash found (exceptional case), insert command at current position
          editor.commands.insertContent(`/${command.title} `);
        }

        // Ensure cursor is after the space following the command
        const newText = editor.getText();
        const cmdText = `/${command.title} `;
        const cmdPos = newText.indexOf(cmdText);
        if (cmdPos >= 0) {
          editor.commands.setTextSelection(cmdPos + cmdText.length);
        }

        return true;
      } catch (error) {
        return false;
      }
    },
    []
  );

  // Create parsed command object
  const createParsedCommand = useCallback((command: CommandOption) => {
    // Create a new parameter object (all parameters initially empty)
    const emptyParams: Record<string, string> = {};
    command.params.forEach((param: CommandParam) => {
      emptyParams[param.id] = '';
    });

    return {
      startsWithSlash: true,
      commandId: command.id,
      command: command,
      isComplete: command.params.length === 0, // Only consider complete if there are no parameters
      parameters: emptyParams,
      parsedParams: {}, // Add empty parsedParams object
      commandConfirmed: true, // Force set command as confirmed (since selected from menu)
      cursorParamId: command.params.length > 0 ? command.params[0].id : null, // Add cursor parameter ID
    };
  }, []);

  // Determine next suggestion type
  const determineNextSuggestionType = useCallback((command: CommandOption): SuggestionType => {
    if (command.params.length === 0) {
      // Commands without parameters don't need suggestions
      return SuggestionType.None;
    }

    // If first parameter is Token type, immediately show Token suggestion
    if (command.params[0].type === ParamType.Token) {
      return SuggestionType.Token;
    }

    // For commands with parameters, find the first parameter needing suggestion
    const firstSuggestionParam = findFirstParamNeedingSuggestion(command);

    if (firstSuggestionParam) {
      // Get suggestion type needed for this parameter
      const suggestionType = getSuggestionTypeForParam(firstSuggestionParam.type);

      // If this parameter needs suggestion box, return corresponding suggestion type
      if (suggestionType !== null) {
        return suggestionType;
      }
    }

    // Default to not showing suggestions
    return SuggestionType.None;
  }, []);

  // Main command selection handler
  const handleCommandSelect = useCallback(
    (command: CommandOption) => {
      try {
        setSelectedCommand(command.id);

        // Insert command into editor
        const inserted = insertCommandInEditor(command, editor);
        if (!inserted) {
          return;
        }

        // Create parsed command object
        const newParsedCommand = createParsedCommand(command);

        // Update parsed command
        setParsedCommand(newParsedCommand);

        // Determine and set next suggestion type
        const nextSuggestionType = determineNextSuggestionType(command);
        setActiveSuggestion(nextSuggestionType);
      } catch (error) {
        // Error handling can be added here if needed
      }
    },
    [
      editor,
      setSelectedCommand,
      setParsedCommand,
      setActiveSuggestion,
      insertCommandInEditor,
      createParsedCommand,
      determineNextSuggestionType,
    ]
  );

  const { activeIndex, setActiveIndex } = useKeyboardNavigation({
    items: filteredCommands,
    onSelect: handleCommandSelect,
    isEnabled: activeSuggestion === SuggestionType.Command && filteredCommands.length > 0,
  });

  if (filteredCommands.length === 0) return null;

  return (
    <div className="w-full">
      {filteredCommands.map((command, index) => (
        <div
          key={command.id}
          className={cn(
            'w-full h-[54px] px-[30px] rounded-lg cursor-pointer transition-all duration-150',
            'flex items-center gap-2',
            index === activeIndex && 'bg-accent'
          )}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => handleCommandSelect(command)}
        >
          <img src={command.icon} alt={command.title} className="size-5" />
          <div className="flex-1 text-base">
            <span className="text-primary">{command.title}</span>
            {command.description && (
              <span className="text-muted-foreground"> - {command.description}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommandSuggestion;
