"""
Source Management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.base import User, Workspace, Source, WorkspaceMember, AuditLog
from app.schemas import (
    SourceCreate, SourceUpdate, SourceResponse, SourceStatusResponse,
    TestConnectionRequest, SuccessResponse
)

router = APIRouter(prefix="/sources", tags=["sources"])

# ==================== SOURCE MANAGEMENT ====================

@router.get("", response_model=SuccessResponse)
async def list_sources(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    workspace_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    source_type: Optional[str] = None,
):
    """
    List sources with workspace filter and pagination.
    Users see only sources in their workspaces.
    """
    query = db.query(Source)
    
    # Filter by workspace if provided
    if workspace_id:
        ws_uuid = uuid.UUID(workspace_id)
        query = query.filter(Source.workspace_id == ws_uuid)
        
        # Check user has access to workspace
        member = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == ws_uuid,
            WorkspaceMember.user_id == current_user.id
        ).first()
        if not member and current_user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to workspace"
            )
    else:
        # Get user's workspaces
        workspace_ids = db.query(WorkspaceMember.workspace_id).filter(
            WorkspaceMember.user_id == current_user.id
        ).all()
        workspace_ids = [w[0] for w in workspace_ids]
        if workspace_ids:
            query = query.filter(Source.workspace_id.in_(workspace_ids))
        else:
            query = query.filter(False)  # No access
    
    if source_type:
        query = query.filter(Source.type == source_type)
    
    total = query.count()
    sources = query.offset(skip).limit(limit).all()
    
    return {
        "success": True,
        "data": [SourceResponse.from_orm(s) for s in sources],
        "meta": {
            "page": skip // limit + 1 if limit > 0 else 1,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit if limit > 0 else 0
        }
    }

@router.post("", response_model=SuccessResponse)
async def create_source(
    source_data: SourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    workspace_id: str = Query(...),
):
    """Create a new source in a workspace."""
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
    
    new_source = Source(
        name=source_data.name,
        type=source_data.type,
        workspace_id=ws_uuid,
        connection_details=source_data.connection_details,
        created_by=current_user.id,
        is_private=source_data.is_private
    )
    db.add(new_source)
    db.commit()
    db.refresh(new_source)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        workspace_id=ws_uuid,
        action="create",
        resource_type="source",
        resource_id=new_source.id,
        details={"name": source_data.name, "type": source_data.type}
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "data": SourceResponse.from_orm(new_source)
    }

@router.get("/{source_id}", response_model=SuccessResponse)
async def get_source(
    source_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get source details."""
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == source.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return {
        "success": True,
        "data": SourceResponse.from_orm(source)
    }

@router.put("/{source_id}", response_model=SuccessResponse)
async def update_source(
    source_id: uuid.UUID,
    source_data: SourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update source details."""
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == source.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Update fields
    if source_data.name:
        source.name = source_data.name
    if source_data.type:
        source.type = source_data.type
    if source_data.connection_details:
        source.connection_details = source_data.connection_details
    if source_data.is_private is not None:
        source.is_private = source_data.is_private
    
    db.commit()
    db.refresh(source)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        workspace_id=source.workspace_id,
        action="update",
        resource_type="source",
        resource_id=source_id,
        details=source_data.dict(exclude_unset=True)
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "data": SourceResponse.from_orm(source)
    }

@router.delete("/{source_id}", response_model=SuccessResponse)
async def delete_source(
    source_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a source."""
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == source.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    workspace_id = source.workspace_id
    db.delete(source)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        workspace_id=workspace_id,
        action="delete",
        resource_type="source",
        resource_id=source_id,
        details={"name": source.name}
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "data": {"message": "Source deleted successfully"}
    }

# ==================== SOURCE OPERATIONS ====================

@router.post("/{source_id}/test-connection", response_model=SuccessResponse)
async def test_source_connection(
    source_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Test connection to a source."""
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == source.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # TODO: Implement actual connection testing
    # This would call the appropriate client based on source.type
    
    return {
        "success": True,
        "data": {
            "source_id": str(source_id),
            "status": "connected",
            "message": "Connection test successful"
        }
    }

@router.post("/{source_id}/discover-schema", response_model=SuccessResponse)
async def discover_source_schema(
    source_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Discover schema from source."""
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == source.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # TODO: Implement schema discovery
    # This would use Airbyte or direct connection
    
    schema_cache = {
        "tables": [],
        "discovered_at": datetime.utcnow().isoformat()
    }
    source.schema_cache = schema_cache
    db.commit()
    
    return {
        "success": True,
        "data": schema_cache
    }

@router.get("/{source_id}/schema", response_model=SuccessResponse)
async def get_source_schema(
    source_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get cached schema from source."""
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == source.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return {
        "success": True,
        "data": source.schema_cache or {}
    }

@router.post("/{source_id}/sync", response_model=SuccessResponse)
async def sync_source(
    source_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Trigger a sync for the source."""
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == source.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # TODO: Implement actual sync via Airbyte or worker
    
    return {
        "success": True,
        "data": {
            "source_id": str(source_id),
            "status": "sync_initiated",
            "sync_id": str(uuid.uuid4())
        }
    }

@router.get("/types", response_model=SuccessResponse)
async def list_source_types(
    current_user: User = Depends(get_current_active_user),
):
    """List available source types."""
    source_types = [
        {"id": "postgresql", "name": "PostgreSQL"},
        {"id": "mysql", "name": "MySQL"},
        {"id": "snowflake", "name": "Snowflake"},
        {"id": "bigquery", "name": "Google BigQuery"},
        {"id": "redshift", "name": "Amazon Redshift"},
        {"id": "s3", "name": "Amazon S3"},
        {"id": "gcs", "name": "Google Cloud Storage"},
        {"id": "databricks", "name": "Databricks"},
        {"id": "mongodb", "name": "MongoDB"},
        {"id": "elasticsearch", "name": "Elasticsearch"},
    ]
    
    return {
        "success": True,
        "data": source_types
    }

@router.get("/{source_id}/status", response_model=SuccessResponse)
async def get_source_status(
    source_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get source status and connection details."""
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == source.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # TODO: Get real status from connector
    status_data = SourceStatusResponse(
        source_id=str(source_id),
        status="connected",
        last_sync=None,
        tables_count=0,
        columns_count=0
    )
    
    return {
        "success": True,
        "data": status_data
    }
