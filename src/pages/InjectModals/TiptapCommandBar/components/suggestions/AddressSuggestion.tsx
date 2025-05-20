import { useCallback, useMemo } from 'react';
import { cn } from '@/utils/shadcn';
import { useTiptapCommandBarStore } from '../../store/tiptapStore';
import { CommandParam, ParamType, CommandOption } from '../../utils/commandData';
import {
  findFirstUnfilledParamNeedingSuggestion,
  handleSuggestionSelect,
} from '../../utils/suggestionUtils';
import useKeyboardNavigation from '../../hooks/useKeyboardNavigation';

// Define address data interface
interface AddressItem {
  address: string;
  name: string;
}

// Example address list (in actual application should be retrieved from storage or API)
const recentAddresses: AddressItem[] = [
  {
    name: 'Personal Wallet',
    address: 'GZthsRKHMyZJ9At3SsJkGrKhRvpRJ3EXXVuBTUzC8DF7',
  },
  {
    name: 'Exchange Deposit',
    address: 'DRXKnQ5U8PY7kzWHPN7MqkFP8aQ7qPPJ6h6hNDm56n2',
  },
];

interface CommandInfo {
  valid: boolean;
  nextParam?: CommandParam;
  currentParamValue?: string;
  command?: CommandOption;
  parameters?: Record<string, string>;
}

const AddressSuggestion = () => {
  const { parsedCommand, setContent, editor } = useTiptapCommandBarStore();

  // Use useMemo to process command parameters, maintain consistency and reduce repeated calculations
  const commandInfo = useMemo<CommandInfo>(() => {
    if (!parsedCommand?.command) {
      return { valid: false };
    }

    // Find address type parameters
    const addressParams = parsedCommand.command.params.filter(
      param => param.type === ParamType.Address && param.required
    );

    if (addressParams.length === 0) {
      return { valid: false };
    }

    // Find the parameter currently being edited
    const currentParams = parsedCommand.parameters ?? {};
    const currentParamId = parsedCommand.cursorParamId;

    // If there is a specified cursor parameter and it is an address type, use it
    let nextParam: CommandParam | undefined;

    if (currentParamId && addressParams.some(p => p.id === currentParamId)) {
      nextParam = addressParams.find(p => p.id === currentParamId);
    } else {
      // Try to find an address parameter that needs suggestion
      const unfilledParam = findFirstUnfilledParamNeedingSuggestion(
        parsedCommand.command,
        currentParams
      );

      // Check if the unfilled parameter is an address type
      if (unfilledParam && unfilledParam.type === ParamType.Address) {
        nextParam = unfilledParam;
      } else {
        // Otherwise find the first unfilled address parameter
        nextParam = addressParams.find(
          param => !currentParams[param.id] || currentParams[param.id].trim() === ''
        );
      }
    }

    // If there is no address parameter that needs input
    if (!nextParam) {
      return { valid: false };
    }

    // Get and clean current parameter value
    let currentParamValue = currentParams[nextParam.id] || '';
    currentParamValue = currentParamValue.trim();

    return {
      valid: true,
      nextParam,
      currentParamValue,
      command: parsedCommand.command,
      parameters: currentParams,
    };
  }, [parsedCommand]);

  // Function to handle address selection
  const handleAddressSelect = useCallback(
    (item: AddressItem) => {
      if (!commandInfo.valid || !commandInfo.command || !commandInfo.nextParam || !editor) return;

      // Get updated content
      const { updatedContent } = handleSuggestionSelect(
        commandInfo.command,
        commandInfo.parameters || {},
        commandInfo.nextParam.id,
        item.address
      );

      // Directly use editor commands to update content
      editor.commands.setContent(updatedContent);

      // Use insertContent to add space (as a separate operation)
      editor.commands.insertContent(' ');

      // Move cursor to end of document
      editor.commands.focus('end');

      // Update content state in store (to maintain synchronization)
      setContent(editor.getText());
    },
    [commandInfo, setContent, editor]
  );

  // Use custom hook to handle keyboard navigation
  const { activeIndex, setActiveIndex } = useKeyboardNavigation({
    items: recentAddresses,
    onSelect: handleAddressSelect,
    isEnabled: commandInfo.valid && recentAddresses.length > 0,
  });

  // If command info is invalid, return null
  if (!commandInfo.valid || !commandInfo.nextParam || !commandInfo.command) {
    return null;
  }

  // If no addresses available
  if (recentAddresses.length === 0) {
    return (
      <div className="w-full p-5">
        <div className="text-foreground text-sm">No matching saved addresses found</div>
      </div>
    );
  }

  return (
    <div className="w-full p-5 space-y-1">
      <div className="text-sm font-medium text-foreground mb-2">Saved Addresses</div>
      {recentAddresses.map((addr, index) => (
        <div
          key={addr.address}
          className={cn(
            'w-full px-3 py-2.5 rounded-lg font-medium cursor-pointer transition-all duration-150 border border-accent',
            activeIndex === index ? 'bg-accent' : 'bg-background'
          )}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => handleAddressSelect(addr)}
        >
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{addr.name}</span>
            <span className="text-sm text-muted-foreground truncate">{addr.address}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AddressSuggestion;
