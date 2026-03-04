'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/lib/axiosClient';
import { tokenStorage, userStorage } from '@/lib/storage';
import { toast } from 'sonner';

/**
 * useAuth - Get current authenticated user
 * Query key: ['auth', 'me']
 */
export const useAuth = () => {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await axiosClient.get('/api/auth/me');
      return response.data?.data || response.data;
    },
    retry: 1,
    enabled: tokenStorage.hasToken(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * useLogin - Login user with email and password
 * Mutation: POST /api/auth/login/json
 */
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials) => {
      const response = await axiosClient.post('/api/auth/login/json', credentials);
      return response.data?.data || response.data;
    },
    onSuccess: (data) => {
      // Store token
      if (data.access_token) {
        tokenStorage.setToken(data.access_token);
      }

      // Invalidate auth query
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      
      toast.success('Login successful');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Login failed';
      toast.error(message);
    },
  });
};

/**
 * useLogout - Logout user
 * Mutation: POST /api/auth/logout
 */
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await axiosClient.post('/api/auth/logout');
      return response.data;
    },
    onSuccess: () => {
      // Clear token and user
      tokenStorage.clearToken();
      userStorage.clearUser();

      // Clear all auth queries
      queryClient.clear();

      toast.success('Logged out successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Logout failed';
      toast.error(message);
    },
  });
};

/**
 * useRegister - Register new user
 * Mutation: POST /api/auth/register
 */
export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData) => {
      const response = await axiosClient.post('/api/auth/register', userData);
      return response.data?.data || response.data;
    },
    onSuccess: (data) => {
      // Store token if provided
      if (data.access_token) {
        tokenStorage.setToken(data.access_token);
      }

      // Invalidate auth query
      queryClient.invalidateQueries({ queryKey: ['auth'] });

      toast.success('Registration successful');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Registration failed';
      toast.error(message);
    },
  });
};

/**
 * useChangePassword - Change user password
 * Mutation: POST /api/auth/change-password
 */
export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (passwordData) => {
      const response = await axiosClient.post('/api/auth/change-password', passwordData);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to change password';
      toast.error(message);
    },
  });
};

/**
 * useRefreshToken - Refresh authentication token
 * Mutation: POST /api/auth/refresh
 */
export const useRefreshToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await axiosClient.post('/api/auth/refresh');
      return response.data?.data || response.data;
    },
    onSuccess: (data) => {
      if (data.access_token) {
        tokenStorage.setToken(data.access_token);
      }
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: (error) => {
      tokenStorage.clearToken();
      userStorage.clearUser();
      const message = error.response?.data?.detail || 'Token refresh failed';
      toast.error(message);
    },
  });
};

export default {
  useAuth,
  useLogin,
  useLogout,
  useRegister,
  useChangePassword,
  useRefreshToken,
};
