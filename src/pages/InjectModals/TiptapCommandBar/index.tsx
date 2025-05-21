import React, { useEffect } from 'react';
import Modal from '@/components/Modal';
import { getShadowRootContainer } from '@/entrypoints/content';
import TiptapEditor from './components/TiptapEditor';
import Suggestion from './components/suggestions';
import { useTiptapCommandBarStore, SuggestionType } from './store/tiptapStore';
import Logo from '@/assets/images/logo.svg?react';

interface TiptapCommandBarProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Tiptap Command bar component, provides rich text editing functionality
 */
const TiptapCommandBar: React.FC<TiptapCommandBarProps> = ({ isOpen, onClose }) => {
  const { reset, activeSuggestion } = useTiptapCommandBarStore();

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
      contentClassName="max-w-2xl"
      container={getShadowRootContainer()}
    >
      <div
        className="relative w-full rounded-[44px] p-[1px] transition-all duration-200 overflow-hidden"
        style={{
          background: 'linear-gradient(90deg, #0D9EFF 0%, #AF00F3 100%)',
          boxShadow: '0px 2px 4px 0px rgba(255, 255, 255, 0.20)',
        }}
      >
        <div className="bg-background rounded-[44px] overflow-hidden">
          <div className="py-6 px-7 flex gap-2">
            <Logo className="w-10 h-10 text-foreground" />
            <div className="w-[calc(100%-48px)] mt-[6px]">
              <TiptapEditor className="w-full" />
            </div>
          </div>

          {shouldShowSuggestions && <Suggestion />}
        </div>
      </div>
    </Modal>
  );
};

export default TiptapCommandBar;
