// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://internalcrm.digitalinclined.in/api', // Your backend URL
  withCredentials: true
});

// This "interceptor" automatically adds the auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;