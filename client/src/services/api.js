import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json'
  }
});

// Request interceptor to attach Bearer token if available
api.interceptors.request.use(
  (config) => {
    try {
      const token = sessionStorage.getItem('sriyas_admin_token');
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (_) {
      // Ignore storage errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

