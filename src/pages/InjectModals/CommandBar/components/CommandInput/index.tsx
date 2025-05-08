import React from 'react';
import { cn } from '@/utils/shadcn';
import { useCommandExecution } from '../../hooks/useCommandExecution';
import { useCommandInput } from '../../hooks/useCommandInput';
import InputField from './InputField';
import ResultMessage from './ResultMessage';

interface CommandInputProps {
  className?: string;
}

const CommandInput: React.FC<CommandInputProps> = ({ className }) => {
  const { parsedCommand } = useCommandInput();
  const { executeCurrentCommand, resultMessage, isExecuting } = useCommandExecution();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Execute command when Enter key is pressed without Shift key
    if (e.key === 'Enter' && !e.shiftKey && parsedCommand?.isComplete) {
      e.preventDefault();
      executeCurrentCommand();
    }
  };

  return (
    <div className={cn('w-full relative', className)} onKeyDown={handleKeyDown}>
      <InputField />
      <ResultMessage message={resultMessage} isExecuting={isExecuting} />
    </div>
  );
};

export default CommandInput;
