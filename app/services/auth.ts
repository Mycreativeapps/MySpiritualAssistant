import api from './Config';

export const login = (
  email: string,
  password: string,
  fcm_token?: string,
  force?: boolean,
) => {
  return api.post('/auth/login', {
    email,
    password,
    fcm_token,
    force,
  });
};

export const logout = (refresh_token?: string) => {
  return api.post('/auth/logout', { refresh_token });
};

export const register = (userData: any) => {
  return api.post('/auth/register', userData);
};

export const sendOTP = (email: string) => {
  return api.post('/auth/send-otp', { email });
};

export const verifyOTP = (email: string, otp: string) => {
  return api.post('/auth/verify-otp', { email, otp });
};

export const getMyProfile = () => {
  return api.get('/users/my-profile');
};

export const getScoreHistory = () => {
  return api.get('/users/scores/history');
};

export const getUserStatsById = (userId: string) => {
  return api.get(`/users/${userId}/stats`);
};

export const getUserScoreHistoryById = (userId: string) => {
  return api.get(`/users/${userId}/history`);
};

export const syncTimezone = (timezone: string) => {
  return api.post('/users/sync-timezone', { timezone });
};

export const forgotPassword = (email: string) => {
  return api.post('/auth/forgot-password', { email });
};

export const resetPassword = (data: any) => {
  return api.post('/auth/reset-password', data);
};

export const updateProfile = (data: { name?: string; profile_url?: string; gender?: string; year_of_birth?: number; phone_number?: string }) => {
  return api.put('/users/profile', data);
};
