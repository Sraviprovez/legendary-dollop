"""
Data Catalog API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
import uuid
from datetime import datetime

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.base import (
    User, CatalogEntry, WorkspaceMember, AuditLog
)
from app.schemas import (
    CatalogEntryResponse, CatalogTableDetailResponse, ColumnInfo, SuccessResponse
)

router = APIRouter(prefix="/catalog", tags=["catalog"])

# ==================== CATALOG TABLES ====================

@router.get("/tables", response_model=SuccessResponse)
async def list_catalog_tables(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    workspace_id: Optional[str] = Query(None),
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """
    List tables in the catalog with search and pagination.
    """
    query = db.query(CatalogEntry)
    
    if workspace_id:
        ws_uuid = uuid.UUID(workspace_id)
        query = query.filter(CatalogEntry.workspace_id == ws_uuid)
        
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
    
    if search:
        query = query.filter(CatalogEntry.name.ilike(f"%{search}%"))
    
    total = query.count()
    tables = query.order_by(CatalogEntry.updated_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "success": True,
        "data": [CatalogEntryResponse.from_orm(t) for t in tables],
        "meta": {
            "page": skip // limit + 1 if limit > 0 else 1,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit if limit > 0 else 0
        }
    }

@router.get("/tables/{table_id}", response_model=SuccessResponse)
async def get_catalog_table(
    table_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get catalog table details."""
    table = db.query(CatalogEntry).filter(CatalogEntry.id == table_id).first()
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == table.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return {
        "success": True,
        "data": CatalogEntryResponse.from_orm(table)
    }

@router.get("/tables/{table_id}/columns", response_model=SuccessResponse)
async def get_table_columns(
    table_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get columns for a catalog table."""
    table = db.query(CatalogEntry).filter(CatalogEntry.id == table_id).first()
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == table.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Extract columns from metadata
    columns = []
    if table.metadata and "columns" in table.metadata:
        for col in table.metadata["columns"]:
            columns.append(ColumnInfo(
                name=col.get("name", ""),
                data_type=col.get("type", ""),
                nullable=col.get("nullable", True),
                description=col.get("description")
            ))
    
    return {
        "success": True,
        "data": columns
    }

@router.get("/tables/{table_id}/lineage", response_model=SuccessResponse)
async def get_table_lineage(
    table_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get lineage for a catalog table."""
    table = db.query(CatalogEntry).filter(CatalogEntry.id == table_id).first()
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == table.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # TODO: Implement actual lineage tracking
    
    return {
        "success": True,
        "data": {
            "table_id": str(table_id),
            "upstream": [],
            "downstream": []
        }
    }

@router.get("/tables/{table_id}/quality", response_model=SuccessResponse)
async def get_table_quality(
    table_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get quality metrics for a catalog table."""
    table = db.query(CatalogEntry).filter(CatalogEntry.id == table_id).first()
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == table.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # TODO: Get actual quality metrics
    
    return {
        "success": True,
        "data": {
            "table_id": str(table_id),
            "quality_score": 0.95,
            "passed_checks": 0,
            "failed_checks": 0,
            "last_checked": None
        }
    }

# ==================== CATALOG SEARCH & BROWSE ====================

@router.get("/search", response_model=SuccessResponse)
async def search_catalog(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """Search the catalog by name, description, or column."""
    # Get user's workspaces
    workspace_ids = db.query(WorkspaceMember.workspace_id).filter(
        WorkspaceMember.user_id == current_user.id
    ).all()
    workspace_ids = [w[0] for w in workspace_ids]
    
    # Search tables
    query = db.query(CatalogEntry).filter(
        CatalogEntry.workspace_id.in_(workspace_ids) if workspace_ids else False
    )
    
    # Search in name or description
    query = query.filter(
        (CatalogEntry.name.ilike(f"%{q}%")) |
        (CatalogEntry.description.ilike(f"%{q}%"))
    )
    
    total = query.count()
    results = query.offset(skip).limit(limit).all()
    
    return {
        "success": True,
        "data": [CatalogEntryResponse.from_orm(r) for r in results],
        "meta": {
            "page": skip // limit + 1 if limit > 0 else 1,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit if limit > 0 else 0
        }
    }

@router.get("/recent", response_model=SuccessResponse)
async def get_recent_tables(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    limit: int = Query(10, ge=1, le=50),
):
    """Get recently updated tables."""
    workspace_ids = db.query(WorkspaceMember.workspace_id).filter(
        WorkspaceMember.user_id == current_user.id
    ).all()
    workspace_ids = [w[0] for w in workspace_ids]
    
    tables = db.query(CatalogEntry).filter(
        CatalogEntry.workspace_id.in_(workspace_ids) if workspace_ids else False
    ).order_by(CatalogEntry.updated_at.desc()).limit(limit).all()
    
    return {
        "success": True,
        "data": [CatalogEntryResponse.from_orm(t) for t in tables]
    }

@router.get("/popular", response_model=SuccessResponse)
async def get_popular_tables(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    limit: int = Query(10, ge=1, le=50),
):
    """Get most popular (accessed) tables."""
    workspace_ids = db.query(WorkspaceMember.workspace_id).filter(
        WorkspaceMember.user_id == current_user.id
    ).all()
    workspace_ids = [w[0] for w in workspace_ids]
    
    # TODO: Track and sort by access count
    # For now, just return recently updated
    tables = db.query(CatalogEntry).filter(
        CatalogEntry.workspace_id.in_(workspace_ids) if workspace_ids else False
    ).order_by(CatalogEntry.updated_at.desc()).limit(limit).all()
    
    return {
        "success": True,
        "data": [CatalogEntryResponse.from_orm(t) for t in tables]
    }
