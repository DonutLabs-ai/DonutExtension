import {
  useCommandInputStore,
  CommandInputType,
  CommandInput,
} from '@/pages/InjectModals/CommandBar/store/commandInputStore';
import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/utils/shadcn';

const CommandSelect = () => {
  const { inputStack, updateInput, pushInput } = useCommandInputStore();
  const [activeIndex, setActiveIndex] = useState(0);

  const commandInputId = inputStack[0].id;
  const commandInputValue = inputStack[0].value;

  const commandsList = useMemo(
    () => [
      {
        id: 'swap',
        label: 'Swap',
        value: 'Swap',
        action: () => {
          updateInput(commandInputId, {
            value: '/Swap',
          });
          const toTokenConfig: CommandInput = {
            id: 'swap_to_token',
            type: CommandInputType.Token,
            value: '',
            skipKeyEnter: true,
            placeholder: 'Enter swap to token',
            prefixComponent: <span className="text-lg">to</span>,
            onComplete: () => {
              pushInput('swap_to_token', {
                id: 'normal_input',
                type: CommandInputType.Normal,
                value: '',
              });
            },
          };
          const fromTokenConfig: CommandInput = {
            id: 'swap_from_token',
            type: CommandInputType.Token,
            value: '',
            skipKeyEnter: true,
            placeholder: 'Enter swap from token',
            onComplete: () => {
              pushInput('swap_from_token', toTokenConfig);
            },
          };
          const amountConfig: CommandInput = {
            id: 'swap_amount',
            type: CommandInputType.Amount,
            value: '',
            placeholder: 'Enter swap amount',
            onComplete: () => {
              pushInput('swap_amount', fromTokenConfig);
            },
          };
          pushInput(commandInputId, amountConfig);
        },
      },
      {
        id: 'send',
        label: 'Send',
        value: 'Send',
        action: () => {
          updateInput(commandInputId, {
            value: '/Send',
          });
        },
      },
    ],
    [commandInputId, pushInput, updateInput]
  );

  const filteredCommands = useMemo(() => {
    if (!commandInputValue.startsWith('/')) return [];
    const filterKey = commandInputValue.slice(1);
    return commandsList.filter(command => {
      return command.label.toLowerCase().includes(filterKey.toLowerCase());
    });
  }, [commandInputValue, commandsList]);

  useEffect(() => {
    if (filteredCommands.length === 0) return;
    setActiveIndex(0);
  }, [filteredCommands]);

  // Keyboard navigation
  useEffect(() => {
    if (filteredCommands.length === 0) return;
    if (activeIndex > filteredCommands.length - 1) {
      setActiveIndex(0);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        if (activeIndex < filteredCommands.length - 1) {
          setActiveIndex(activeIndex + 1);
        } else {
          setActiveIndex(0);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        if (activeIndex > 0) {
          setActiveIndex(activeIndex - 1);
        } else {
          setActiveIndex(filteredCommands.length - 1);
        }
      } else if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        e.stopPropagation();
        filteredCommands[activeIndex].action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCommands, activeIndex]);

  useEffect(() => {
    return () => {
      setActiveIndex(0);
    };
  }, []);

  if (filteredCommands.length === 0) return null;

  return (
    <div className="w-full px-5 py-3 space-y-1 border-t border-muted-foreground">
      {filteredCommands.map((command, index) => (
        <div
          key={command.id}
          className={cn(
            'w-full px-3 py-2.5 rounded-lg font-medium cursor-pointer transition-all duration-150',
            'flex items-center',
            index === activeIndex ? 'bg-[#BBB1D938]' : 'bg-white'
          )}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => command.action()}
        >
          <span className="mr-2 text-sm px-1.5 py-0.5 bg-gray-200 rounded text-gray-700">/</span>
          {command.label}
        </div>
      ))}
    </div>
  );
};

export default CommandSelect;
