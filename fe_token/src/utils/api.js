 

import axios from 'axios';

 
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true  // ← sends HttpOnly cookies automatically (like Facebook)
});

 
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve());
  failedQueue = [];
};

api.interceptors.response.use(
  response => response,

  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
    
        await api.post('/refresh');

        processQueue(null);
        return api(originalRequest); // retry — browser sends new cookie

      } catch (refreshError) {
        processQueue(refreshError);

        // Both tokens expired — clear UI state and redirect to login
        localStorage.removeItem('userId');
        localStorage.removeItem('userGender');
        localStorage.setItem('isLoggedIn', 'false');
        window.location.href = '/login';

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;