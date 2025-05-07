import { CommandInputType, useCommandInputStore } from '../../store/commandInputStore';
import CommandSelect from './CommandSelect';
import TokenSelect from './TokenSelect';
import { useMemo } from 'react';

const SuggestionPopover = () => {
  const { activeInputId, inputStack } = useCommandInputStore();

  const activeInput = useMemo(
    () => inputStack.find(input => input.id === activeInputId),
    [inputStack, activeInputId]
  );

  const renderSuggestion = useMemo(() => {
    if (!activeInput) return null;
    if (activeInput.type === CommandInputType.Command) {
      return <CommandSelect />;
    }
    if (activeInput.type === CommandInputType.Token) {
      return <TokenSelect />;
    }
    return null;
  }, [activeInput]);

  return (
    <div className="w-full transition-all duration-200 max-h-60 overflow-y-auto">
      {renderSuggestion}
    </div>
  );
};

export default SuggestionPopover;
