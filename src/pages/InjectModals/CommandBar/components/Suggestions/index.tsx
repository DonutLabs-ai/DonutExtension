import React from 'react';
import { useCommandInputStore, SuggestionType } from '../../store/commandInputStore';
import { useCommandExecution } from '../../hooks/useCommandExecution';
import CommandSuggestion from './CommandSuggestion';
import TokenSuggestion from './TokenSuggestion';
import AddressSuggestion from './AddressSuggestion';
import CommandPreview from './CommandPreview';
import { ScrollArea } from '@/components/shadcn/scroll-area';

const Suggestions: React.FC = () => {
  const { parsedCommand, activeSuggestion } = useCommandInputStore();
  const { executeCurrentCommand, isExecuting } = useCommandExecution();

  // Do not display suggestions in the following cases:
  // 1. When there is no activeSuggestion or it is None
  // 2. Input doesn't start with '/', and not in Command suggestion phase
  // 3. Only allow missing command object during command input phase (Command)

  if (!activeSuggestion || activeSuggestion === SuggestionType.None) {
    return null;
  }

  if (!parsedCommand?.startsWithSlash && activeSuggestion !== SuggestionType.Command) {
    return null;
  }

  if (
    !parsedCommand?.command &&
    activeSuggestion !== SuggestionType.Command &&
    activeSuggestion !== SuggestionType.Preview
  ) {
    return null;
  }

  return (
    <ScrollArea className="w-full max-h-60 flex flex-col border-t border-muted-foreground">
      {activeSuggestion === SuggestionType.Command && <CommandSuggestion />}
      {activeSuggestion === SuggestionType.Token && <TokenSuggestion />}
      {activeSuggestion === SuggestionType.Address && <AddressSuggestion />}
      {activeSuggestion === SuggestionType.Preview && parsedCommand && (
        <CommandPreview
          parsedCommand={parsedCommand}
          executeCommand={executeCurrentCommand}
          isExecuting={isExecuting}
        />
      )}
    </ScrollArea>
  );
};

export default Suggestions;
