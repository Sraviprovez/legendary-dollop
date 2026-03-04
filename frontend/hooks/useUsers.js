'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/lib/axiosClient';
import { toast } from 'sonner';

/**
 * useUsers - Get paginated list of users
 * Query: GET /api/admin/users
 * Params: { page, limit, search, role, status }
 */
export const useUsers = (params = {}) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const response = await axiosClient.get('/api/admin/users', { params });
      return response.data?.data || response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * useUser - Get single user by ID
 * Query: GET /api/admin/users/{id}
 */
export const useUser = (id) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/admin/users/${id}`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * useCreateUser - Create new user
 * Mutation: POST /api/admin/users
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData) => {
      const response = await axiosClient.post('/api/admin/users', userData);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to create user';
      toast.error(message);
    },
  });
};

/**
 * useUpdateUser - Update user
 * Mutation: PUT /api/admin/users/{id}
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await axiosClient.put(`/api/admin/users/${id}`, data);
      return response.data?.data || response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', data.id] });
      toast.success('User updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to update user';
      toast.error(message);
    },
  });
};

/**
 * useDeleteUser - Delete user (soft delete)
 * Mutation: DELETE /api/admin/users/{id}
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await axiosClient.delete(`/api/admin/users/${id}`);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to delete user';
      toast.error(message);
    },
  });
};

/**
 * useResetUserPassword - Reset user password
 * Mutation: POST /api/admin/users/{id}/reset-password
 */
export const useResetUserPassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, newPassword }) => {
      const response = await axiosClient.post(
        `/api/admin/users/${id}/reset-password`,
        { new_password: newPassword }
      );
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Password reset successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to reset password';
      toast.error(message);
    },
  });
};

/**
 * useActivateUser - Activate user
 * Mutation: PUT /api/admin/users/{id}/activate
 */
export const useActivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await axiosClient.put(`/api/admin/users/${id}/activate`);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User activated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to activate user';
      toast.error(message);
    },
  });
};

/**
 * useDeactivateUser - Deactivate user
 * Mutation: PUT /api/admin/users/{id}/deactivate
 */
export const useDeactivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await axiosClient.put(`/api/admin/users/${id}/deactivate`);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deactivated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to deactivate user';
      toast.error(message);
    },
  });
};

/**
 * useUserActivity - Get user activity log
 * Query: GET /api/admin/users/{id}/activity
 */
export const useUserActivity = (id) => {
  return useQuery({
    queryKey: ['users', id, 'activity'],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/admin/users/${id}/activity`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

export default {
  useUsers,
  useUser,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useResetUserPassword,
  useActivateUser,
  useDeactivateUser,
  useUserActivity,
};
