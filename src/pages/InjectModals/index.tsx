import { useState, useEffect, useRef } from 'react';
import CommandBar from './TiptapCommandBar';
import { ToastProvider } from '@/components/ToastProvider';
import { createGlobalShortcuts, GlobalShortcutManager } from '@/utils/globalShortcuts';

const InjectModals = () => {
  const [open, setOpen] = useState(false);
  const globalShortcutsRef = useRef<GlobalShortcutManager | null>(null);

  useEffect(() => {
    // Create global shortcut protection manager
    const globalShortcuts = createGlobalShortcuts({
      shortcuts: [
        {
          key: 'ctrl+k',
          callback: e => {
            e.preventDefault();
            setOpen(o => !o);
          },
          description: 'Toggle command bar with Ctrl+K',
        },
        {
          key: 'cmd+k',
          callback: e => {
            e.preventDefault();
            setOpen(o => !o);
          },
          description: 'Toggle command bar with Cmd+K',
        },
        {
          key: 'escape',
          callback: e => {
            setOpen(false);
          },
          description: 'Close command bar with Escape',
        },
      ],
      debug: false,
    });

    globalShortcutsRef.current = globalShortcuts;

    return () => {
      // Clean up global shortcut manager
      if (globalShortcutsRef.current) {
        globalShortcutsRef.current.destroy();
        globalShortcutsRef.current = null;
      }
    };
  }, []);

  return (
    <ToastProvider>
      <CommandBar isOpen={open} onClose={() => setOpen(false)} />
    </ToastProvider>
  );
};

export default InjectModals;
