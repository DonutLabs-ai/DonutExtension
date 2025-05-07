import {
  useCommandInputStore,
  CommandInputType,
} from '@/pages/InjectModals/CommandBar/store/commandInputStore';
import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/utils/shadcn';

interface BaseInputProps {
  id: string;
  index: number;
}

const BaseInput: React.FC<BaseInputProps> = ({ id, index }) => {
  const { activeInputId, inputStack, updateInput, popInput, changeActiveInputId } =
    useCommandInputStore();
  const [inputRef, setInputRef] = useState<HTMLInputElement | null>(null);

  const inputInfo = useMemo(() => {
    return inputStack.find(i => i.id === id);
  }, [inputStack, id]);

  const isActive = useMemo(() => {
    return activeInputId === id;
  }, [activeInputId, id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!inputInfo) return;
    const val = e.target.value;
    if (inputInfo.type === CommandInputType.Amount) {
      if (val !== '' && !/^\d*\.?\d{0,4}$/.test(val)) return;
      updateInput(id, { value: val });
    } else {
      updateInput(id, { value: val });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!inputInfo) return;
    if ((e.key === 'Enter' || e.code === 'Space') && !inputInfo.skipKeyEnter) {
      e.preventDefault();
      e.stopPropagation();
      if (!inputInfo.value) return;
      inputInfo.onComplete?.();
    }
    if (e.key === 'Backspace') {
      if (inputInfo.value) return;
      if (index === inputStack.length - 1) {
        e.preventDefault();
        e.stopPropagation();
        popInput();
        inputInfo.onDelete?.();
        return;
      }
      const lastInput = inputStack[inputStack.length - 1];
      if (!lastInput.value && index === inputStack.length - 2) {
        e.preventDefault();
        e.stopPropagation();
        popInput();
        lastInput.onDelete?.();
        popInput();
        inputInfo.onDelete?.();
      }
    }
  };

  useEffect(() => {
    if (inputRef && isActive) {
      inputRef.focus();
    }
  }, [inputRef, isActive]);

  if (!inputInfo) return null;

  return (
    <>
      {inputInfo.prefixComponent}
      {isActive ? (
        <input
          ref={setInputRef}
          className={cn(
            'w-[100px] outline-none text-lg transition-colors duration-150',
            'placeholder-gray-400 focus:placeholder-gray-500',
            index === inputStack.length - 1 ? 'flex-1' : 'border border-accent rounded-md',
            inputInfo.className
          )}
          autoFocus={isActive}
          placeholder={inputInfo.placeholder}
          value={inputInfo.value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <div
          className="min-w-[10px] outline-none text-lg transition-colors duration-150 placeholder-gray-400 focus:placeholder-gray-500"
          onClick={() => changeActiveInputId(id)}
        >
          {inputInfo.value}
        </div>
      )}
      {inputInfo.suffixComponent}
    </>
  );
};

export default BaseInput;
