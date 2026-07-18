import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type AppStoreState = {
  netStatus: boolean;
  hasHydrated: boolean;
  isMentorMenteeEnabled: boolean;
  featurePermissions: Record<string, string[]>;
  setNetStatus: (netStatus: boolean) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  fetchAppConfig: () => Promise<void>;
};

export const useAppStore = create<AppStoreState>()(
  persist(
    set => ({
      netStatus: false,
      hasHydrated: false,
      isMentorMenteeEnabled: false,
      featurePermissions: {},
      setNetStatus: (netStatus: boolean) => set({ netStatus }),
      setHasHydrated: (hasHydrated: boolean) => set({ hasHydrated }),
      fetchAppConfig: async () => {
        try {
          const settingsService = require('../services/settings').default;
          const res = await settingsService.getSetting('mentor_mentee_enabled');
          if (res.data?.success) {
            const val = res.data.data;
            const isEnabled = typeof val === 'string' ? val === 'true' : !!val;
            set({ isMentorMenteeEnabled: isEnabled });
          }
          const permRes = await settingsService.getSetting('feature_permissions');
          if (permRes.data?.success) {
            set({ featurePermissions: permRes.data.data || {} });
          }
        } catch (e) {
          console.log('Error fetching app config', e);
        }
      },
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
