/**
 * Global shortcut protection utility
 * Provides multi-layer protection mechanism to prevent page hijacking of shortcuts
 */

export interface ShortcutConfig {
  key: string;
  callback: (event: KeyboardEvent) => void;
  description?: string;
}

export interface GlobalShortcutOptions {
  shortcuts: ShortcutConfig[];
  debug?: boolean;
}

export class GlobalShortcutManager {
  private shortcuts = new Map<string, ShortcutConfig>();
  private listeners: {
    element: EventTarget;
    type: string;
    listener: EventListener;
    options?: boolean | AddEventListenerOptions;
  }[] = [];
  private debug = false;

  constructor(options: GlobalShortcutOptions) {
    this.debug = options.debug || false;

    // Register shortcuts
    options.shortcuts.forEach(shortcut => {
      this.shortcuts.set(shortcut.key.toLowerCase(), shortcut);
    });

    this.setupProtection();
  }

  private setupProtection() {
    // Setup high-priority native event listeners
    this.setupNativeListeners();
  }

  private setupNativeListeners() {
    const handleKeyDown = (event: KeyboardEvent) => {
      const keyCombo = this.getKeyCombo(event);
      const shortcut = this.shortcuts.get(keyCombo);

      if (shortcut) {
        // Prevent event propagation and default behavior
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();

        // Execute callback
        try {
          shortcut.callback(event);
        } catch (error) {
          if (this.debug) {
            console.error('Shortcut callback execution failed:', error);
          }
        }

        return false;
      }
    };

    // Add event listeners at multiple levels to ensure interception
    const targets = [window, document, document.documentElement, document.body];
    const eventTypes = ['keydown', 'keypress'];

    targets.forEach(target => {
      if (!target) return;

      eventTypes.forEach(eventType => {
        // Capture phase - highest priority
        const captureListener = (event: Event) => {
          if (event instanceof KeyboardEvent) {
            return handleKeyDown(event);
          }
        };

        target.addEventListener(eventType, captureListener, {
          capture: true,
          passive: false,
        });

        this.listeners.push({
          element: target,
          type: eventType,
          listener: captureListener,
          options: { capture: true, passive: false },
        });

        // Bubble phase - backup protection
        const bubbleListener = (event: Event) => {
          if (event instanceof KeyboardEvent) {
            return handleKeyDown(event);
          }
        };

        target.addEventListener(eventType, bubbleListener, {
          capture: false,
          passive: false,
        });

        this.listeners.push({
          element: target,
          type: eventType,
          listener: bubbleListener,
          options: { capture: false, passive: false },
        });
      });
    });
  }

  private getKeyCombo(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.ctrlKey || event.metaKey) {
      parts.push(event.ctrlKey ? 'ctrl' : 'cmd');
    }
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');

    const key = event.key.toLowerCase();
    if (key !== 'control' && key !== 'alt' && key !== 'shift' && key !== 'meta') {
      parts.push(key);
    }

    return parts.join('+');
  }

  public addShortcut(config: ShortcutConfig) {
    this.shortcuts.set(config.key.toLowerCase(), config);
  }

  public removeShortcut(key: string) {
    this.shortcuts.delete(key.toLowerCase());
  }

  public destroy() {
    // Clean up all event listeners
    this.listeners.forEach(({ element, type, listener, options }) => {
      element.removeEventListener(type, listener, options);
    });

    this.listeners.length = 0;
    this.shortcuts.clear();
  }

  public getRegisteredShortcuts(): string[] {
    return Array.from(this.shortcuts.keys());
  }
}

/**
 * Convenience function to create global shortcut manager
 */
export function createGlobalShortcuts(options: GlobalShortcutOptions): GlobalShortcutManager {
  return new GlobalShortcutManager(options);
}
