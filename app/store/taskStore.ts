import { create } from 'zustand';
import taskService from '../services/task';

export type MasterTask = {
  id: number;
  task_name: string;
  scheduled_time: string;
  options?: any;
};

export type DailyTask = {
  daily_task_id: number;
  task_name: string;
  scheduled_time: string;
  score: number;
  completed_at?: string;
  options?: any;
};

type TaskStoreState = {
  masterTasks: MasterTask[];
  userTasks: DailyTask[];
  loading: boolean;
  hasInitiallyFetched: boolean;
  error: string | null;
  fetchMasterTasks: () => Promise<void>;
  fetchUserTasks: (date?: string) => Promise<void>;
  assignUserTasks: (taskIds: number[]) => Promise<boolean>;
  updateTaskScore: (taskId: number, score: number) => Promise<void>;
  createCustomTask: (payload: {
    task_name: string;
    scheduled_time: string;
    options: any;
    start_date?: string;
    end_date?: string;
  }) => Promise<boolean>;
  resetTasks: () => void;
};

export const useTaskStore = create<TaskStoreState>(set => ({
  masterTasks: [],
  userTasks: [],
  loading: false,
  hasInitiallyFetched: false,
  error: null,

  resetTasks: () =>
    set({
      masterTasks: [],
      userTasks: [],
      loading: false,
      hasInitiallyFetched: false,
      error: null,
    }),

  fetchMasterTasks: async () => {
    set({ loading: true, error: null });
    try {
      const response = await taskService.getMasterTasks();
      if (response.data.success) {
        set({ masterTasks: response.data.data, loading: false });
      } else {
        set({ error: response.data.message, loading: false });
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchUserTasks: async date => {
    set({ loading: true, error: null });
    try {
      const response = await taskService.getDailyTasks(date);
      if (response.data.success) {
        set({
          userTasks: response.data.data,
          loading: false,
          hasInitiallyFetched: true,
        });
      } else {
        set({
          error: response.data.message,
          loading: false,
          hasInitiallyFetched: true, // Set to true even on error to stop re-fetching loop
        });
      }
    } catch (err: any) {
      set({
        error: err.message,
        loading: false,
        hasInitiallyFetched: true, // Set to true even on error to stop re-fetching loop
      });
    }
  },

  assignUserTasks: async taskIds => {
    set({ loading: true, error: null });
    try {
      const response = await taskService.assignTasks(taskIds);
      if (response.data.success) {
        set({ loading: false });
        return true;
      } else {
        set({ error: response.data.message, loading: false });
        return false;
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  updateTaskScore: async (taskId, score) => {
    set({ error: null });
    try {
      const response = await taskService.updateTaskScore(taskId, score);
      if (response.data.success) {
        // Update local state
        set(state => ({
          userTasks: state.userTasks.map(t =>
            t.daily_task_id === taskId
              ? { ...t, score, completed_at: new Date().toISOString() }
              : t,
          ),
        }));
      } else {
        set({ error: response.data.message });
      }
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  createCustomTask: async payload => {
    set({ loading: true, error: null });
    try {
      const response = await taskService.createRoutine(payload);
      if (response.data.success) {
        set({ loading: false });
        // After successfully creating a custom task it should be fetched again to appear on the UI.
        const currentStore = useTaskStore.getState();
        await currentStore.fetchUserTasks();
        return true;
      } else {
        set({ error: response.data.message, loading: false });
        return false;
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },
}));
