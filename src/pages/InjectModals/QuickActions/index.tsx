import React from 'react';
import Modal from '@/components/Modal';

interface QuickActionsProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ isOpen, onClose }) => {
  const actions = [
    {
      id: 'copy',
      label: 'Copy URL',
      icon: '📋',
      action: () => {
        navigator.clipboard.writeText(window.location.href);
        alert('URL copied to clipboard!');
        onClose();
      },
    },
    {
      id: 'bookmark',
      label: 'Bookmark',
      icon: '🔖',
      action: () => {
        alert('Page bookmarked!');
        onClose();
      },
    },
    {
      id: 'share',
      label: 'Share',
      icon: '📤',
      action: () => {
        alert('Share dialog opened!');
        onClose();
      },
    },
    {
      id: 'translate',
      label: 'Translate',
      icon: '🌐',
      action: () => {
        alert('Translation started!');
        onClose();
      },
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} contentClassName="max-w-xs">
      <div className="flex flex-col">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          {actions.map(action => (
            <button
              key={action.id}
              className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              onClick={action.action}
            >
              <span className="text-2xl mb-2">{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default QuickActions;
