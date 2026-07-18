import api from './Config';

export const assignMentor = (parentId: string) => {
  return api.post('/hierarchy/assign', { parent_id: parentId });
};

export const getMentees = () => {
  return api.get('/hierarchy/children');
};

export const getMentors = () => {
  return api.get('/hierarchy/parents');
};

export default {
  assignMentor,
  getMentees,
  getMentors,
};
