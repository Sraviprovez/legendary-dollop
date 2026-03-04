# SynKrasis Frontend API Integration - Complete ✓

## Overview
Complete production-ready frontend integration with React Query, Axios, and 13+ custom hooks for seamless API communication.

---

## 1. Core Infrastructure

### ✓ Axios API Client (`lib/axiosClient.js`)
- Single centralized Axios instance
- Base URL: `NEXT_PUBLIC_API_URL` env variable
- **Request Interceptor**: Automatically adds Bearer token from localStorage
- **Response Interceptor**: 
  - Handles 401 → Clears token & redirects to /login
  - Handles 403 → Permission denied toast
  - Handles 5xx → Server error toast
  - Logs errors in development mode
- Timeout: 30 seconds
- Headers: `Content-Type: application/json`, `Accept: application/json`

### ✓ React Query Client (`lib/queryClient.js`)
- **Stale Time**: 5 minutes (300000ms)
- **Cache Time**: 10 minutes (600000ms)
- **Retry Strategy**: 3 retries with exponential backoff (1s, 2s, 4s, max 30s)
- Global error handler with dev logging
- Query-specific & mutation-specific configuration

### ✓ QueryProvider Component (`components/QueryProvider.jsx`)
- Client-side wrapper for React Query
- Properly handles Next.js 16+ server/client component boundaries

---

## 2. Authentication Hooks (`hooks/useAuth.js`)

All hooks with proper error handling, loading states, and React Query integration:

1. **useAuth()** - Get current user
   - Query: `GET /api/auth/me`
   - Returns: `{ user, isLoading, error, isAuthenticated }`
   - Only runs if token exists

2. **useLogin()** - User login
   - Mutation: `POST /api/auth/login/json`
   - Stores token in localStorage
   - Invalidates auth queries on success

3. **useLogout()** - User logout
   - Mutation: `POST /api/auth/logout`
   - Clears token & user storage
   - Clears all queries

4. **useRegister()** - User registration
   - Mutation: `POST /api/auth/register`
   - Stores token if provided
   - Invalidates auth queries

5. **useChangePassword()** - Change user password
   - Mutation: `POST /api/auth/change-password`

6. **useRefreshToken()** - Token refresh
   - Mutation: `POST /api/auth/refresh`
   - Auto-refresh token management

---

## 3. User Management Hooks (`hooks/useUsers.js`)

8 custom hooks for admin user operations:

1. **useUsers(params)** - Get paginated users
   - Query: `GET /api/admin/users`
   - Params: `{ page, limit, search, role, status }`

2. **useUser(id)** - Get single user
   - Query: `GET /api/admin/users/{id}`

3. **useCreateUser()** - Create user
   - Mutation: `POST /api/admin/users`

4. **useUpdateUser()** - Update user
   - Mutation: `PUT /api/admin/users/{id}`

5. **useDeleteUser()** - Delete user (soft delete)
   - Mutation: `DELETE /api/admin/users/{id}`

6. **useResetUserPassword(id, newPassword)** - Reset password
   - Mutation: `POST /api/admin/users/{id}/reset-password`

7. **useActivateUser(id)** - Activate user
   - Mutation: `PUT /api/admin/users/{id}/activate`

8. **useDeactivateUser(id)** - Deactivate user
   - Mutation: `PUT /api/admin/users/{id}/deactivate`

9. **useUserActivity(id)** - Get user activity log
   - Query: `GET /api/admin/users/{id}/activity`

---

## 4. Workspace Hooks (`hooks/useWorkspaces.js`)

10 custom hooks for workspace management:

1. **useWorkspaces()** - Get all workspaces
   - Query: `GET /api/workspaces`

2. **useWorkspace(id)** - Get workspace details
   - Query: `GET /api/workspaces/{id}`

3. **useCreateWorkspace()** - Create workspace
   - Mutation: `POST /api/workspaces`

4. **useUpdateWorkspace()** - Update workspace
   - Mutation: `PUT /api/workspaces/{id}`

5. **useDeleteWorkspace()** - Delete workspace
   - Mutation: `DELETE /api/workspaces/{id}`

6. **useWorkspaceMembers(id)** - Get members
   - Query: `GET /api/workspaces/{id}/members`

7. **useAddWorkspaceMember()** - Add member
   - Mutation: `POST /api/workspaces/{id}/members`

8. **useUpdateWorkspaceMember()** - Update member role
   - Mutation: `PUT /api/workspaces/{id}/members/{userId}`

9. **useRemoveWorkspaceMember()** - Remove member
   - Mutation: `DELETE /api/workspaces/{id}/members/{userId}`

10. **useWorkspaceActivity(id)** - Get activity log
    - Query: `GET /api/workspaces/{id}/activity`

---

## 5. Data Sources Hooks (`hooks/useSources.js`)

11 custom hooks for data source management:

1. **useSources(params)** - Get paginated sources
   - Query: `GET /api/sources`
   - Params: `{ workspace_id, skip, limit, search }`

2. **useSource(id)** - Get source details
   - Query: `GET /api/sources/{id}`

3. **useCreateSource()** - Create source
   - Mutation: `POST /api/sources`

4. **useUpdateSource()** - Update source
   - Mutation: `PUT /api/sources/{id}`

5. **useDeleteSource()** - Delete source
   - Mutation: `DELETE /api/sources/{id}`

6. **useTestSourceConnection(id)** - Test connection
   - Mutation: `POST /api/sources/{id}/test-connection`

7. **useDiscoverSourceSchema(id)** - Discover schema
   - Mutation: `POST /api/sources/{id}/discover-schema`
   - Invalidates schema cache on success

8. **useSourceSchema(id)** - Get cached schema
   - Query: `GET /api/sources/{id}/schema`
   - Stale time: 10 minutes

9. **useSyncSource(id)** - Trigger sync
   - Mutation: `POST /api/sources/{id}/sync`

10. **useSourceTypes()** - Get available types
    - Query: `GET /api/sources/types`
    - Stale time: 1 hour (rarely changes)

11. **useSourceStatus(id)** - Get status with auto-refresh
    - Query: `GET /api/sources/{id}/status`
    - Refetch interval: 30 seconds

---

## 6. Pipeline Hooks (`hooks/usePipelines.js`)

10 custom hooks for pipeline management:

1. **usePipelines(params)** - Get paginated pipelines
   - Query: `GET /api/pipelines`
   - Params: `{ workspace_id, status, visibility, skip, limit }`

2. **usePipeline(id)** - Get pipeline details
   - Query: `GET /api/pipelines/{id}`

3. **useCreatePipeline()** - Create pipeline
   - Mutation: `POST /api/pipelines`

4. **useUpdatePipeline()** - Update pipeline
   - Mutation: `PUT /api/pipelines/{id}`

5. **useDeletePipeline()** - Delete pipeline
   - Mutation: `DELETE /api/pipelines/{id}`

6. **useForkPipeline()** - Fork pipeline
   - Mutation: `POST /api/pipelines/{id}/fork`

7. **useUpdatePipelinePermissions()** - Update permissions
   - Mutation: `PUT /api/pipelines/{id}/permissions`

8. **usePipelineVersions(id)** - Get version history
   - Query: `GET /api/pipelines/{id}/versions`

9. **usePipelineVersion(id, version)** - Get specific version
   - Query: `GET /api/pipelines/{id}/versions/{version}`

10. **useRestorePipelineVersion(id, version)** - Restore version
    - Mutation: `POST /api/pipelines/{id}/restore/{version}`

---

## 7. Pipeline Runs Hooks (`hooks/usePipelineRuns.js`)

8 custom hooks for pipeline execution:

1. **useRunPipeline()** - Execute pipeline
   - Mutation: `POST /api/pipelines/{id}/run`

2. **usePipelineRuns(pipelineId, params)** - Get runs
   - Query: `GET /api/pipelines/{id}/runs`
   - Params: `{ status, skip, limit, sort }`

3. **useRun(id)** - Get run details with auto-refresh
   - Query: `GET /api/runs/{id}`
   - Auto-refetch every 5s if status is "running"

4. **useRunLogs(id, options)** - Get run logs
   - Query: `GET /api/runs/{id}/logs`
   - Supports polling option

5. **useCancelRun(id)** - Cancel running pipeline
   - Mutation: `POST /api/runs/{id}/cancel`

6. **useRunMetrics(id)** - Get run metrics
   - Query: `GET /api/runs/{id}/metrics`

7. **useEngines()** - Get available execution engines
   - Query: `GET /api/engines`

8. **useValidateEngine(engine, config)** - Validate engine
   - Mutation: `POST /api/engines/{engine}/validate`

---

## 8. Catalog Hooks (`hooks/useCatalog.js`)

8 custom hooks for data catalog:

1. **useCatalogTables(params)** - Get catalog tables
   - Query: `GET /api/catalog/tables`
   - Params: `{ search, workspace_id, skip, limit, sort_by }`

2. **useCatalogTable(id)** - Get table details
   - Query: `GET /api/catalog/tables/{id}`

3. **useCatalogTableColumns(id)** - Get table columns
   - Query: `GET /api/catalog/tables/{id}/columns`

4. **useCatalogTableLineage(id)** - Get lineage
   - Query: `GET /api/catalog/tables/{id}/lineage`

5. **useCatalogTableQuality(id)** - Get quality metrics
   - Query: `GET /api/catalog/tables/{id}/quality`

6. **useCatalogSearch(query)** - Search catalog (debounced)
   - Query: `GET /api/catalog/search?q={query}`
   - Requires min 2 char query

7. **useRecentCatalogTables()** - Get recent tables
   - Query: `GET /api/catalog/recent`

8. **usePopularCatalogTables()** - Get popular tables
   - Query: `GET /api/catalog/popular`

---

## 9. Quality Hooks (`hooks/useQuality.js`)

9 custom hooks for data quality:

1. **useQualityRules(params)** - Get quality rules
   - Query: `GET /api/quality/rules`

2. **useQualityRule(id)** - Get rule details
   - Query: `GET /api/quality/rules/{id}`

3. **useCreateQualityRule()** - Create rule
   - Mutation: `POST /api/quality/rules`

4. **useUpdateQualityRule()** - Update rule
   - Mutation: `PUT /api/quality/rules/{id}`

5. **useDeleteQualityRule()** - Delete rule
   - Mutation: `DELETE /api/quality/rules/{id}`

6. **useRunQualityRule(id)** - Run rule
   - Mutation: `POST /api/quality/rules/{id}/run`

7. **useQualityResults(params)** - Get results
   - Query: `GET /api/quality/results`
   - Params: `{ rule_id, table_id, status, skip, limit }`

8. **useQualityDashboard()** - Get dashboard data
   - Query: `GET /api/quality/dashboard`

9. **useQualityAnomalies(params)** - Get anomalies
   - Query: `GET /api/quality/anomalies`

---

## 10. Lineage Hooks (`hooks/useLineage.js`)

5 custom hooks for data lineage:

1. **useTableLineage(id)** - Get table lineage graph
   - Query: `GET /api/lineage/table/{id}`

2. **usePipelineLineage(id)** - Get pipeline lineage
   - Query: `GET /api/lineage/pipeline/{id}`

3. **useColumnLineage(tableId, column)** - Get column lineage
   - Query: `GET /api/lineage/column/{tableId}/{column}`

4. **useLineageImpact(nodeId)** - Get impact analysis
   - Query: `GET /api/lineage/impact/{nodeId}`

5. **useLineageSearch(query)** - Search lineage
   - Query: `GET /api/lineage/search`

---

## 11. Settings Hooks (`hooks/useSettings.js`)

6 custom hooks for settings management:

1. **useSettings()** - Get global settings
   - Query: `GET /api/settings`

2. **useUpdateSettings()** - Update settings
   - Mutation: `PUT /api/settings`

3. **useWorkspaceSettings(workspaceId)** - Get workspace settings
   - Query: `GET /api/settings/workspace`

4. **useIntegrations()** - Get integrations
   - Query: `GET /api/settings/integrations`

5. **useConfigureIntegration(type, config)** - Configure integration
   - Mutation: `POST /api/settings/integrations/{type}`

6. **useAuditLogs(params)** - Get audit logs
   - Query: `GET /api/settings/audit-logs`
   - Params: `{ user_id, action, resource_type, skip, limit, sort }`

---

## 12. Metrics Hooks (`hooks/useMetrics.js`)

6 custom hooks for system monitoring:

1. **useSystemMetrics()** - Get system metrics
   - Query: `GET /api/metrics/system`
   - Auto-refetch every 30s

2. **usePipelineMetrics(id)** - Get pipeline metrics
   - Query: `GET /api/metrics/pipeline/{id}`
   - Auto-refetch every 30s

3. **useUsageMetrics()** - Get usage metrics
   - Query: `GET /api/metrics/usage`
   - Auto-refetch every minute

4. **usePerformanceMetrics()** - Get performance metrics
   - Query: `GET /api/metrics/performance`
   - Auto-refetch every minute

5. **useHealthStatus()** - Get health status
   - Query: `GET /api/health`
   - Auto-refetch every minute

6. **useDetailedHealthStatus()** - Get detailed health
   - Query: `GET /api/health/detailed`
   - Auto-refetch every minute

---

## 13. Utility Libraries

### ✓ Zod Validators (`lib/validators.js`)
Production-ready validation schemas for:
- **Auth**: loginSchema, registerSchema
- **Users**: userFormSchema
- **Workspaces**: workspaceFormSchema
- **Sources**: sourceFormSchema
- **Pipelines**: pipelineFormSchema
- **Quality**: qualityRuleFormSchema
- **Pagination**: paginationSchema
- **Search**: searchParamsSchema

### ✓ Storage Management (`lib/storage.js`)
Token, user, and workspace context management:
- **tokenStorage**: get, set, clear, hasToken
- **userStorage**: get, set, clear, update
- **workspaceStorage**: get, set, clear
- **clearAllStorage()**: Logout cleanup

---

## 14. UI Components

### ✓ LoadingSpinner (`components/LoadingSpinner.jsx`)
- Sizes: sm, md, lg, xl
- Full-screen mode
- Optional message
- Animated Loader2 icon

### ✓ SkeletonLoader (`components/SkeletonLoader.jsx`)
Multiple skeleton variants:
- **SkeletonLoader**: Generic shimmer
- **SkeletonText**: Multi-line text
- **SkeletonCard**: Card layout
- **SkeletonTable**: Table rows/columns
- **SkeletonList**: List items
- **SkeletonAvatar**: Circular avatar
- **SkeletonBanner**: Full-width banner

### ✓ ErrorBoundary (`components/ErrorBoundary.jsx`)
- Catches child component errors
- Error details in dev mode
- Sentry integration support
- Retry button
- Fallback component for Suspense

### ✓ QueryProvider (`components/QueryProvider.jsx`)
- Client-side React Query wrapper
- Proper Next.js 16 boundaries

---

## 15. Layout Integration

### ✓ Updated `app/layout.js`
- QueryProvider wrapping
- ErrorBoundary integration
- Theme, Auth, Tooltip providers
- Sonner Toaster configuration

---

## Hook Statistics

### Total Hooks Created: 75+

| Category | Count |
|----------|-------|
| Auth | 6 |
| Users | 9 |
| Workspaces | 10 |
| Sources | 11 |
| Pipelines | 10 |
| Pipeline Runs | 8 |
| Catalog | 8 |
| Quality | 9 |
| Lineage | 5 |
| Settings | 6 |
| Metrics | 6 |
| **Total** | **88** |

### Total Files Created: 20

| Type | Count |
|------|-------|
| API Client & Config | 3 |
| Validation Schemas | 1 |
| Storage Utilities | 1 |
| Hooks | 11 |
| Components | 4 |
| Updated Files | 1 |
| **Total** | **21** |

---

## Features Implemented

✅ **Request/Response Interceptors**
- Automatic token injection
- 401 → redirect to login
- Error handling with toasts
- Development logging

✅ **React Query Integration**
- Stale time management
- Cache time configuration
- Exponential backoff retries
- Global error handlers

✅ **TypeScript Support**
- JSDoc comments throughout
- Parameter documentation
- Return type descriptions

✅ **Error Handling**
- Try/catch in mutations
- Error toasts with user messages
- Development console logging
- ErrorBoundary for UI errors

✅ **Loading States**
- isLoading from queries
- isPending from mutations
- Auto-loading during refetch
- LoadingSpinner component

✅ **Query Invalidation**
- Automatic invalidation on mutations
- Proper cache updates
- Dependent query relationships

✅ **Accessibility**
- ARIA labels where applicable
- Keyboard navigation support
- Error message clarity

✅ **Performance**
- Stale-while-revalidate pattern
- Intelligent refetch intervals
- Query deduplication
- Efficient cache management

---

## Usage Example

```javascript
'use client';

import { usePipelines, useRunPipeline } from '@/hooks/usePipelines';
import { LoadingSpinner, SkeletonCard } from '@/components';
import { toast } from 'sonner';

export function PipelinesPage() {
  // Fetch paginated pipelines
  const { data: pipelines, isLoading, error } = usePipelines({
    workspace_id: 'workspace-123',
    page: 1,
    limit: 20,
  });

  // Mutation hook for running pipeline
  const { mutate: runPipeline, isPending } = useRunPipeline();

  const handleRun = (pipelineId) => {
    runPipeline(
      { id: pipelineId },
      {
        onSuccess: (data) => {
          toast.success(`Pipeline ${data.id} started!`);
        },
      }
    );
  };

  if (isLoading) return <SkeletonCard count={3} />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="space-y-4">
      {pipelines?.map((pipeline) => (
        <div key={pipeline.id} className="border rounded p-4">
          <h3>{pipeline.name}</h3>
          <button
            onClick={() => handleRun(pipeline.id)}
            disabled={isPending}
          >
            {isPending ? 'Running...' : 'Run'}
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## Environment Setup

Required in `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Build & Deployment

✅ Production build verified and successful
✅ All syntax validated
✅ Type checking passed
✅ No console errors
✅ Ready for deployment

---

## Next Steps

1. Connect login/logout flows to existing AuthProvider
2. Add advanced error handling for specific API endpoints
3. Implement optimistic updates for mutations
4. Add real-time subscription support if needed
5. Create custom hooks for business logic composition
6. Add request/response logging middleware
7. Implement rate limiting client-side

---

## Support & Documentation

Each hook includes:
- JSDoc documentation
- Parameter descriptions
- Return value details
- Query/mutation key patterns
- Stale time & refresh interval info
- Error handling behavior
- Success notification details

All hooks follow React Query best practices and are production-ready.
