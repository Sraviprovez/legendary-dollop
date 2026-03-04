"""
Pipeline Management and Execution API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.base import (
    User, Workspace, Pipeline, PipelineVersion, PipelineRun, 
    WorkspaceMember, PipelinePermission, AuditLog
)
from app.schemas import (
    PipelineCreate, PipelineUpdate, PipelineResponse, PipelineVersionResponse,
    PipelineForkRequest, PipelineRunCreate, PipelineRunResponse,
    PipelineRunMetricsResponse, SuccessResponse
)

router = APIRouter(prefix="/pipelines", tags=["pipelines"])

# ==================== PIPELINE MANAGEMENT ====================

@router.get("", response_model=SuccessResponse)
async def list_pipelines(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    workspace_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    visibility: Optional[str] = None,
    created_by: Optional[str] = None,
):
    """List pipelines with filters."""
    query = db.query(Pipeline)
    
    # Filter by workspace
    if workspace_id:
        ws_uuid = uuid.UUID(workspace_id)
        query = query.filter(Pipeline.workspace_id == ws_uuid)
        
        # Check access
        member = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == ws_uuid,
            WorkspaceMember.user_id == current_user.id
        ).first()
        if not member and current_user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    if visibility:
        query = query.filter(Pipeline.visibility == visibility)
    
    if created_by:
        query = query.filter(Pipeline.created_by == uuid.UUID(created_by))
    
    total = query.count()
    pipelines = query.offset(skip).limit(limit).all()
    
    return {
        "success": True,
        "data": [PipelineResponse.from_orm(p) for p in pipelines],
        "meta": {
            "page": skip // limit + 1 if limit > 0 else 1,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit if limit > 0 else 0
        }
    }

@router.post("", response_model=SuccessResponse)
async def create_pipeline(
    pipeline_data: PipelineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    workspace_id: str = Query(...),
):
    """Create a new pipeline."""
    ws_uuid = uuid.UUID(workspace_id)
    workspace = db.query(Workspace).filter(Workspace.id == ws_uuid).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == ws_uuid,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    new_pipeline = Pipeline(
        name=pipeline_data.name,
        workspace_id=ws_uuid,
        created_by=current_user.id,
        config=pipeline_data.config,
        visibility=pipeline_data.visibility,
        is_private=pipeline_data.is_private,
        version="1"
    )
    db.add(new_pipeline)
    db.commit()
    db.refresh(new_pipeline)
    
    # Create version 1
    version = PipelineVersion(
        pipeline_id=new_pipeline.id,
        version="1",
        config=pipeline_data.config,
        created_by=current_user.id,
        description="Initial version"
    )
    db.add(version)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        workspace_id=ws_uuid,
        action="create",
        resource_type="pipeline",
        resource_id=new_pipeline.id,
        details={"name": pipeline_data.name}
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "data": PipelineResponse.from_orm(new_pipeline)
    }

@router.get("/{pipeline_id}", response_model=SuccessResponse)
async def get_pipeline(
    pipeline_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get pipeline details."""
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
    if not member and current_user.role.value != "admin" and pipeline.visibility != "public":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return {
        "success": True,
        "data": PipelineResponse.from_orm(pipeline)
    }

@router.put("/{pipeline_id}", response_model=SuccessResponse)
async def update_pipeline(
    pipeline_id: uuid.UUID,
    pipeline_data: PipelineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update pipeline."""
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline not found"
        )
    
    # Check access (only creator or workspace admin)
    if pipeline.created_by != current_user.id and current_user.role.value != "admin":
        member = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == pipeline.workspace_id,
            WorkspaceMember.user_id == current_user.id
        ).first()
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    # Update fields
    if pipeline_data.name:
        pipeline.name = pipeline_data.name
    if pipeline_data.config:
        pipeline.config = pipeline_data.config
    if pipeline_data.visibility:
        pipeline.visibility = pipeline_data.visibility
    if pipeline_data.is_private is not None:
        pipeline.is_private = pipeline_data.is_private
    
    pipeline.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(pipeline)
    
    # Create new version if config changed
    if pipeline_data.config:
        latest_version = db.query(PipelineVersion).filter(
            PipelineVersion.pipeline_id == pipeline_id
        ).order_by(PipelineVersion.version.desc()).first()
        next_version = str(int(latest_version.version) + 1) if latest_version else "2"
        
        version = PipelineVersion(
            pipeline_id=pipeline_id,
            version=next_version,
            config=pipeline_data.config,
            created_by=current_user.id,
            description="Update"
        )
        db.add(version)
        pipeline.version = next_version
        db.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        workspace_id=pipeline.workspace_id,
        action="update",
        resource_type="pipeline",
        resource_id=pipeline_id,
        details=pipeline_data.dict(exclude_unset=True)
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "data": PipelineResponse.from_orm(pipeline)
    }

@router.delete("/{pipeline_id}", response_model=SuccessResponse)
async def delete_pipeline(
    pipeline_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete pipeline."""
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline not found"
        )
    
    # Check access (only creator or admin)
    if pipeline.created_by != current_user.id and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    workspace_id = pipeline.workspace_id
    db.delete(pipeline)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        workspace_id=workspace_id,
        action="delete",
        resource_type="pipeline",
        resource_id=pipeline_id,
        details={"name": pipeline.name}
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "data": {"message": "Pipeline deleted successfully"}
    }

# ==================== PIPELINE VERSIONING ====================

@router.post("/{pipeline_id}/fork", response_model=SuccessResponse)
async def fork_pipeline(
    pipeline_id: uuid.UUID,
    fork_data: PipelineForkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Fork a pipeline."""
    original = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not original:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == original.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Create fork
    forked = Pipeline(
        name=fork_data.new_name,
        workspace_id=original.workspace_id,
        created_by=current_user.id,
        config=original.config,
        visibility=original.visibility,
        is_private=original.is_private,
        version="1"
    )
    db.add(forked)
    db.commit()
    db.refresh(forked)
    
    # Create version 1
    version = PipelineVersion(
        pipeline_id=forked.id,
        version="1",
        config=original.config,
        created_by=current_user.id,
        description=f"Forked from {original.name}"
    )
    db.add(version)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        workspace_id=original.workspace_id,
        action="fork",
        resource_type="pipeline",
        resource_id=forked.id,
        details={"original_id": str(original.id), "new_name": fork_data.new_name}
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "data": PipelineResponse.from_orm(forked)
    }

@router.get("/{pipeline_id}/versions", response_model=SuccessResponse)
async def list_pipeline_versions(
    pipeline_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all versions of a pipeline."""
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
    
    versions = db.query(PipelineVersion).filter(
        PipelineVersion.pipeline_id == pipeline_id
    ).order_by(PipelineVersion.version.desc()).all()
    
    return {
        "success": True,
        "data": [PipelineVersionResponse.from_orm(v) for v in versions]
    }

@router.get("/{pipeline_id}/versions/{version}", response_model=SuccessResponse)
async def get_pipeline_version(
    pipeline_id: uuid.UUID,
    version: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get specific pipeline version."""
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
    
    pv = db.query(PipelineVersion).filter(
        PipelineVersion.pipeline_id == pipeline_id,
        PipelineVersion.version == version
    ).first()
    if not pv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Version not found"
        )
    
    return {
        "success": True,
        "data": PipelineVersionResponse.from_orm(pv)
    }

@router.post("/{pipeline_id}/restore/{version}", response_model=SuccessResponse)
async def restore_pipeline_version(
    pipeline_id: uuid.UUID,
    version: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Restore a previous pipeline version."""
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline not found"
        )
    
    # Check access (only creator)
    if pipeline.created_by != current_user.id and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    pv = db.query(PipelineVersion).filter(
        PipelineVersion.pipeline_id == pipeline_id,
        PipelineVersion.version == version
    ).first()
    if not pv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Version not found"
        )
    
    # Restore config
    pipeline.config = pv.config
    pipeline.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(pipeline)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        workspace_id=pipeline.workspace_id,
        action="restore_version",
        resource_type="pipeline",
        resource_id=pipeline_id,
        details={"version": version}
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "data": PipelineResponse.from_orm(pipeline)
    }

# ==================== PIPELINE EXECUTION ====================

@router.post("/{pipeline_id}/run", response_model=SuccessResponse)
async def run_pipeline(
    pipeline_id: uuid.UUID,
    run_data: Optional[PipelineRunCreate] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Execute a pipeline."""
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
    
    # Create run record
    run = PipelineRun(
        pipeline_id=pipeline_id,
        status="pending",
        created_by=current_user.id,
        created_at=datetime.utcnow()
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    
    # TODO: Queue for execution in worker
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        workspace_id=pipeline.workspace_id,
        action="run",
        resource_type="pipeline_run",
        resource_id=run.id,
        details={"pipeline_id": str(pipeline_id)}
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "data": PipelineRunResponse.from_orm(run)
    }

@router.get("/{pipeline_id}/runs", response_model=SuccessResponse)
async def list_pipeline_runs(
    pipeline_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
):
    """List runs for a pipeline."""
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
    
    query = db.query(PipelineRun).filter(PipelineRun.pipeline_id == pipeline_id)
    
    if status:
        query = query.filter(PipelineRun.status == status)
    
    total = query.count()
    runs = query.order_by(PipelineRun.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "success": True,
        "data": [PipelineRunResponse.from_orm(r) for r in runs],
        "meta": {
            "page": skip // limit + 1 if limit > 0 else 1,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit if limit > 0 else 0
        }
    }

# ==================== RUN MANAGEMENT ====================

@router.get("/runs/{run_id}", response_model=SuccessResponse)
async def get_run(
    run_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get run details."""
    run = db.query(PipelineRun).filter(PipelineRun.id == run_id).first()
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Run not found"
        )
    
    # Check access
    pipeline = db.query(Pipeline).filter(Pipeline.id == run.pipeline_id).first()
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == pipeline.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return {
        "success": True,
        "data": PipelineRunResponse.from_orm(run)
    }

@router.get("/runs/{run_id}/logs", response_model=SuccessResponse)
async def get_run_logs(
    run_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get run logs."""
    run = db.query(PipelineRun).filter(PipelineRun.id == run_id).first()
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Run not found"
        )
    
    # Check access
    pipeline = db.query(Pipeline).filter(Pipeline.id == run.pipeline_id).first()
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == pipeline.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return {
        "success": True,
        "data": {
            "run_id": str(run_id),
            "logs": run.logs or ""
        }
    }

@router.post("/runs/{run_id}/cancel", response_model=SuccessResponse)
async def cancel_run(
    run_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Cancel a running pipeline."""
    run = db.query(PipelineRun).filter(PipelineRun.id == run_id).first()
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Run not found"
        )
    
    # Check access
    pipeline = db.query(Pipeline).filter(Pipeline.id == run.pipeline_id).first()
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == pipeline.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    if run.status not in ["pending", "running"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel run with status {run.status}"
        )
    
    run.status = "cancelled"
    run.ended_at = datetime.utcnow()
    db.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        workspace_id=pipeline.workspace_id,
        action="cancel_run",
        resource_type="pipeline_run",
        resource_id=run_id
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "data": PipelineRunResponse.from_orm(run)
    }

@router.get("/runs/{run_id}/metrics", response_model=SuccessResponse)
async def get_run_metrics(
    run_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get run metrics."""
    run = db.query(PipelineRun).filter(PipelineRun.id == run_id).first()
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Run not found"
        )
    
    # Check access
    pipeline = db.query(Pipeline).filter(Pipeline.id == run.pipeline_id).first()
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == pipeline.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Calculate duration
    duration = None
    if run.started_at and run.ended_at:
        duration = (run.ended_at - run.started_at).total_seconds()
    
    metrics_data = PipelineRunMetricsResponse(
        run_id=str(run_id),
        pipeline_id=str(run.pipeline_id),
        status=run.status,
        duration_seconds=duration,
        metrics=run.metrics or {}
    )
    
    return {
        "success": True,
        "data": metrics_data
    }

# ==================== ENGINE MANAGEMENT ====================

@router.get("/engines", response_model=SuccessResponse)
async def list_engines(
    current_user: User = Depends(get_current_active_user),
):
    """List available transformation engines."""
    engines = [
        {"id": "dbt", "name": "dbt", "description": "Data build tool"},
        {"id": "pyspark", "name": "PySpark", "description": "Apache Spark"},
        {"id": "python", "name": "Python", "description": "Native Python"},
        {"id": "sql", "name": "SQL", "description": "Native SQL"},
        {"id": "spark_sql", "name": "Spark SQL", "description": "Spark SQL"},
    ]
    
    return {
        "success": True,
        "data": engines
    }

@router.post("/engines/{engine}/validate", response_model=SuccessResponse)
async def validate_engine_config(
    engine: str,
    config: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
):
    """Validate engine configuration."""
    # TODO: Implement engine-specific validation
    
    return {
        "success": True,
        "data": {
            "engine": engine,
            "valid": True,
            "errors": []
        }
    }
