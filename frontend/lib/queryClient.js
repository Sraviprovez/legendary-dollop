import { QueryClient } from '@tanstack/react-query';

/**
 * React Query client with production-ready configuration
 * Stale time: 5 minutes (300000ms)
 * Cache time: 10 minutes (600000ms)
 * Retry: 3 times with exponential backoff
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'stale',
      refetchOnMount: 'stale',
    },
    mutations: {
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Global error handler for queries
queryClient.setDefaultOptions({
  queries: {
    onError: (error) => {
      // Log errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Query error:', error);
      }
    },
  },
  mutations: {
    onError: (error) => {
      // Log errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Mutation error:', error);
      }
    },
  },
});

export default queryClient;
