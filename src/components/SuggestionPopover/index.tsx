import React, { useMemo, useEffect } from 'react';
import { useCommandInputStore } from '@/stores/commandInputStore';
import { filterCommands, filterTokens } from '@/utils/filter';

const SuggestionPopover: React.FC = () => {
  const trigger = useCommandInputStore(state => state.trigger);
  const activeSuggestionIndex = useCommandInputStore(state => state.activeSuggestionIndex);
  const incrementActiveSuggestionIndex = useCommandInputStore(
    state => state.incrementActiveSuggestionIndex
  );
  const decrementActiveSuggestionIndex = useCommandInputStore(
    state => state.decrementActiveSuggestionIndex
  );
  const setActiveSuggestionIndex = useCommandInputStore(state => state.setActiveSuggestionIndex);
  const insertReplacement = useCommandInputStore(state => state.insertReplacement);

  const items = useMemo(() => {
    if (!trigger) return [];
    return trigger.type === '/' ? filterCommands(trigger.query) : filterTokens(trigger.query);
  }, [trigger]);

  // Format replacement text with a space
  const formatReplacement = (value: string): string => {
    return `${value} `;
  };

  // Keyboard navigation
  useEffect(() => {
    if (items.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only prevent default for navigation keys, allowing typing for filtering
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        incrementActiveSuggestionIndex(items.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        decrementActiveSuggestionIndex(items.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        const item = items[activeSuggestionIndex];
        if (item && insertReplacement) {
          insertReplacement(formatReplacement(item.value));
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (insertReplacement) insertReplacement('');
      }
      // All other keys (letters, numbers, etc.) can pass through for filtering
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [
    items,
    activeSuggestionIndex,
    incrementActiveSuggestionIndex,
    decrementActiveSuggestionIndex,
    insertReplacement,
  ]);

  // Don't display when no results
  if (!trigger || items.length === 0) return null;

  // Determine if we're showing commands or tokens
  const isCommandList = trigger.type === '/';

  return (
    <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto z-10">
      {items.map((item, idx) => {
        const isActive = idx === activeSuggestionIndex;
        // Different styles for commands vs tokens
        const baseStyle =
          'px-3 py-2 cursor-pointer flex items-center transition-colors duration-100';
        const hoverStyle = 'hover:bg-gray-50';

        // Command style has blue highlight, tokens have amber/orange
        const activeCommandStyle = 'bg-blue-50 text-blue-700 border-l-2 border-blue-500';
        const activeTokenStyle = 'bg-amber-50 text-amber-700 border-l-2 border-amber-500';

        const activeStyle = isCommandList ? activeCommandStyle : activeTokenStyle;

        return (
          <li
            key={'id' in item ? item.id : item.symbol}
            className={`${baseStyle} ${hoverStyle} ${isActive ? activeStyle : ''}`}
            onMouseEnter={() => setActiveSuggestionIndex(idx)}
            onMouseDown={e => {
              e.preventDefault();
              if (insertReplacement) insertReplacement(formatReplacement(item.value));
            }}
          >
            {isCommandList && <span className="mr-2 text-gray-500 text-lg">/</span>}
            {!isCommandList && <span className="mr-2 text-amber-500 text-lg">$</span>}
            <span className="flex-1">{'label' in item ? item.label : item.symbol}</span>
          </li>
        );
      })}
    </ul>
  );
};

export default SuggestionPopover;
