import { useState, useCallback, useEffect, useRef } from 'react';

interface KeyboardNavigationOptions<T> {
  /**
   * List of items for navigation
   */
  items: T[];

  /**
   * Callback function for selecting the current item
   */
  onSelect: (item: T) => void;

  /**
   * Whether keyboard navigation is enabled (default: true)
   */
  isEnabled?: boolean;

  /**
   * List of keys to handle (default: ['ArrowUp', 'ArrowDown', 'Enter'])
   */
  keys?: string[];

  /**
   * Initial index (default: 0)
   */
  initialIndex?: number;

  /**
   * Whether to reset the index when the item list changes (default: false)
   */
  resetOnItemsChange?: boolean;
}

interface KeyboardNavigationResult<T> {
  /**
   * Index of the currently active item
   */
  activeIndex: number;

  /**
   * Function to set the active index
   */
  setActiveIndex: (index: number) => void;

  /**
   * Keyboard event handler function, optionally used for manually handling keyboard events
   */
  handleKeyDown: (e: KeyboardEvent) => void;

  /**
   * Currently active item
   */
  activeItem: T | undefined;
}

/**
 * Custom hook for handling keyboard navigation in lists
 * Supports navigation with up/down arrow keys and selection with Enter key, internally manages active index state
 */
export function useKeyboardNavigation<T>({
  items,
  onSelect,
  isEnabled = true,
  keys = ['ArrowUp', 'ArrowDown', 'Enter'],
  initialIndex = 0,
  resetOnItemsChange = false,
}: KeyboardNavigationOptions<T>): KeyboardNavigationResult<T> {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const prevItemsLengthRef = useRef(items.length);

  // Check boundaries and reset index based on settings when item list length changes
  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    // Check if array length has changed
    if (prevItemsLengthRef.current !== items.length) {
      // Set index according to strategy when length changes
      if (resetOnItemsChange) {
        setActiveIndex(0);
      } else if (activeIndex >= items.length) {
        // Only reset when current index is beyond the new array range
        setActiveIndex(Math.max(0, items.length - 1));
      }

      // Update length reference
      prevItemsLengthRef.current = items.length;
    }
  }, [items.length, activeIndex, resetOnItemsChange]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isEnabled || items.length === 0 || !keys.includes(e.key)) {
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
          break;

        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
          break;

        case 'Enter':
          e.preventDefault();
          if (items[activeIndex]) {
            onSelect(items[activeIndex]);
          }
          break;
      }
    },
    [items, activeIndex, onSelect, isEnabled, keys]
  );

  // Add and remove event listeners
  useEffect(() => {
    if (isEnabled) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, isEnabled]);

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown,
    activeItem: items.length > 0 ? items[activeIndex] : undefined,
  };
}

export default useKeyboardNavigation;
