'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/lib/axiosClient';
import { toast } from 'sonner';

/**
 * useWorkspaces - Get list of user's workspaces
 * Query: GET /api/workspaces
 */
export const useWorkspaces = () => {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const response = await axiosClient.get('/api/workspaces');
      return response.data?.data || response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * useWorkspace - Get workspace details
 * Query: GET /api/workspaces/{id}
 */
export const useWorkspace = (id) => {
  return useQuery({
    queryKey: ['workspaces', id],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/workspaces/${id}`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * useCreateWorkspace - Create new workspace
 * Mutation: POST /api/workspaces
 */
export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await axiosClient.post('/api/workspaces', data);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Workspace created successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to create workspace';
      toast.error(message);
    },
  });
};

/**
 * useUpdateWorkspace - Update workspace
 * Mutation: PUT /api/workspaces/{id}
 */
export const useUpdateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await axiosClient.put(`/api/workspaces/${id}`, data);
      return response.data?.data || response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces', data.id] });
      toast.success('Workspace updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to update workspace';
      toast.error(message);
    },
  });
};

/**
 * useDeleteWorkspace - Delete workspace
 * Mutation: DELETE /api/workspaces/{id}
 */
export const useDeleteWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await axiosClient.delete(`/api/workspaces/${id}`);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Workspace deleted successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to delete workspace';
      toast.error(message);
    },
  });
};

/**
 * useWorkspaceMembers - Get workspace members
 * Query: GET /api/workspaces/{id}/members
 */
export const useWorkspaceMembers = (id) => {
  return useQuery({
    queryKey: ['workspaces', id, 'members'],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/workspaces/${id}/members`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * useAddWorkspaceMember - Add member to workspace
 * Mutation: POST /api/workspaces/{id}/members
 */
export const useAddWorkspaceMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId, data }) => {
      const response = await axiosClient.post(
        `/api/workspaces/${workspaceId}/members`,
        data
      );
      return response.data?.data || response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['workspaces', variables.workspaceId, 'members'],
      });
      toast.success('Member added successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to add member';
      toast.error(message);
    },
  });
};

/**
 * useUpdateWorkspaceMember - Update workspace member role
 * Mutation: PUT /api/workspaces/{id}/members/{userId}
 */
export const useUpdateWorkspaceMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId, userId, data }) => {
      const response = await axiosClient.put(
        `/api/workspaces/${workspaceId}/members/${userId}`,
        data
      );
      return response.data?.data || response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['workspaces', variables.workspaceId, 'members'],
      });
      toast.success('Member updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to update member';
      toast.error(message);
    },
  });
};

/**
 * useRemoveWorkspaceMember - Remove member from workspace
 * Mutation: DELETE /api/workspaces/{id}/members/{userId}
 */
export const useRemoveWorkspaceMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId, userId }) => {
      const response = await axiosClient.delete(
        `/api/workspaces/${workspaceId}/members/${userId}`
      );
      return response.data?.data || response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['workspaces', variables.workspaceId, 'members'],
      });
      toast.success('Member removed successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to remove member';
      toast.error(message);
    },
  });
};

/**
 * useWorkspaceActivity - Get workspace activity log
 * Query: GET /api/workspaces/{id}/activity
 */
export const useWorkspaceActivity = (id) => {
  return useQuery({
    queryKey: ['workspaces', id, 'activity'],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/workspaces/${id}/activity`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

export default {
  useWorkspaces,
  useWorkspace,
  useCreateWorkspace,
  useUpdateWorkspace,
  useDeleteWorkspace,
  useWorkspaceMembers,
  useAddWorkspaceMember,
  useUpdateWorkspaceMember,
  useRemoveWorkspaceMember,
  useWorkspaceActivity,
};
