"""
Metrics and Monitoring API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
import uuid
from datetime import datetime

from app.api.deps import get_current_active_user, require_admin
from app.core.database import get_db
from app.models.base import (
    User, Pipeline, PipelineRun, Workspace, WorkspaceMember,
    Source, CatalogEntry
)
from app.schemas import (
    SystemMetricsResponse, PipelineMetricsResponse, UsageMetricsResponse,
    PerformanceMetricsResponse, HealthDetailedResponse, SuccessResponse
)

router = APIRouter(prefix="/metrics", tags=["metrics"])

# ==================== SYSTEM METRICS ====================

@router.get("/system", response_model=SuccessResponse)
async def get_system_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Get system-wide metrics (admin only)."""
    # Count active users (active in last 30 days)
    # TODO: Implement based on login activity
    active_users = db.query(User).filter(User.is_active == True).count()
    
    # Count pipelines, sources, etc.
    total_pipelines = db.query(Pipeline).count()
    total_sources = db.query(Source).count()
    
    metrics = SystemMetricsResponse(
        cpu_usage=0.0,  # TODO: Implement actual monitoring
        memory_usage=0.0,
        disk_usage=0.0,
        active_users=active_users,
        total_pipelines=total_pipelines,
        total_sources=total_sources,
        timestamp=datetime.utcnow()
    )
    
    return {
        "success": True,
        "data": metrics
    }

# ==================== PIPELINE METRICS ====================

@router.get("/pipeline/{pipeline_id}", response_model=SuccessResponse)
async def get_pipeline_metrics(
    pipeline_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get metrics for a specific pipeline."""
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == pipeline.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get run statistics
    runs = db.query(PipelineRun).filter(PipelineRun.pipeline_id == pipeline_id).all()
    total_runs = len(runs)
    successful_runs = sum(1 for r in runs if r.status == "success")
    failed_runs = sum(1 for r in runs if r.status == "failed")
    
    # Calculate average duration
    durations = []
    for run in runs:
        if run.started_at and run.ended_at:
            duration = (run.ended_at - run.started_at).total_seconds()
            durations.append(duration)
    
    avg_duration = sum(durations) / len(durations) if durations else 0.0
    
    # Get last run
    last_run = None
    if runs:
        last_run_obj = max(runs, key=lambda r: r.created_at)
        last_run = last_run_obj.created_at
    
    metrics = PipelineMetricsResponse(
        pipeline_id=str(pipeline_id),
        total_runs=total_runs,
        successful_runs=successful_runs,
        failed_runs=failed_runs,
        average_duration=avg_duration,
        last_run=last_run
    )
    
    return {
        "success": True,
        "data": metrics
    }

# ==================== USAGE METRICS ====================

@router.get("/usage", response_model=SuccessResponse)
async def get_usage_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    period: Optional[str] = Query("daily"),  # daily, weekly, monthly
):
    """Get usage metrics."""
    total_users = db.query(User).count()
    total_workspaces = db.query(Workspace).count()
    total_pipelines = db.query(Pipeline).count()
    total_sources = db.query(Source).count()
    total_runs = db.query(PipelineRun).count()
    
    metrics = UsageMetricsResponse(
        total_users=total_users,
        total_workspaces=total_workspaces,
        total_pipelines=total_pipelines,
        total_sources=total_sources,
        total_runs=total_runs,
        period=period
    )
    
    return {
        "success": True,
        "data": metrics
    }

# ==================== PERFORMANCE METRICS ====================

@router.get("/performance", response_model=SuccessResponse)
async def get_performance_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    time_range: Optional[str] = Query("7d"),  # 1d, 7d, 30d
):
    """Get performance metrics (admin only)."""
    # Get all runs
    runs = db.query(PipelineRun).all()
    
    # Calculate durations
    durations = []
    for run in runs:
        if run.started_at and run.ended_at:
            duration = (run.ended_at - run.started_at).total_seconds()
            durations.append(duration)
    
    # Calculate percentiles
    if durations:
        durations.sort()
        p95_idx = int(len(durations) * 0.95)
        p99_idx = int(len(durations) * 0.99)
        
        avg_duration = sum(durations) / len(durations)
        p95_duration = durations[p95_idx] if p95_idx < len(durations) else avg_duration
        p99_duration = durations[p99_idx] if p99_idx < len(durations) else avg_duration
    else:
        avg_duration = 0.0
        p95_duration = 0.0
        p99_duration = 0.0
    
    # Calculate failure rate
    total_runs = len(runs)
    failed_runs = sum(1 for r in runs if r.status == "failed")
    failed_rate = (failed_runs / total_runs) if total_runs > 0 else 0.0
    
    metrics = PerformanceMetricsResponse(
        avg_pipeline_duration=avg_duration,
        p95_pipeline_duration=p95_duration,
        p99_pipeline_duration=p99_duration,
        total_data_processed="0 GB",  # TODO: Track actual data volume
        failed_run_rate=failed_rate
    )
    
    return {
        "success": True,
        "data": metrics
    }

# ==================== HEALTH CHECK ====================

@router.get("/health/detailed", response_model=SuccessResponse)
async def get_detailed_health(
    db: Session = Depends(get_db),
):
    """Get detailed health status of all system components."""
    
    db_status = "healthy"
    cache_status = "healthy"
    message_queue_status = "healthy"
    
    try:
        # Test database connection
        db.execute("SELECT 1")
    except Exception as e:
        db_status = "unhealthy"
    
    # TODO: Test cache (Redis)
    # TODO: Test message queue (Celery/RabbitMQ)
    
    health = HealthDetailedResponse(
        status="healthy" if all([s == "healthy" for s in [db_status, cache_status, message_queue_status]]) else "unhealthy",
        database=db_status,
        cache=cache_status,
        message_queue=message_queue_status,
        timestamp=datetime.utcnow()
    )
    
    return {
        "success": True,
        "data": health
    }

# ==================== WORKSPACE METRICS ====================

@router.get("/workspace/{workspace_id}", response_model=SuccessResponse)
async def get_workspace_metrics(
    workspace_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get metrics for a specific workspace."""
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get workspace statistics
    pipelines = db.query(Pipeline).filter(Pipeline.workspace_id == workspace_id).count()
    sources = db.query(Source).filter(Source.workspace_id == workspace_id).count()
    members = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == workspace_id).count()
    tables = db.query(CatalogEntry).filter(CatalogEntry.workspace_id == workspace_id).count()
    
    return {
        "success": True,
        "data": {
            "workspace_id": str(workspace_id),
            "pipelines": pipelines,
            "sources": sources,
            "members": members,
            "tables": tables
        }
    }
