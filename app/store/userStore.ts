import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as authService from '../services/auth';
import { useTaskStore } from './taskStore';

export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  token?: string;
  phone_number?: string;
  gender?: string;
  timezone?: string;
  refreshToken?: string;
  profile_url?: string;
  role?: 'devotee' | 'admin';
};

type UserStoreState = {
  user: User | null;
  profileStats: any | null;
  scoreHistory: any[];
  hasHydrated: boolean;
  loading: boolean;
  setUser: (user: User) => void;
  updateUser: (patch: Partial<User>) => void;
  refreshProfile: () => Promise<void>;
  fetchScoreHistory: () => Promise<void>;
  clearUser: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
};

export const useUserStore = create<UserStoreState>()(
  persist(
    (set, get) => ({
      user: null,
      profileStats: null,
      scoreHistory: [],
      hasHydrated: false,
      loading: false,
      setUser: (user: User) => set({ user }),
      updateUser: (patch: Partial<User>) => {
        const currentUser = get().user;
        set({
          user: currentUser ? { ...currentUser, ...patch } : (patch as User),
        });
      },
      refreshProfile: async () => {
        set({ loading: true });
        try {
          const response = await authService.getMyProfile();
          console.log('[refreshProfile] API Response:', response.data);
          if (response.data.success) {
            const stats = response.data.data;
            set({ profileStats: stats });

            // Unified Sync: Update main user object with all details from stats
            // This replaces the old refreshProfile call.
            const currentUser = get().user;
            if (currentUser) {
              set({
                user: {
                  ...currentUser,
                  id: stats.id || currentUser.id,
                  name: stats.name || currentUser.name,
                  email: stats.email || currentUser.email,
                  phone_number: stats.phone_number || currentUser.phone_number,
                  gender: stats.gender || currentUser.gender,
                  timezone: stats.timezone || currentUser.timezone,
                  profile_url: stats.profile_url || currentUser.profile_url,
                  role: stats.role || currentUser.role,
                },
              });
            }
          }
        } catch (error: any) {
          console.error(
            'Failed to refresh profile:',
            error?.response?.data || error.message,
          );
        } finally {
          set({ loading: false });
        }
      },
      fetchScoreHistory: async () => {
        set({ loading: true });
        try {
          const response = await authService.getScoreHistory();
          if (response.data.success) {
            set({ scoreHistory: response.data.data });
          }
        } catch (error: any) {
          console.error(
            'Failed to fetch history:',
            error?.response?.data || error.message,
          );
        } finally {
          set({ loading: false });
        }
      },
      clearUser: () => {
        useTaskStore.getState().resetTasks();
        set({
          user: null,
          profileStats: null,
          scoreHistory: [],
          loading: false,
        });
      },
      setHasHydrated: (hasHydrated: boolean) => set({ hasHydrated }),
    }),
    {
      name: 'task-app-user-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({ user: state.user }),
      skipHydration: true,
      onRehydrateStorage: () => state => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
