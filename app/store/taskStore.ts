import { create } from 'zustand';
import taskService from '../services/task';
import {
  scheduleTaskNotifications,
  cancelTaskNotification,
  cancelAllTaskNotifications,
} from '../services/notificationScheduler';

export type MasterTask = {
  id: number;
  task_name: string;
  scheduled_time: string;
  notification_times?: string[];
  options?: any;
};

export type DailyTask = {
  daily_task_id: number;
  routine_id: number;
  task_name: string;
  scheduled_time: string;
  notification_times?: string[];
  score: number;
  completed_at?: string;
  options?: any;
  notifications_enabled?: boolean;
  assigned_by?: string;
};

type TaskStoreState = {
  masterTasks: MasterTask[];
  userTasks: DailyTask[];
  loading: boolean;
  hasInitiallyFetched: boolean;
  error: string | null;
  fetchMasterTasks: () => Promise<void>;
  fetchUserTasks: (date?: string) => Promise<void>;
  assignUserTasks: (tasks: { id: number; notify: boolean }[]) => Promise<boolean>;
  updateTaskScore: (taskId: number, score: number) => Promise<void>;
  createCustomTask: (payload: {
    task_name: string;
    scheduled_time: string;
    options: any;
    start_date?: string;
    end_date?: string;
    notifications_enabled?: boolean;
  }) => Promise<boolean>;
  updateCustomTask: (routineId: number, payload: any) => Promise<boolean>;
  deleteCustomTask: (routineId: number) => Promise<boolean>;
  resetTasks: () => void;
};

export const useTaskStore = create<TaskStoreState>(set => ({
  masterTasks: [],
  userTasks: [],
  loading: false,
  hasInitiallyFetched: false,
  error: null,

  resetTasks: () => {
    // Cancel all locally scheduled notifications on logout/reset
    cancelAllTaskNotifications();
    set({
      masterTasks: [],
      userTasks: [],
      loading: false,
      hasInitiallyFetched: false,
      error: null,
    });
  },

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
        const tasks = response.data.data;
        set({
          userTasks: tasks,
          loading: false,
          hasInitiallyFetched: true,
        });
        // Schedule exact-time local notifications for today's pending tasks
        // Only schedule when fetching today's tasks (no date param = today)
        if (!date) {
          scheduleTaskNotifications(tasks);
        }
      } else {
        set({
          error: response.data.message,
          loading: false,
          hasInitiallyFetched: true,
        });
      }
    } catch (err: any) {
      set({
        error: err.message,
        loading: false,
        hasInitiallyFetched: true,
      });
    }
  },

  assignUserTasks: async tasks => {
    set({ loading: true, error: null });
    try {
      const response = await taskService.assignTasks(tasks);
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
        // Cancel the local scheduled notification for this completed task
        cancelTaskNotification(taskId);
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

  updateCustomTask: async (routineId, payload) => {
    set({ loading: true, error: null });
    try {
      const response = await taskService.updateRoutine(routineId, payload);
      if (response.data.success) {
        set({ loading: false });
        await useTaskStore.getState().fetchUserTasks();
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

  deleteCustomTask: async (routineId) => {
    set({ loading: true, error: null });
    try {
      const response = await taskService.deleteRoutine(routineId);
      if (response.data.success) {
        set({ loading: false });
        await useTaskStore.getState().fetchUserTasks();
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
