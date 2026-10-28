import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Retrieve or create persistent anonymous sessionId
let sessionId = localStorage.getItem('intellicart_session_id');
if (!sessionId) {
  sessionId = 'sess_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
  localStorage.setItem('intellicart_session_id', sessionId);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'x-session-id': sessionId,
  },
  timeout: 15000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('intellicart_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['x-session-id'] = sessionId;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error parsing & session management
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // If 401 unauthorized on protected route, notify listener if registered
    if (error.response?.status === 401) {
      const isAuthCheck = error.config?.url?.includes('/auth/me');
      if (!isAuthCheck) {
        localStorage.removeItem('token');
        localStorage.removeItem('intellicart_token');
        localStorage.removeItem('intellicart_user');
        window.dispatchEvent(new CustomEvent('intellicart:session_expired'));
      }
    }

    const customMessage =
      error.response?.data?.message || error.message || 'An unexpected error occurred.';
    const enhancedError = new Error(customMessage);
    enhancedError.status = error.response?.status;
    enhancedError.response = error.response;
    return Promise.reject(enhancedError);
  }
);

export default api;

