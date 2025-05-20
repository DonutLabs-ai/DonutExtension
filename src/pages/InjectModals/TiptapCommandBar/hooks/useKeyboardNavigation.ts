import { useState, useCallback, useEffect, useRef } from 'react';

interface KeyboardNavigationOptions<T> {
  /**
   * 导航的项目列表
   */
  items: T[];

  /**
   * 选择当前项的回调函数
   */
  onSelect: (item: T) => void;

  /**
   * 是否启用键盘导航 (默认: true)
   */
  isEnabled?: boolean;

  /**
   * 处理的按键列表 (默认: ['ArrowUp', 'ArrowDown', 'Enter'])
   */
  keys?: string[];

  /**
   * 初始索引 (默认: 0)
   */
  initialIndex?: number;

  /**
   * 当项目列表变化时是否重置索引 (默认: false)
   */
  resetOnItemsChange?: boolean;
}

interface KeyboardNavigationResult<T> {
  /**
   * 当前活动项的索引
   */
  activeIndex: number;

  /**
   * 设置活动索引的函数
   */
  setActiveIndex: (index: number) => void;

  /**
   * 键盘事件处理函数，可选用于手动处理键盘事件
   */
  handleKeyDown: (e: KeyboardEvent) => void;

  /**
   * 当前活动项
   */
  activeItem: T | undefined;
}

/**
 * 自定义钩子用于处理列表的键盘导航
 * 支持上下方向键导航和回车键选择，内部管理活动索引状态
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

  // 在项目列表长度变化时检查边界并根据设置重置索引
  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    // 检查数组长度是否变化
    if (prevItemsLengthRef.current !== items.length) {
      // 长度变化时根据策略设置索引
      if (resetOnItemsChange) {
        setActiveIndex(0);
      } else if (activeIndex >= items.length) {
        // 仅当当前索引超出新数组范围时才重置
        setActiveIndex(Math.max(0, items.length - 1));
      }

      // 更新长度引用
      prevItemsLengthRef.current = items.length;
    }
  }, [items.length, activeIndex, resetOnItemsChange]);

  // 处理键盘事件
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

  // 添加和移除事件监听器
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
