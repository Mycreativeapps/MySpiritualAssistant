import axios from 'axios';
import NavigationService from '../navigation/NavigationService';

export const API_BASE_URL = () => {
  // return 'http://10.148.47.77:5000/api';
  return 'https://myspiritualassistant.onrender.com/api';
};

export const Token = () => {
  // Use require to avoid top-level circular dependency with useUserStore
  try {
    const { useUserStore } = require('../store');
    return useUserStore.getState().user?.token;
  } catch (e) {
    return null;
  }
};

// Create a central axios instance
const api = axios.create({
  baseURL: API_BASE_URL(),
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Add a request interceptor to attach the token
api.interceptors.request.use(
  config => {
    const token = Token();
    console.log(
      `[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url
      }`,
    );
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  },
);

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  response => {
    console.log(
      `[API Response] ${response.status} from ${response.config.url}`,
    );
    return response;
  },
  async error => {
    console.error(
      `[API Response Error] ${error.config?.url}:`,
      error.response?.data || error.message,
    );
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      let refreshToken = null;
      try {
        const { useUserStore } = require('../store');
        refreshToken = useUserStore.getState().user?.refreshToken;
      } catch (e) { }

      if (refreshToken) {
        try {
          // Attempt to refresh the token
          const response = await axios.post(`${API_BASE_URL()}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          if (response.data.success) {
            const { accessToken } = response.data.data;

            // Update user store with new token (using updateUser ensures merge)
            const { useUserStore } = require('../store');
            useUserStore.getState().updateUser({ token: accessToken });

            processQueue(null, accessToken);

            // Update original request header and retry
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          console.error('Refresh token failed:', refreshError);

          // Clear user store and redirect to Login
          try {
            const { useUserStore } = require('../store');
            useUserStore.getState().clearUser();
            console.log('[Auth] Local store cleared due to refresh failure');
          } catch (e) {
            console.error('[Auth] Failed to clear user store:', e);
          }

          NavigationService.replace('Login');
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
