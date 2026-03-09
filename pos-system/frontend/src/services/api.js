import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      // Only redirect to login if the failure is on the auth check itself
      // (i.e. the user's own token is invalid/expired), not on any API call
      const isAuthCheck = requestUrl.includes('/auth/me') || requestUrl.includes('/auth/refresh');
      if (isAuthCheck) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      // For other endpoints (e.g. customer lookup by cashier), just reject
      // so the caller can handle the error gracefully.
    }
    return Promise.reject(error);
  }
);

export default api;