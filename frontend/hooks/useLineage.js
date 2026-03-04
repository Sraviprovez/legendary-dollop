'use client';

import { useQuery } from '@tanstack/react-query';
import axiosClient from '@/lib/axiosClient';

/**
 * useTableLineage - Get table lineage graph
 * Query: GET /api/lineage/table/{id}
 * Returns graph data for visualization
 */
export const useTableLineage = (id) => {
  return useQuery({
    queryKey: ['lineage', 'table', id],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/lineage/table/${id}`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * usePipelineLineage - Get pipeline lineage graph
 * Query: GET /api/lineage/pipeline/{id}
 */
export const usePipelineLineage = (id) => {
  return useQuery({
    queryKey: ['lineage', 'pipeline', id],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/lineage/pipeline/${id}`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * useColumnLineage - Get column-level lineage
 * Query: GET /api/lineage/column/{tableId}/{column}
 */
export const useColumnLineage = (tableId, column) => {
  return useQuery({
    queryKey: ['lineage', 'column', tableId, column],
    queryFn: async () => {
      const response = await axiosClient.get(
        `/api/lineage/column/${tableId}/${encodeURIComponent(column)}`
      );
      return response.data?.data || response.data;
    },
    enabled: !!tableId && !!column,
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * useLineageImpact - Get lineage impact analysis
 * Query: GET /api/lineage/impact/{nodeId}
 */
export const useLineageImpact = (nodeId) => {
  return useQuery({
    queryKey: ['lineage', 'impact', nodeId],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/lineage/impact/${nodeId}`);
      return response.data?.data || response.data;
    },
    enabled: !!nodeId,
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * useLineageSearch - Search lineage
 * Query: GET /api/lineage/search
 */
export const useLineageSearch = (query) => {
  return useQuery({
    queryKey: ['lineage', 'search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const response = await axiosClient.get('/api/lineage/search', {
        params: { q: query },
      });
      return response.data?.data || response.data;
    },
    enabled: !!query && query.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
};

export default {
  useTableLineage,
  usePipelineLineage,
  useColumnLineage,
  useLineageImpact,
  useLineageSearch,
};
