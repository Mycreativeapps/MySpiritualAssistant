import api from './Config';

export const getSetting = (key: string) => {
  return api.get(`/settings/${key}`);
};

export const updateSetting = (key: string, value: any) => {
  return api.put(`/settings/${key}`, { value });
};

export default {
  getSetting,
  updateSetting,
};
