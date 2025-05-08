import React, { useState, useMemo, useEffect } from 'react';
import { cn } from '@/utils/shadcn';
import { useCommandInputStore } from '../../store/commandInputStore';
import { getWordAtPosition } from '../../utils/commandParser';
import { handleSuggestionSelect } from '../../utils/handleSuggestionSelect';

// Mock saved address list
interface SavedAddress {
  name: string;
  address: string;
}

const savedAddresses: SavedAddress[] = [
  {
    name: 'Personal Wallet',
    address: 'GZthsRKHMyZJ9At3SsJkGrKhRvpRJ3EXXVuBTUzC8DF7',
  },
  {
    name: 'Exchange Deposit',
    address: '7NsngNMtXvcK1LcV5GxTq9UBJgXGjPTcwbz8GnkDgSyJ',
  },
  {
    name: 'Multisig Wallet',
    address: 'DRXKnQ5U8PY7kzWHPN7MqkFP8aQ7qPPJ6h6hNDm56n2',
  },
];

const AddressSuggestion: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const {
    inputValue,
    cursorPosition,
    setInputValue,
    setCursorPosition,
    setActiveSuggestion,
    setParsedCommand,
    parsedCommand,
  } = useCommandInputStore();

  // Get word at cursor position
  const currentWord = useMemo(() => {
    return getWordAtPosition(inputValue, cursorPosition);
  }, [inputValue, cursorPosition]);

  // Filter addresses
  const filteredAddresses = useMemo(() => {
    if (!currentWord.word) return savedAddresses;

    const query = currentWord.word.toLowerCase();
    return savedAddresses.filter(
      addr => addr.name.toLowerCase().includes(query) || addr.address.toLowerCase().includes(query)
    );
  }, [currentWord]);

  // Handle address selection - using the generic handler function
  const handleAddressSelect = (address: string) => {
    handleSuggestionSelect({
      inputValue,
      cursorPosition,
      selectedValue: address,
      parsedCommand,
      setInputValue,
      setCursorPosition,
      setActiveSuggestion,
      setParsedCommand,
    });
  };

  // Keyboard navigation logic
  useEffect(() => {
    if (filteredAddresses.length === 0) return;

    // Ensure active index is within valid range
    if (activeIndex >= filteredAddresses.length) {
      setActiveIndex(0);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev < filteredAddresses.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : filteredAddresses.length - 1));
      } else if (e.key === 'Enter') {
        // Select currently active address with Enter key
        e.preventDefault();
        handleAddressSelect(filteredAddresses[activeIndex].address);
      } else if (e.code === 'Space' && document.activeElement?.tagName === 'INPUT') {
        // Only select address with Space key when current word is not empty
        if (currentWord.word.trim() !== '') {
          e.preventDefault();
          handleAddressSelect(filteredAddresses[activeIndex].address);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredAddresses, activeIndex, currentWord]);

  // Reset state when component unmounts
  useEffect(() => {
    return () => {
      setActiveIndex(0);
    };
  }, []);

  if (filteredAddresses.length === 0) {
    return (
      <div className="w-full px-5 py-3">
        <div className="text-muted-foreground text-sm">No matching saved addresses found</div>
      </div>
    );
  }

  return (
    <div className="w-full px-5 py-3 space-y-1">
      <div className="text-sm font-medium text-muted-foreground mb-2">Saved Addresses</div>
      {filteredAddresses.map((addr, index) => (
        <div
          key={addr.address}
          className={cn(
            'w-full px-3 py-2.5 rounded-lg font-medium cursor-pointer transition-all duration-150 border border-accent',
            activeIndex === index ? 'bg-accent' : 'bg-background'
          )}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => handleAddressSelect(addr.address)}
        >
          <div className="flex flex-col">
            <span className="font-medium">{addr.name}</span>
            <span className="text-sm text-muted-foreground truncate">{addr.address}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AddressSuggestion;
