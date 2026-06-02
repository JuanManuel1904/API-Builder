import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 → refresh or redirect
api.interceptors.response.use(
  (res) => res,
  (error) => {
    console.log('🔥 INTERCEPTOR HIT:', {
      status: error.response?.status,
      url: error.config?.url,
    });

    return Promise.reject(error);
  },
);

export default api;
