'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/lib/axiosClient';
import { toast } from 'sonner';

/**
 * useSettings - Get global settings
 * Query: GET /api/settings
 */
export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await axiosClient.get('/api/settings');
      return response.data?.data || response.data;
    },
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * useUpdateSettings - Update global settings
 * Mutation: PUT /api/settings
 */
export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await axiosClient.put('/api/settings', data);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to update settings';
      toast.error(message);
    },
  });
};

/**
 * useWorkspaceSettings - Get workspace settings
 * Query: GET /api/settings/workspace
 */
export const useWorkspaceSettings = (workspaceId) => {
  return useQuery({
    queryKey: ['settings', 'workspace', workspaceId],
    queryFn: async () => {
      const response = await axiosClient.get('/api/settings/workspace', {
        params: { workspace_id: workspaceId },
      });
      return response.data?.data || response.data;
    },
    enabled: !!workspaceId,
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * useIntegrations - Get configured integrations
 * Query: GET /api/settings/integrations
 */
export const useIntegrations = () => {
  return useQuery({
    queryKey: ['settings', 'integrations'],
    queryFn: async () => {
      const response = await axiosClient.get('/api/settings/integrations');
      return response.data?.data || response.data;
    },
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * useConfigureIntegration - Configure integration
 * Mutation: POST /api/settings/integrations/{type}
 */
export const useConfigureIntegration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ type, config }) => {
      const response = await axiosClient.post(
        `/api/settings/integrations/${type}`,
        config
      );
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'integrations'] });
      toast.success('Integration configured successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to configure integration';
      toast.error(message);
    },
  });
};

/**
 * useAuditLogs - Get audit logs
 * Query: GET /api/settings/audit-logs
 * Params: { user_id, action, resource_type, skip, limit, sort }
 */
export const useAuditLogs = (params = {}) => {
  return useQuery({
    queryKey: ['settings', 'audit-logs', params],
    queryFn: async () => {
      const response = await axiosClient.get('/api/settings/audit-logs', { params });
      return response.data?.data || response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

export default {
  useSettings,
  useUpdateSettings,
  useWorkspaceSettings,
  useIntegrations,
  useConfigureIntegration,
  useAuditLogs,
};
