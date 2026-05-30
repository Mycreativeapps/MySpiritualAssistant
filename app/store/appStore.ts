import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type AppStoreState = {
  netStatus: boolean;
  hasHydrated: boolean;
  setNetStatus: (netStatus: boolean) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
};

export const useAppStore = create<AppStoreState>()(
  persist(
    set => ({
      netStatus: false,
      hasHydrated: false,
      setNetStatus: (netStatus: boolean) => set({ netStatus }),
      setHasHydrated: (hasHydrated: boolean) => set({ hasHydrated }),
    }),
    {
      name: 'task-app-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({ netStatus: state.netStatus }),
      skipHydration: true,
      onRehydrateStorage: () => state => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
