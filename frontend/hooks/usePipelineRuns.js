'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/lib/axiosClient';
import { toast } from 'sonner';

/**
 * useRunPipeline - Run/execute pipeline
 * Mutation: POST /api/pipelines/{id}/run
 */
export const useRunPipeline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, params = {} }) => {
      const response = await axiosClient.post(`/api/pipelines/${id}/run`, params);
      return response.data?.data || response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      queryClient.invalidateQueries({ queryKey: ['runs'] });
      toast.success('Pipeline started successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to start pipeline';
      toast.error(message);
    },
  });
};

/**
 * usePipelineRuns - Get pipeline runs
 * Query: GET /api/pipelines/{id}/runs
 * Params: { status, skip, limit, sort }
 */
export const usePipelineRuns = (pipelineId, params = {}) => {
  return useQuery({
    queryKey: ['pipelines', pipelineId, 'runs', params],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/pipelines/${pipelineId}/runs`, {
        params,
      });
      return response.data?.data || response.data;
    },
    enabled: !!pipelineId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * useRun - Get run details
 * Query: GET /api/runs/{id}
 * Auto-refetch if status is running
 */
export const useRun = (id) => {
  return useQuery({
    queryKey: ['runs', id],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/runs/${id}`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
    refetchInterval: (data) => {
      // Refetch every 5 seconds if status is 'running'
      return data?.status === 'running' ? 5 * 1000 : false;
    },
  });
};

/**
 * useRunLogs - Get run logs
 * Query: GET /api/runs/{id}/logs
 */
export const useRunLogs = (id, options = {}) => {
  return useQuery({
    queryKey: ['runs', id, 'logs'],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/runs/${id}/logs`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
    staleTime: 5 * 1000,
    refetchInterval: options.polling ? 5 * 1000 : false,
  });
};

/**
 * useCancelRun - Cancel a running pipeline
 * Mutation: POST /api/runs/{id}/cancel
 */
export const useCancelRun = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await axiosClient.post(`/api/runs/${id}/cancel`);
      return response.data?.data || response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['runs', id] });
      queryClient.invalidateQueries({ queryKey: ['runs'] });
      toast.success('Run cancelled successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to cancel run';
      toast.error(message);
    },
  });
};

/**
 * useRunMetrics - Get run metrics
 * Query: GET /api/runs/{id}/metrics
 */
export const useRunMetrics = (id) => {
  return useQuery({
    queryKey: ['runs', id, 'metrics'],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/runs/${id}/metrics`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * useEngines - Get available execution engines
 * Query: GET /api/engines
 */
export const useEngines = () => {
  return useQuery({
    queryKey: ['engines'],
    queryFn: async () => {
      const response = await axiosClient.get('/api/engines');
      return response.data?.data || response.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

/**
 * useValidateEngine - Validate engine configuration
 * Mutation: POST /api/engines/{engine}/validate
 */
export const useValidateEngine = () => {
  return useMutation({
    mutationFn: async ({ engine, config }) => {
      const response = await axiosClient.post(`/api/engines/${engine}/validate`, config);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      toast.success('Engine configuration is valid');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Engine configuration is invalid';
      toast.error(message);
    },
  });
};

export default {
  useRunPipeline,
  usePipelineRuns,
  useRun,
  useRunLogs,
  useCancelRun,
  useRunMetrics,
  useEngines,
  useValidateEngine,
};
