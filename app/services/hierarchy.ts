import api from './Config';

export const assignMentor = (parentId: string) => {
  return api.post('/hierarchy/assign', { parent_id: parentId });
};

export const getMentees = () => {
  return api.get('/hierarchy/children');
};

export default {
  assignMentor,
  getMentees,
};
