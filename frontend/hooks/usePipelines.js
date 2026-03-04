'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/lib/axiosClient';
import { toast } from 'sonner';

/**
 * usePipelines - Get paginated list of pipelines
 * Query: GET /api/pipelines
 * Params: { workspace_id, status, visibility, skip, limit }
 */
export const usePipelines = (params = {}) => {
  return useQuery({
    queryKey: ['pipelines', params],
    queryFn: async () => {
      const response = await axiosClient.get('/api/pipelines', { params });
      return response.data?.data || response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * usePipeline - Get pipeline details
 * Query: GET /api/pipelines/{id}
 */
export const usePipeline = (id) => {
  return useQuery({
    queryKey: ['pipelines', id],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/pipelines/${id}`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * useCreatePipeline - Create new pipeline
 * Mutation: POST /api/pipelines
 */
export const useCreatePipeline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await axiosClient.post('/api/pipelines', data);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast.success('Pipeline created successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to create pipeline';
      toast.error(message);
    },
  });
};

/**
 * useUpdatePipeline - Update pipeline
 * Mutation: PUT /api/pipelines/{id}
 */
export const useUpdatePipeline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await axiosClient.put(`/api/pipelines/${id}`, data);
      return response.data?.data || response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      queryClient.invalidateQueries({ queryKey: ['pipelines', data.id] });
      toast.success('Pipeline updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to update pipeline';
      toast.error(message);
    },
  });
};

/**
 * useDeletePipeline - Delete pipeline
 * Mutation: DELETE /api/pipelines/{id}
 */
export const useDeletePipeline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await axiosClient.delete(`/api/pipelines/${id}`);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast.success('Pipeline deleted successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to delete pipeline';
      toast.error(message);
    },
  });
};

/**
 * useForkPipeline - Fork pipeline
 * Mutation: POST /api/pipelines/{id}/fork
 */
export const useForkPipeline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await axiosClient.post(`/api/pipelines/${id}/fork`, data);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast.success('Pipeline forked successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to fork pipeline';
      toast.error(message);
    },
  });
};

/**
 * useUpdatePipelinePermissions - Update pipeline permissions
 * Mutation: PUT /api/pipelines/{id}/permissions
 */
export const useUpdatePipelinePermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await axiosClient.put(`/api/pipelines/${id}/permissions`, data);
      return response.data?.data || response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      queryClient.invalidateQueries({ queryKey: ['pipelines', variables.id] });
      toast.success('Permissions updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to update permissions';
      toast.error(message);
    },
  });
};

/**
 * usePipelineVersions - Get pipeline versions
 * Query: GET /api/pipelines/{id}/versions
 */
export const usePipelineVersions = (id) => {
  return useQuery({
    queryKey: ['pipelines', id, 'versions'],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/pipelines/${id}/versions`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * usePipelineVersion - Get specific pipeline version
 * Query: GET /api/pipelines/{id}/versions/{version}
 */
export const usePipelineVersion = (id, version) => {
  return useQuery({
    queryKey: ['pipelines', id, 'versions', version],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/pipelines/${id}/versions/${version}`);
      return response.data?.data || response.data;
    },
    enabled: !!id && !!version,
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * useRestorePipelineVersion - Restore pipeline to previous version
 * Mutation: POST /api/pipelines/{id}/restore/{version}
 */
export const useRestorePipelineVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, version }) => {
      const response = await axiosClient.post(`/api/pipelines/${id}/restore/${version}`);
      return response.data?.data || response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pipelines', variables.id] });
      queryClient.invalidateQueries({
        queryKey: ['pipelines', variables.id, 'versions'],
      });
      toast.success('Pipeline restored successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to restore pipeline';
      toast.error(message);
    },
  });
};

export default {
  usePipelines,
  usePipeline,
  useCreatePipeline,
  useUpdatePipeline,
  useDeletePipeline,
  useForkPipeline,
  useUpdatePipelinePermissions,
  usePipelineVersions,
  usePipelineVersion,
  useRestorePipelineVersion,
};
