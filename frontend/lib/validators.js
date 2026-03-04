import { z } from 'zod';

/**
 * Zod validation schemas for all forms in the application
 */

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// User management schemas
export const userFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['admin', 'user'], { message: 'Invalid role' }),
  status: z.enum(['active', 'inactive'], { message: 'Invalid status' }).optional(),
});

// Workspace schemas
export const workspaceFormSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(255),
  description: z.string().max(1000).optional(),
});

// Source schemas
export const sourceFormSchema = z.object({
  name: z.string().min(1, 'Source name is required').max(255),
  type: z.enum([
    'postgres',
    'mysql',
    'snowflake',
    'bigquery',
    'redshift',
    'azure_sql',
    'oracle',
    'mongodb',
    'elasticsearch',
    'api',
    'csv',
    'parquet',
  ], { message: 'Invalid source type' }),
  connectionDetails: z.record(z.any()).optional(),
  description: z.string().max(1000).optional(),
});

// Pipeline schemas
export const pipelineFormSchema = z.object({
  name: z.string().min(1, 'Pipeline name is required').max(255),
  description: z.string().max(1000).optional(),
  config: z.record(z.any()).optional(),
  workspace_id: z.string().uuid('Invalid workspace ID'),
});

// Quality rule schemas
export const qualityRuleFormSchema = z.object({
  name: z.string().min(1, 'Rule name is required').max(255),
  type: z.enum([
    'null_check',
    'uniqueness',
    'pattern_match',
    'range_check',
    'threshold',
    'custom',
  ], { message: 'Invalid rule type' }),
  configuration: z.record(z.any()),
  description: z.string().max(1000).optional(),
  workspace_id: z.string().uuid('Invalid workspace ID'),
});

// Pagination schemas
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  skip: z.number().min(0).default(0),
});

// Search and filter schemas
export const searchParamsSchema = z.object({
  q: z.string().optional(),
  search: z.string().optional(),
  workspace_id: z.string().uuid().optional(),
  status: z.string().optional(),
  role: z.string().optional(),
  sort_by: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export default {
  loginSchema,
  registerSchema,
  userFormSchema,
  workspaceFormSchema,
  sourceFormSchema,
  pipelineFormSchema,
  qualityRuleFormSchema,
  paginationSchema,
  searchParamsSchema,
};
