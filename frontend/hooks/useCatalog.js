'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/lib/axiosClient';

/**
 * useCatalogTables - Get catalog tables
 * Query: GET /api/catalog/tables
 * Params: { search, workspace_id, skip, limit, sort_by }
 */
export const useCatalogTables = (params = {}) => {
  return useQuery({
    queryKey: ['catalog', 'tables', params],
    queryFn: async () => {
      const response = await axiosClient.get('/api/catalog/tables', { params });
      return response.data?.data || response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * useCatalogTable - Get catalog table details
 * Query: GET /api/catalog/tables/{id}
 */
export const useCatalogTable = (id) => {
  return useQuery({
    queryKey: ['catalog', 'tables', id],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/catalog/tables/${id}`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * useCatalogTableColumns - Get table columns
 * Query: GET /api/catalog/tables/{id}/columns
 */
export const useCatalogTableColumns = (id) => {
  return useQuery({
    queryKey: ['catalog', 'tables', id, 'columns'],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/catalog/tables/${id}/columns`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * useCatalogTableLineage - Get table lineage
 * Query: GET /api/catalog/tables/{id}/lineage
 */
export const useCatalogTableLineage = (id) => {
  return useQuery({
    queryKey: ['catalog', 'tables', id, 'lineage'],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/catalog/tables/${id}/lineage`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * useCatalogTableQuality - Get table quality metrics
 * Query: GET /api/catalog/tables/{id}/quality
 */
export const useCatalogTableQuality = (id) => {
  return useQuery({
    queryKey: ['catalog', 'tables', id, 'quality'],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/catalog/tables/${id}/quality`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * useCatalogSearch - Search catalog with debouncing
 * Query: GET /api/catalog/search?q={query}
 */
export const useCatalogSearch = (query) => {
  return useQuery({
    queryKey: ['catalog', 'search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const response = await axiosClient.get('/api/catalog/search', {
        params: { q: query },
      });
      return response.data?.data || response.data;
    },
    enabled: !!query && query.length >= 2,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * useRecentCatalogTables - Get recently viewed/accessed tables
 * Query: GET /api/catalog/recent
 */
export const useRecentCatalogTables = () => {
  return useQuery({
    queryKey: ['catalog', 'recent'],
    queryFn: async () => {
      const response = await axiosClient.get('/api/catalog/recent');
      return response.data?.data || response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * usePopularCatalogTables - Get popular tables
 * Query: GET /api/catalog/popular
 */
export const usePopularCatalogTables = () => {
  return useQuery({
    queryKey: ['catalog', 'popular'],
    queryFn: async () => {
      const response = await axiosClient.get('/api/catalog/popular');
      return response.data?.data || response.data;
    },
    staleTime: 10 * 60 * 1000,
  });
};

export default {
  useCatalogTables,
  useCatalogTable,
  useCatalogTableColumns,
  useCatalogTableLineage,
  useCatalogTableQuality,
  useCatalogSearch,
  useRecentCatalogTables,
  usePopularCatalogTables,
};
