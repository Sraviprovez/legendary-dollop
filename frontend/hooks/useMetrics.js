'use client';

import { useQuery } from '@tanstack/react-query';
import axiosClient from '@/lib/axiosClient';

/**
 * useSystemMetrics - Get system-wide metrics
 * Query: GET /api/metrics/system
 */
export const useSystemMetrics = () => {
  return useQuery({
    queryKey: ['metrics', 'system'],
    queryFn: async () => {
      const response = await axiosClient.get('/api/metrics/system');
      return response.data?.data || response.data;
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

/**
 * usePipelineMetrics - Get pipeline-specific metrics
 * Query: GET /api/metrics/pipeline/{id}
 */
export const usePipelineMetrics = (id) => {
  return useQuery({
    queryKey: ['metrics', 'pipeline', id],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/metrics/pipeline/${id}`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 30 * 1000,
  });
};

/**
 * useUsageMetrics - Get usage metrics
 * Query: GET /api/metrics/usage
 */
export const useUsageMetrics = () => {
  return useQuery({
    queryKey: ['metrics', 'usage'],
    queryFn: async () => {
      const response = await axiosClient.get('/api/metrics/usage');
      return response.data?.data || response.data;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

/**
 * usePerformanceMetrics - Get performance metrics
 * Query: GET /api/metrics/performance
 */
export const usePerformanceMetrics = () => {
  return useQuery({
    queryKey: ['metrics', 'performance'],
    queryFn: async () => {
      const response = await axiosClient.get('/api/metrics/performance');
      return response.data?.data || response.data;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
  });
};

/**
 * useHealthStatus - Get system health status
 * Query: GET /api/health
 */
export const useHealthStatus = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await axiosClient.get('/api/health');
      return response.data?.data || response.data;
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};

/**
 * useDetailedHealthStatus - Get detailed health status
 * Query: GET /api/health/detailed
 */
export const useDetailedHealthStatus = () => {
  return useQuery({
    queryKey: ['health', 'detailed'],
    queryFn: async () => {
      const response = await axiosClient.get('/api/health/detailed');
      return response.data?.data || response.data;
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};

export default {
  useSystemMetrics,
  usePipelineMetrics,
  useUsageMetrics,
  usePerformanceMetrics,
  useHealthStatus,
  useDetailedHealthStatus,
};
