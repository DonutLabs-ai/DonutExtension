import React from 'react';
import { useCommandInputStore } from '@/pages/InjectModals/CommandBar/store/commandInputStore';
import BaseInput from './BaseInput';
import { cn } from '@/utils/shadcn';

interface CommandInputProps {
  className?: string;
}

const CommandInput: React.FC<CommandInputProps> = ({ className }) => {
  const { inputStack } = useCommandInputStore();

  return (
    <div className={cn('flex gap-1', className)}>
      {inputStack.map((input, index) => (
        <BaseInput key={input.id} id={input.id} index={index} />
      ))}
    </div>
  );
};

export default CommandInput;
