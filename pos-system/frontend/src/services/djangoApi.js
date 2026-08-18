import axios from 'axios';

// Django Analytics API base URL
// Falls back to http://localhost:8000/api in development
const DJANGO_API_BASE_URL = import.meta.env.VITE_DJANGO_API_URL || 'http://localhost:8000/api';

const djangoApi = axios.create({
  baseURL: DJANGO_API_BASE_URL,
});

// Request interceptor to attach JWT token
djangoApi.interceptors.request.use(
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
djangoApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Django API unauthorized — token may be invalid or expired.');
    }
    return Promise.reject(error);
  }
);

export default djangoApi;
