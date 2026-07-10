import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Request interceptor — attach auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ls_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    const isAlreadyOnLogin = window.location.pathname.includes('/login');

    if (error.response?.status === 401 && !isLoginRequest && !isAlreadyOnLogin) {
      // Only redirect on 401 for non-login endpoints (expired/invalid session)
      // Guard against infinite loop if /login itself makes API calls
      localStorage.removeItem('ls_admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
