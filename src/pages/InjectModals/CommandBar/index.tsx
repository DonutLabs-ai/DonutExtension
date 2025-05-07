import React from 'react';
import Modal from '@/components/Modal';
import { getShadowRootContainer } from '@/entrypoints/content';
import CommandInput from '@/pages/InjectModals/CommandBar/components/CommandInput';
import SuggestionPopover from '@/pages/InjectModals/CommandBar/components/SuggestionPopover';

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CommandBar: React.FC<CommandBarProps> = ({ isOpen, onClose }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    contentClassName="max-w-lg"
    container={getShadowRootContainer()}
  >
    <div className="relative w-full bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-200">
      <CommandInput className="w-full py-6 px-7" />
      <SuggestionPopover />
    </div>
  </Modal>
);

export default CommandBar;
