import axios from 'axios';

// In production: VITE_API_URL=https://your-springboot.onrender.com/api
// In development: falls back to '/api' which is proxied by vite.config.js to localhost:8081
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add JWT token
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
      // Only redirect to login if the user's own token is invalid/expired
      const isAuthCheck = requestUrl.includes('/auth/me') || requestUrl.includes('/auth/refresh');
      if (isAuthCheck) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;