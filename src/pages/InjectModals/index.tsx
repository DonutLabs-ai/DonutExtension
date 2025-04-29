import React, { useEffect, useState } from 'react';
import hotkeys from 'hotkeys-js';
import CommandBar from './CommandBar';
import QuickActions from './QuickActions';

// Define the popup component and its corresponding shortcut keys
const MODAL_CONFIG = [
  { id: 'commandBar', shortcut: 'ctrl+k', Component: CommandBar },
  { id: 'quickActions', shortcut: 'ctrl+q', Component: QuickActions },
];

const InjectModals = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Close all pop-ups
  const closeAllModals = () => {
    setActiveModal(null);
  };

  // Toggle the popup display status
  const toggleModal = (modalId: string) => {
    setActiveModal(activeModal === modalId ? null : modalId);
  };

  useEffect(() => {
    // Register shortcut key
    MODAL_CONFIG.forEach(({ id, shortcut }) => {
      hotkeys(shortcut, event => {
        event.preventDefault();
        toggleModal(id);
        return false;
      });
    });

    // Global ESC key closes all pop-ups
    hotkeys('esc', () => {
      if (activeModal) {
        closeAllModals();
        return false;
      }
      return true;
    });

    // Component unloading cleanup
    return () => {
      // Unbind all shortcut keys
      MODAL_CONFIG.forEach(({ shortcut }) => {
        hotkeys.unbind(shortcut);
      });
      hotkeys.unbind('esc');
    };
  }, [activeModal]);

  return (
    <div>
      {MODAL_CONFIG.map(({ id, Component }) => (
        <Component key={id} isOpen={activeModal === id} onClose={closeAllModals} />
      ))}
    </div>
  );
};

export default InjectModals;
