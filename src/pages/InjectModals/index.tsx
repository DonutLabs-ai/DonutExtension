import { useState, useEffect } from 'react';
import hotkeys from 'hotkeys-js';
import CommandBar from './TiptapCommandBar';
import { ToastProvider } from '@/components/ToastProvider';

const InjectModals = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    hotkeys('ctrl+k,cmd+k', e => {
      e.preventDefault();
      setOpen(o => !o);
    });
    hotkeys('esc', () => {
      setOpen(false);
    });
    return () => {
      hotkeys.unbind('ctrl+k,cmd+k');
      hotkeys.unbind('esc');
    };
  }, []);

  return (
    <ToastProvider>
      <CommandBar isOpen={open} onClose={() => setOpen(false)} />
    </ToastProvider>
  );
};

export default InjectModals;
