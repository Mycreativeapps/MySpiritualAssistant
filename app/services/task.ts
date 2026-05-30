import api from './Config';

export const getMasterTasks = () => {
  return api.get('/tasks/master');
};

export const assignTasks = (taskIds: number[]) => {
  return api.post('/tasks/assign', { taskIds });
};

export const getDailyTasks = (date?: string) => {
  return api.get('/tasks/daily', { params: { date } });
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
}) => {
  return api.post('/tasks/routines', payload);
};

export const assignTaskToMentee = (menteeId: string, taskIds: number[]) => {
  return api.post('/tasks/assign-mentee', { mentee_id: menteeId, taskIds });
};

export const createRoutineForMentee = (menteeId: string, payload: any) => {
  return api.post('/tasks/routines/mentee', {
    mentee_id: menteeId,
    ...payload,
  });
};

export default {
  getMasterTasks,
  assignTasks,
  getDailyTasks,
  updateTaskScore,
  createRoutine,
  assignTaskToMentee,
  createRoutineForMentee,
};
