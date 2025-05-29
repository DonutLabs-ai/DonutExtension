import React, { useEffect } from 'react';
import Modal from '@/components/Modal';
import DynamicBorder from '@/components/DynamicBorder';
import { getShadowRootContainer } from '@/entrypoints/content';
import TiptapEditor from './components/TiptapEditor';
import Suggestion from './components/suggestions';
import { useTiptapCommandBarStore, SuggestionType } from './store/tiptapStore';
import Logo from '@/assets/images/logo.svg?react';
import './styles/command-bar.css';

interface TiptapCommandBarProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Tiptap Command bar component, provides rich text editing functionality
 */
const TiptapCommandBar: React.FC<TiptapCommandBarProps> = ({ isOpen, onClose }) => {
  const { reset, activeSuggestion, isExecuting } = useTiptapCommandBarStore();

  // Reset state each time TiptapCommandBar is opened
  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  // Determine whether to show the suggestion component
  const shouldShowSuggestions = activeSuggestion !== SuggestionType.None;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      contentClassName="max-w-3xl"
      container={getShadowRootContainer()}
    >
      <DynamicBorder borderWidth={isExecuting ? 2 : 1} animated={isExecuting}>
        <div className="py-6 px-[30px] flex gap-2">
          <Logo className="w-8 h-8 text-foreground" />
          <div className="w-[calc(100%-48px)] mt-[2px]">
            <TiptapEditor className="w-full" />
          </div>
        </div>

        {shouldShowSuggestions && <Suggestion />}
      </DynamicBorder>
    </Modal>
  );
};

export default TiptapCommandBar;
