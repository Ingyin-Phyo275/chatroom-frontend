// src/api/axios.js
import axios from 'axios';

const baseURL = import.meta.env.VITE_APP_BASE_URL;
console.log(baseURL)
const axiosInstance = axios.create({
  baseURL: baseURL, //  Set your API base URL
  timeout: 90000, // Optional: request timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Add interceptors for request/response
axiosInstance.interceptors.request.use(
  (config) => {
    // e.g., Add token to headers
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Global error handling
    console.error('API error:', error.response || error.message);
    return Promise.reject(error);
  }
);

export default axiosInstance;
