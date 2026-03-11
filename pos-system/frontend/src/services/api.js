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

// Track if a redirect is already in progress to avoid redirect loops
// caused by background polling (e.g., payment-requests polling every 3s)
let isRedirectingToLogin = false;

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect once even if multiple concurrent requests fail
      if (!isRedirectingToLogin) {
        isRedirectingToLogin = true;
        // Token is invalid or expired — clear auth state
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Small delay to let in-flight requests settle before navigating
        setTimeout(() => {
          window.location.href = '/login';
          isRedirectingToLogin = false;
        }, 300);
      }
    }
    return Promise.reject(error);
  }
);

export default api;