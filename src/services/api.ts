/**
 * Axios instance with JWT interceptors.
 * Handles token refresh automatically.
 */
import axios from 'axios';

// Determine API base URL - use environment variable if available, otherwise construct from window location
const getApiBaseUrl = (): string => {
  // First try environment variable
  if (process.env.REACT_APP_API_URL) {
    console.log('Using REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }
  
  // Fallback: construct from current window location
  // If running on localhost:3000, API is on localhost:8000
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('Using localhost fallback: http://localhost:8000/api/v1');
    return 'http://localhost:8000/api/v1';
  }
  
  // For production, assume API is on same host
  const url = `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;
  console.log('Using production fallback:', url);
  return url;
};

const API_BASE_URL = getApiBaseUrl();
console.log('Final API_BASE_URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach access token
api.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem('civic-auth');
    if (stored) {
      const { state } = JSON.parse(stored);
      if (state?.accessToken) {
        config.headers.Authorization = `Bearer ${state.accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const stored = localStorage.getItem('civic-auth');
        if (stored) {
          const { state } = JSON.parse(stored);
          if (state?.refreshToken) {
            const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
              refresh: state.refreshToken,
            });
            const { access } = response.data;
            // Update stored token
            const parsed = JSON.parse(stored);
            parsed.state.accessToken = access;
            localStorage.setItem('civic-auth', JSON.stringify(parsed));
            originalRequest.headers.Authorization = `Bearer ${access}`;
            return api(originalRequest);
          }
        }
      } catch (_) {
        // Refresh failed — clear auth
        localStorage.removeItem('civic-auth');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
