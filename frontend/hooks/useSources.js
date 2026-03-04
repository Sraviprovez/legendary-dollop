'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/lib/axiosClient';
import { toast } from 'sonner';

/**
 * useSources - Get paginated list of data sources
 * Query: GET /api/sources
 * Params: { workspace_id, skip, limit, search }
 */
export const useSources = (params = {}) => {
  return useQuery({
    queryKey: ['sources', params],
    queryFn: async () => {
      const response = await axiosClient.get('/api/sources', { params });
      return response.data?.data || response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * useSource - Get source details
 * Query: GET /api/sources/{id}
 */
export const useSource = (id) => {
  return useQuery({
    queryKey: ['sources', id],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/sources/${id}`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * useCreateSource - Create new data source
 * Mutation: POST /api/sources
 */
export const useCreateSource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await axiosClient.post('/api/sources', data);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      toast.success('Source created successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to create source';
      toast.error(message);
    },
  });
};

/**
 * useUpdateSource - Update data source
 * Mutation: PUT /api/sources/{id}
 */
export const useUpdateSource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await axiosClient.put(`/api/sources/${id}`, data);
      return response.data?.data || response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      queryClient.invalidateQueries({ queryKey: ['sources', data.id] });
      toast.success('Source updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to update source';
      toast.error(message);
    },
  });
};

/**
 * useDeleteSource - Delete data source
 * Mutation: DELETE /api/sources/{id}
 */
export const useDeleteSource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await axiosClient.delete(`/api/sources/${id}`);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      toast.success('Source deleted successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to delete source';
      toast.error(message);
    },
  });
};

/**
 * useTestSourceConnection - Test source connection
 * Mutation: POST /api/sources/{id}/test-connection
 */
export const useTestSourceConnection = () => {
  return useMutation({
    mutationFn: async (id) => {
      const response = await axiosClient.post(`/api/sources/${id}/test-connection`);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      toast.success('Connection test successful');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Connection test failed';
      toast.error(message);
    },
  });
};

/**
 * useDiscoverSourceSchema - Discover source schema
 * Mutation: POST /api/sources/{id}/discover-schema
 */
export const useDiscoverSourceSchema = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await axiosClient.post(`/api/sources/${id}/discover-schema`);
      return response.data?.data || response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['sources', id, 'schema'] });
      toast.success('Schema discovered successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to discover schema';
      toast.error(message);
    },
  });
};

/**
 * useSourceSchema - Get cached source schema
 * Query: GET /api/sources/{id}/schema
 */
export const useSourceSchema = (id) => {
  return useQuery({
    queryKey: ['sources', id, 'schema'],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/sources/${id}/schema`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * useSyncSource - Trigger source sync
 * Mutation: POST /api/sources/{id}/sync
 */
export const useSyncSource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await axiosClient.post(`/api/sources/${id}/sync`);
      return response.data?.data || response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['sources', id] });
      toast.success('Sync started successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to start sync';
      toast.error(message);
    },
  });
};

/**
 * useSourceTypes - Get available source types
 * Query: GET /api/sources/types
 */
export const useSourceTypes = () => {
  return useQuery({
    queryKey: ['sources', 'types'],
    queryFn: async () => {
      const response = await axiosClient.get('/api/sources/types');
      return response.data?.data || response.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

/**
 * useSourceStatus - Get source status
 * Query: GET /api/sources/{id}/status
 */
export const useSourceStatus = (id) => {
  return useQuery({
    queryKey: ['sources', id, 'status'],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/sources/${id}/status`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds for status
    refetchInterval: 30 * 1000,
  });
};

export default {
  useSources,
  useSource,
  useCreateSource,
  useUpdateSource,
  useDeleteSource,
  useTestSourceConnection,
  useDiscoverSourceSchema,
  useSourceSchema,
  useSyncSource,
  useSourceTypes,
  useSourceStatus,
};
