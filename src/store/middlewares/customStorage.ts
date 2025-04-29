import { StateStorage } from 'zustand/middleware';

// Custom storage object
export const customStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await browser.storage.local.get(name);
    return value?.[name] || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (!value) return;
    await browser.storage.local.set({ [name]: value });
  },
  removeItem: async (name: string): Promise<void> => {
    await browser.storage.local.remove(name);
  },
};
