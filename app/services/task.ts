import api from './Config';

export const getMasterTasks = () => {
  return api.get('/tasks/master');
};

export const assignTasks = (tasks: { id: number; notify: boolean }[]) => {
  return api.post('/tasks/assign', { tasks });
};

export const getDailyTasks = (date?: string) => {
  return api.get('/tasks/daily', { params: { date } });
};

export const getWeeklyTasks = (start_date?: string) => {
  return api.get('/tasks/weekly', { params: { start_date } });
};

export const updateTaskScore = (taskId: number, score: number) => {
  return api.put(`/tasks/${taskId}/score`, { score });
};

export const createRoutine = (payload: {
  task_name: string;
  scheduled_time: string;
  options: any;
  start_date?: string;
  end_date?: string;
  notifications_enabled?: boolean;
}) => {
  return api.post('/tasks/routines', payload);
};

export const assignTaskToMentee = (menteeId: string, tasks: { id: number; notify: boolean }[]) => {
  return api.post('/tasks/assign-mentee', { mentee_id: menteeId, tasks });
};

export const createRoutineForMentee = (menteeId: string, payload: any) => {
  return api.post('/tasks/routines/mentee', {
    mentee_id: menteeId,
    ...payload,
  });
};

export const updateRoutine = (routineId: number, payload: any) => {
  return api.put(`/tasks/routines/${routineId}`, payload);
};

export const deleteRoutine = (routineId: number) => {
  return api.delete(`/tasks/routines/${routineId}`);
};

export const getMenteeRoutines = (menteeId: string) => {
  return api.get(`/tasks/routines/mentee/${menteeId}`);
};

export default {
  getMasterTasks,
  assignTasks,
  getDailyTasks,
  getWeeklyTasks,
  updateTaskScore,
  createRoutine,
  assignTaskToMentee,
  createRoutineForMentee,
  updateRoutine,
  deleteRoutine,
  getMenteeRoutines,
};
