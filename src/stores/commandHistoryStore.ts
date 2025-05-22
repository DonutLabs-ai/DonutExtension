import { create } from 'zustand';
import {
  initPegasusZustandStoreBackend,
  pegasusZustandStoreReady,
} from '@webext-pegasus/store-zustand';
import { nanoid } from 'nanoid';

export interface CommandHistory {
  id: string; // unique ID for the command
  timestamp: number; // epoch ms
  command: string;
}

interface CommandHistoryStoreState {
  history: Record<string, CommandHistory[]>;
  addRecord: (command: string, commandId: string) => void;
  getHistory: (commandId: string) => CommandHistory[];
  clear: () => void;
}

// Create base zustand store
export const useCommandHistoryStore = create<CommandHistoryStoreState>((set, get) => ({
  history: {},
  addRecord: (command, commandId) =>
    set(state => ({
      history: {
        ...state.history,
        [commandId]: [
          {
            id: nanoid(),
            timestamp: Date.now(),
            command,
            commandId,
          },
          ...(state.history?.[commandId] || []),
        ].slice(0, 50), // keep only the 50 most recent records
      },
    })),
  getHistory: (commandId: string) => get().history?.[commandId] || [],
  clear: () => set({ history: {} }),
}));

// Store name for cross-environment sharing
export const COMMAND_HISTORY_STORE_NAME = 'donut-command-history-store';

// Initialize store backend in background
export const initCommandHistoryStoreBackend = () =>
  initPegasusZustandStoreBackend(COMMAND_HISTORY_STORE_NAME, useCommandHistoryStore, {
    storageStrategy: 'local',
  });

// Wait for store to be ready in other environments
export const commandHistoryStoreReady = () =>
  pegasusZustandStoreReady(COMMAND_HISTORY_STORE_NAME, useCommandHistoryStore);
