import React, { useEffect } from 'react';
import Modal from '@/components/Modal';
import { getShadowRootContainer } from '@/entrypoints/content';
import CommandInput from '@/pages/InjectModals/CommandBar/components/CommandInput';
import Suggestions from '@/pages/InjectModals/CommandBar/components/Suggestions';
import { useCommandInputStore } from './store/commandInputStore';

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Command bar component, provides functionality for command input and suggestion display
 */
const CommandBar: React.FC<CommandBarProps> = ({ isOpen, onClose }) => {
  const { resetInput } = useCommandInputStore();

  // Reset state each time CommandBar is opened
  useEffect(() => {
    if (isOpen) {
      resetInput();
    }
  }, [isOpen, resetInput]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      contentClassName="max-w-lg"
      container={getShadowRootContainer()}
    >
      <div className="relative w-full bg-white rounded-2xl shadow-lg border border-gray-100 overflow-visible transition-all duration-200">
        <div className="py-6 px-7">
          <CommandInput />
        </div>
        <Suggestions />
      </div>
    </Modal>
  );
};

export default CommandBar;
