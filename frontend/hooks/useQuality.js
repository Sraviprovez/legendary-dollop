'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/lib/axiosClient';
import { toast } from 'sonner';

/**
 * useQualityRules - Get quality rules
 * Query: GET /api/quality/rules
 */
export const useQualityRules = (params = {}) => {
  return useQuery({
    queryKey: ['quality', 'rules', params],
    queryFn: async () => {
      const response = await axiosClient.get('/api/quality/rules', { params });
      return response.data?.data || response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * useQualityRule - Get quality rule details
 * Query: GET /api/quality/rules/{id}
 */
export const useQualityRule = (id) => {
  return useQuery({
    queryKey: ['quality', 'rules', id],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/quality/rules/${id}`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * useCreateQualityRule - Create quality rule
 * Mutation: POST /api/quality/rules
 */
export const useCreateQualityRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await axiosClient.post('/api/quality/rules', data);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality', 'rules'] });
      toast.success('Quality rule created successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to create quality rule';
      toast.error(message);
    },
  });
};

/**
 * useUpdateQualityRule - Update quality rule
 * Mutation: PUT /api/quality/rules/{id}
 */
export const useUpdateQualityRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await axiosClient.put(`/api/quality/rules/${id}`, data);
      return response.data?.data || response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quality', 'rules'] });
      queryClient.invalidateQueries({ queryKey: ['quality', 'rules', data.id] });
      toast.success('Quality rule updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to update quality rule';
      toast.error(message);
    },
  });
};

/**
 * useDeleteQualityRule - Delete quality rule
 * Mutation: DELETE /api/quality/rules/{id}
 */
export const useDeleteQualityRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await axiosClient.delete(`/api/quality/rules/${id}`);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality', 'rules'] });
      toast.success('Quality rule deleted successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to delete quality rule';
      toast.error(message);
    },
  });
};

/**
 * useRunQualityRule - Run quality rule
 * Mutation: POST /api/quality/rules/{id}/run
 */
export const useRunQualityRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await axiosClient.post(`/api/quality/rules/${id}/run`);
      return response.data?.data || response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['quality', 'results'] });
      queryClient.invalidateQueries({ queryKey: ['quality', 'rules', id] });
      toast.success('Quality rule executed successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to run quality rule';
      toast.error(message);
    },
  });
};

/**
 * useQualityResults - Get quality check results
 * Query: GET /api/quality/results
 * Params: { rule_id, table_id, status, skip, limit }
 */
export const useQualityResults = (params = {}) => {
  return useQuery({
    queryKey: ['quality', 'results', params],
    queryFn: async () => {
      const response = await axiosClient.get('/api/quality/results', { params });
      return response.data?.data || response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * useQualityDashboard - Get quality dashboard data
 * Query: GET /api/quality/dashboard
 */
export const useQualityDashboard = () => {
  return useQuery({
    queryKey: ['quality', 'dashboard'],
    queryFn: async () => {
      const response = await axiosClient.get('/api/quality/dashboard');
      return response.data?.data || response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * useQualityAnomalies - Get detected anomalies
 * Query: GET /api/quality/anomalies
 */
export const useQualityAnomalies = (params = {}) => {
  return useQuery({
    queryKey: ['quality', 'anomalies', params],
    queryFn: async () => {
      const response = await axiosClient.get('/api/quality/anomalies', { params });
      return response.data?.data || response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export default {
  useQualityRules,
  useQualityRule,
  useCreateQualityRule,
  useUpdateQualityRule,
  useDeleteQualityRule,
  useRunQualityRule,
  useQualityResults,
  useQualityDashboard,
  useQualityAnomalies,
};
