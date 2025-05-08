import React from 'react';
import { cn } from '@/utils/shadcn';
import { useCommandInput } from '../../hooks/useCommandInput';

interface InputFieldProps {
  className?: string;
}

const InputField: React.FC<InputFieldProps> = ({ className }) => {
  const { inputRef, inputValue, handleInputChange, handleSelectionChange, handleKeyDown } =
    useCommandInput();

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Type / to start a command..."
      value={inputValue}
      onChange={handleInputChange}
      onSelect={handleSelectionChange}
      onKeyDown={handleKeyDown}
      autoFocus
      className={cn('w-full text-lg bg-transparent focus:outline-none', className)}
    />
  );
};

export default InputField;
