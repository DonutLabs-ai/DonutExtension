import React from 'react';
import Modal from '@/components/Modal';
import { getShadowRootContainer } from '@/entrypoints/content';
import CommandInput from '@/components/CommandInput';
import SuggestionPopover from '@/components/SuggestionPopover';

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
    <div className="relative w-full mt-4">
      <CommandInput className="w-full border border-gray-300 rounded-md" />
      <SuggestionPopover />
    </div>
  </Modal>
);

export default CommandBar;
