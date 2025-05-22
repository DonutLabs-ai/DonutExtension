import React from 'react';
import { useTiptapCommandBarStore, SuggestionType } from '../../store/tiptapStore';
import CommandSuggestion from './CommandSuggestion';
import TokenSuggestion from './TokenSuggestion';
import AddressSuggestion from './AddressSuggestion';
import CommandPreview from './CommandPreview/index';
import { ScrollArea } from '@/components/shadcn/scroll-area';

const Suggestion: React.FC = () => {
  const { activeSuggestion } = useTiptapCommandBarStore();

  if (!activeSuggestion || activeSuggestion === SuggestionType.None) {
    return null;
  }

  return (
    <ScrollArea className="w-full max-h-72 flex flex-col border-t border-border">
      {activeSuggestion === SuggestionType.Command && <CommandSuggestion />}
      {activeSuggestion === SuggestionType.Token && <TokenSuggestion />}
      {activeSuggestion === SuggestionType.Address && <AddressSuggestion />}
      {activeSuggestion === SuggestionType.Preview && <CommandPreview />}
    </ScrollArea>
  );
};

export default Suggestion;
