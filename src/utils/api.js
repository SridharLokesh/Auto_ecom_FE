/* eslint-disable no-empty */
import axios from 'axios';

console.log('RAW ENV VALUE:', import.meta.env.VITE_API_URL);
console.log('ALL ENV:', import.meta.env);

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://e-commerce-product-backend-ut34.onrender.com',
  //'https://backend-focus-seu6.onrender.com/api' ||
  timeout: 15000,
});
console.log('API baseURL:', api.defaults.baseURL);
// Attach JWT from localStorage
api.interceptors.request.use((config) => {
  try {
    const user = JSON.parse(localStorage.getItem('tvs_user') || 'null');
    if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  } catch {}
  return config;
});

// Global 401 handling — only redirect if user had a token (prevents infinite loop)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      try {
        const user = JSON.parse(localStorage.getItem('tvs_user') || 'null');
        // Only clear + redirect if they were actually logged in
        if (user?.token) {
          localStorage.removeItem('tvs_user');
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
      } catch {}
    }
    return Promise.reject(error);
  }
);

export default api;