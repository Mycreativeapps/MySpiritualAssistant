import api from './Config';

export const createMasterTask = (taskData: any) => {
  return api.post('/admin/tasks/master', taskData);
};

export const updateMasterTask = (id: number, taskData: any) => {
  return api.put(`/admin/tasks/master/${id}`, taskData);
};

export const deactivateMasterTask = (id: number) => {
  return api.delete(`/admin/tasks/master/${id}`);
};

export const updateUserRole = (userId: string, role: 'devotee' | 'admin') => {
  return api.patch(`/admin/users/${userId}/role`, { role });
};

/**
 * Fetch all users for role management
 */
export const getAllUsers = () => {
  // Note: We might need to ensure this endpoint exists on the server
  return api.get('/admin/users');
};

export const getSystemStats = () => {
  return api.get('/admin/stats');
};

export default {
  createMasterTask,
  updateMasterTask,
  deactivateMasterTask,
  updateUserRole,
  getAllUsers,
  getSystemStats,
};
