"""
Pydantic schemas for request/response validation across all APIs.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Any, Dict
from datetime import datetime
from uuid import UUID

# ==================== PAGINATION & COMMON ====================

class PaginationMeta(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int

class SuccessResponse(BaseModel):
    success: bool = True
    data: Any
    meta: Optional[PaginationMeta] = None

# ==================== USER & AUTH ====================

class UserCreate(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    role: str = "developer"

class UserUpdate(BaseModel):
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(BaseModel):
    id: UUID
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class UserActivityResponse(BaseModel):
    id: UUID
    email: str
    last_login: Optional[datetime] = None
    created_at: datetime
    login_count: int = 0

# ==================== WORKSPACE ====================

class WorkspaceMemberCreate(BaseModel):
    user_id: UUID
    role: str = "viewer"

class WorkspaceMemberUpdate(BaseModel):
    role: str

class WorkspaceMemberResponse(BaseModel):
    user_id: UUID
    workspace_id: UUID
    role_in_workspace: str
    joined_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = None

class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    settings: Optional[Dict] = None

class WorkspaceResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    created_by: UUID
    created_at: datetime
    settings: Optional[Dict] = None
    member_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)

# ==================== SOURCE ====================

class SourceCreate(BaseModel):
    name: str
    type: str
    connection_details: Dict[str, Any]
    is_private: bool = False

class SourceUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    connection_details: Optional[Dict[str, Any]] = None
    is_private: Optional[bool] = None

class SourceResponse(BaseModel):
    id: UUID
    name: str
    type: str
    workspace_id: UUID
    created_by: UUID
    created_at: datetime
    is_private: bool
    schema_cache: Optional[Dict] = None
    airbyte_source_id: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class SourceStatusResponse(BaseModel):
    source_id: UUID
    status: str
    last_sync: Optional[datetime] = None
    tables_count: int = 0
    columns_count: int = 0

class TestConnectionRequest(BaseModel):
    connection_details: Dict[str, Any]

class DiscoverSchemaRequest(BaseModel):
    pass

# ==================== PIPELINE ====================

class PipelineCreate(BaseModel):
    name: str
    config: Dict[str, Any]  # nodes and edges
    visibility: str = "workspace"
    is_private: bool = False

class PipelineUpdate(BaseModel):
    name: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    visibility: Optional[str] = None
    is_private: Optional[bool] = None

class PipelineResponse(BaseModel):
    id: UUID
    name: str
    workspace_id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    config: Dict[str, Any]
    version: str
    is_private: bool
    visibility: str
    
    model_config = ConfigDict(from_attributes=True)

class PipelineForkRequest(BaseModel):
    new_name: str

class PipelineVersionResponse(BaseModel):
    id: UUID
    pipeline_id: UUID
    version: str
    config: Dict[str, Any]
    created_by: UUID
    created_at: datetime
    description: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class PipelinePermissionUpdate(BaseModel):
    user_id: Optional[UUID] = None
    role: Optional[str] = None
    role_type: Optional[str] = None  # user or role

class PipelineRunCreate(BaseModel):
    pass

class PipelineRunResponse(BaseModel):
    id: UUID
    pipeline_id: UUID
    status: str
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    created_at: datetime
    created_by: UUID
    error_message: Optional[str] = None
    metrics: Optional[Dict] = None
    
    model_config = ConfigDict(from_attributes=True)

class PipelineRunMetricsResponse(BaseModel):
    run_id: UUID
    pipeline_id: UUID
    status: str
    duration_seconds: Optional[float] = None
    rows_processed: Optional[int] = None
    errors: Optional[int] = None
    metrics: Optional[Dict] = None

# ==================== CATALOG ====================

class CatalogEntryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    table_type: Optional[str] = None
    source_id: Optional[str] = None
    schema_name: Optional[str] = None

class CatalogEntryResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    name: str
    description: Optional[str] = None
    table_type: Optional[str] = None
    source_id: Optional[UUID] = None
    schema_name: Optional[str] = None
    row_count: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    metadata: Optional[Dict] = None
    
    model_config = ConfigDict(from_attributes=True)

class ColumnInfo(BaseModel):
    name: str
    data_type: str
    nullable: bool = True
    description: Optional[str] = None

class CatalogTableDetailResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    columns: List[ColumnInfo]
    row_count: Optional[str] = None
    created_at: datetime
    metadata: Optional[Dict] = None

# ==================== QUALITY ====================

class QualityRuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    rule_type: str
    config: Dict[str, Any]
    enabled: bool = True

class QualityRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    rule_type: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    enabled: Optional[bool] = None

class QualityRuleResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    name: str
    description: Optional[str] = None
    rule_type: str
    config: Dict[str, Any]
    created_by: UUID
    created_at: datetime
    enabled: bool
    
    model_config = ConfigDict(from_attributes=True)

class QualityResultResponse(BaseModel):
    id: UUID
    quality_rule_id: UUID
    catalog_entry_id: UUID
    status: str
    result: Dict[str, Any]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class QualityDashboardResponse(BaseModel):
    total_rules: int
    total_checks: int
    passed_checks: int
    warning_checks: int
    failed_checks: int
    pass_rate: float
    recent_results: List[QualityResultResponse]

class AnomalyResponse(BaseModel):
    id: UUID
    catalog_entry_id: UUID
    anomaly_type: str
    severity: str
    description: str
    detected_at: datetime

# ==================== LINEAGE ====================

class LineageNodeResponse(BaseModel):
    id: UUID
    name: str
    type: str
    workspace_id: Optional[UUID] = None

class LineageEdgeResponse(BaseModel):
    source_id: UUID
    target_id: UUID
    relationship: str

class LineageGraphResponse(BaseModel):
    nodes: List[LineageNodeResponse]
    edges: List[LineageEdgeResponse]

class ColumnLineageResponse(BaseModel):
    table_id: UUID
    column_name: str
    lineage: LineageGraphResponse

class ImpactAnalysisResponse(BaseModel):
    node_id: UUID
    downstream_nodes: List[LineageNodeResponse]
    affected_pipelines: List[UUID]
    affected_tables: List[UUID]

# ==================== SETTINGS ====================

class SettingCreate(BaseModel):
    key: str
    value: Any

class SettingUpdate(BaseModel):
    value: Any

class SettingResponse(BaseModel):
    id: UUID
    key: str
    value: Any
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class IntegrationConfig(BaseModel):
    type: str
    config: Dict[str, Any]

class AuditLogResponse(BaseModel):
    id: UUID
    user_id: UUID
    workspace_id: Optional[UUID] = None
    action: str
    resource_type: str
    resource_id: Optional[UUID] = None
    details: Optional[Dict] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# ==================== METRICS ====================

class SystemMetricsResponse(BaseModel):
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    active_users: int
    total_pipelines: int
    total_sources: int
    timestamp: datetime

class PipelineMetricsResponse(BaseModel):
    pipeline_id: UUID
    total_runs: int
    successful_runs: int
    failed_runs: int
    average_duration: float
    last_run: Optional[datetime] = None

class UsageMetricsResponse(BaseModel):
    total_users: int
    total_workspaces: int
    total_pipelines: int
    total_sources: int
    total_runs: int
    period: str  # daily, weekly, monthly

class PerformanceMetricsResponse(BaseModel):
    avg_pipeline_duration: float
    p95_pipeline_duration: float
    p99_pipeline_duration: float
    total_data_processed: str
    failed_run_rate: float

class HealthDetailedResponse(BaseModel):
    status: str
    database: str
    cache: str
    message_queue: str
    timestamp: datetime
