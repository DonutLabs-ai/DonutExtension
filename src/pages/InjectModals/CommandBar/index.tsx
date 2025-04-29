import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { getShadowRootContainer } from '@/entrypoints/content';

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CommandBar: React.FC<CommandBarProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [commands] = useState([
    { id: 'search', label: 'Search', action: () => window.open('https://google.com', '_blank') },
    { id: 'help', label: 'Help', action: () => alert('Help documentation') },
    { id: 'settings', label: 'Settings', action: () => alert('Settings opened') },
  ]);

  const filteredCommands = commands.filter(command =>
    command.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (command: { id: string; label: string; action: () => void }) => {
    command.action();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      contentClassName="max-w-lg"
      container={getShadowRootContainer()}
    >
      <div className="flex flex-col mt-4">
        <input
          type="text"
          className="w-full p-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="Type a command..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
        <div className="space-y-2">
          {filteredCommands.map(command => (
            <div
              key={command.id}
              className="p-2 hover:bg-gray-100 rounded cursor-pointer"
              onClick={() => handleSelect(command)}
            >
              {command.label}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default CommandBar;
