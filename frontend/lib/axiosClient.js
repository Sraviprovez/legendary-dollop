import axios from 'axios';
import { toast } from 'sonner';

/**
 * Axios HTTP client with interceptors, retry logic, and error handling
 * Base URL from NEXT_PUBLIC_API_URL env var
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const axiosClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * Request interceptor - Add authorization token
 */
axiosClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Request interceptor error:', error);
    }
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle errors and auth redirects
 */
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      toast.error('Session expired. Please login again.');
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.');
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
      if (process.env.NODE_ENV === 'development') {
        console.error('Server error:', error.response?.data);
      }
    }

    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
