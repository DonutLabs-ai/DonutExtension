import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { customStorage } from './middlewares/customStorage';

interface UserState {
  walletAddress: string;
  setWalletAddress: (addr: string) => void;
}

const DEFAULT_ADDRESS = 'AasQTQH9oroodW5vi3uEoDuLyJDVfMz7GWehvisdGmDX';

export const useUserStore = create(
  persist<UserState>(
    set => ({
      walletAddress: DEFAULT_ADDRESS,
      setWalletAddress: addr => set({ walletAddress: addr }),
    }),
    {
      name: 'donut-user-store',
      storage: createJSONStorage(() => customStorage),
    }
  )
);
