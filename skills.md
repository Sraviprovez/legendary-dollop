# SynKrasis.ai - Skills & Context for AI Agents

## Project Overview
SynKrasis.ai is an open-source data platform for ETL/ELT, data migration, and transformation. It supports multiple execution engines (dbt, PySpark, Databricks, AWS Glue) and provides a visual DAG builder.

## Tech Stack
- **Frontend**: Next.js 14, React, TailwindCSS, shadcn/ui
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL, Redis
- **Orchestration**: Airflow (production), Celery (interactive)
- **Ingestion**: Airbyte (open source)
- **Auth**: JWT with role-based access control

## Repository Structure (Monorepo)
```
/
├── frontend/          # Next.js application
│   ├── app/          # Pages (Next.js App Router)
│   ├── components/   # React components
│   ├── lib/          # Utilities, stores, API clients
│   └── public/       # Static assets
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── api/      # API routes
│   │   ├── core/     # Core services (Airbyte, etc.)
│   │   ├── models/   # SQLAlchemy models
│   │   └── providers/ # Engine providers
│   └── requirements.txt
├── infrastructure/    # Docker, deployment configs
└── shared/           # Shared types/constants
```

## Database Schema (Key Tables)

### users
- id (UUID, PK)
- email (string, unique)
- password_hash (string)
- role (enum: 'admin', 'data_engineer', 'developer', 'analyst', 'devops')
- created_by (UUID, FK to users)
- is_active (boolean)

### workspaces
- id (UUID, PK)
- name (string)
- created_by (UUID, FK)

### workspace_members
- workspace_id (UUID, FK)
- user_id (UUID, FK)
- role (enum: 'admin', 'editor', 'viewer')

### pipelines
- id (UUID, PK)
- name (string)
- workspace_id (UUID, FK)
- created_by (UUID, FK)
- config (JSON)  # nodes, edges
- is_private (boolean)
- version (int)

### sources
- id (UUID, PK)
- name (string)
- type (enum)
- connection_details (JSON, encrypted)
- workspace_id (UUID, FK)
- schema_cache (JSON)

## Key APIs (to implement first)

### Auth
- `POST /api/auth/login` - JWT authentication
- `POST /api/auth/register` - First user only
- `GET /api/auth/me` - Current user

### Users (admin only)
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/{id}` - Update user

### Sources
- `GET /api/sources` - List sources user can access
- `POST /api/sources` - Create source (stores in DB + Airbyte)
- `POST /api/sources/{id}/test-connection` - Test connectivity

### Pipelines
- `GET /api/pipelines` - List pipelines
- `POST /api/pipelines` - Save canvas
- `POST /api/pipelines/{id}/run` - Execute pipeline

## Airbyte Integration
Airbyte runs as a separate container. The backend communicates via its REST API at `http://airbyte-server:8001/api/v1`. All source/destination creation should be synced between our DB and Airbyte.

## Environment Variables
```bash
# Backend (.env)
DATABASE_URL=postgresql://user:pass@postgres:5432/synkrasis
REDIS_URL=redis://redis:6379
JWT_SECRET=your-secret-key
AIRBYTE_API_URL=http://airbyte-server:8001/api/v1

# First admin user (created on first run)
ADMIN_EMAIL=admin@synkrasis.ai
ADMIN_PASSWORD=changeme123

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Role Definitions
- **Admin**: Full system access, user management, workspace creation
- **Data Engineer**: Create/edit pipelines, manage sources, transformations
- **Developer**: Create/edit transformations, view pipelines
- **Analyst**: View catalog, lineage, run existing pipelines
- **DevOps**: Manage sources, connections, monitor jobs

## Permission Rules
- By default, all pipelines/sources are visible to everyone in the workspace
- Users can mark items as "private" (only visible to them)
- Admins can grant specific users/roles access to private items
- Each workspace is isolated (users only see their workspace)

## First-Run Behavior
When the application starts with empty database:
1. Create admin user from env vars (ADMIN_EMAIL/ADMIN_PASSWORD)
2. Create default workspace for admin
3. Seed initial data if needed

## Testing Credentials
- Admin: admin@synkrasis.ai / changeme123
- Data Engineer: engineer@synkrasis.ai / changeme123
- Developer: dev@synkrasis.ai / changeme123

## Coding Standards
- Python: Black formatter, type hints required
- JavaScript: Prettier, ESLint
- All API responses should follow { success: boolean, data: any, error: string }
- JWT tokens in Authorization: Bearer <token>
- Passwords must be bcrypt hashed
