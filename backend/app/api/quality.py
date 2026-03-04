"""
Data Quality API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
import uuid
from datetime import datetime

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.base import (
    User, QualityRule, QualityResult, WorkspaceMember, AuditLog, CatalogEntry
)
from app.schemas import (
    QualityRuleCreate, QualityRuleUpdate, QualityRuleResponse,
    QualityResultResponse, QualityDashboardResponse, AnomalyResponse, SuccessResponse
)

router = APIRouter(prefix="/quality", tags=["quality"])

# ==================== QUALITY RULES ====================

@router.get("/rules", response_model=SuccessResponse)
async def list_quality_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    workspace_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """List quality rules."""
    query = db.query(QualityRule)
    
    if workspace_id:
        ws_uuid = uuid.UUID(workspace_id)
        query = query.filter(QualityRule.workspace_id == ws_uuid)
        
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
    
    total = query.count()
    rules = query.offset(skip).limit(limit).all()
    
    return {
        "success": True,
        "data": [QualityRuleResponse.from_orm(r) for r in rules],
        "meta": {
            "page": skip // limit + 1 if limit > 0 else 1,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit if limit > 0 else 0
        }
    }

@router.post("/rules", response_model=SuccessResponse)
async def create_quality_rule(
    rule_data: QualityRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    workspace_id: str = Query(...),
):
    """Create a quality rule."""
    ws_uuid = uuid.UUID(workspace_id)
    
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
    
    new_rule = QualityRule(
        workspace_id=ws_uuid,
        name=rule_data.name,
        description=rule_data.description,
        rule_type=rule_data.rule_type,
        config=rule_data.config,
        created_by=current_user.id,
        enabled=rule_data.enabled
    )
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        workspace_id=ws_uuid,
        action="create",
        resource_type="quality_rule",
        resource_id=new_rule.id,
        details={"name": rule_data.name}
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "data": QualityRuleResponse.from_orm(new_rule)
    }

@router.get("/rules/{rule_id}", response_model=SuccessResponse)
async def get_quality_rule(
    rule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get quality rule details."""
    rule = db.query(QualityRule).filter(QualityRule.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == rule.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return {
        "success": True,
        "data": QualityRuleResponse.from_orm(rule)
    }

@router.put("/rules/{rule_id}", response_model=SuccessResponse)
async def update_quality_rule(
    rule_id: uuid.UUID,
    rule_data: QualityRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update quality rule."""
    rule = db.query(QualityRule).filter(QualityRule.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == rule.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Update fields
    if rule_data.name:
        rule.name = rule_data.name
    if rule_data.description is not None:
        rule.description = rule_data.description
    if rule_data.rule_type:
        rule.rule_type = rule_data.rule_type
    if rule_data.config:
        rule.config = rule_data.config
    if rule_data.enabled is not None:
        rule.enabled = rule_data.enabled
    
    db.commit()
    db.refresh(rule)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        workspace_id=rule.workspace_id,
        action="update",
        resource_type="quality_rule",
        resource_id=rule_id,
        details=rule_data.dict(exclude_unset=True)
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "data": QualityRuleResponse.from_orm(rule)
    }

@router.delete("/rules/{rule_id}", response_model=SuccessResponse)
async def delete_quality_rule(
    rule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete quality rule."""
    rule = db.query(QualityRule).filter(QualityRule.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == rule.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    workspace_id = rule.workspace_id
    db.delete(rule)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        workspace_id=workspace_id,
        action="delete",
        resource_type="quality_rule",
        resource_id=rule_id,
        details={"name": rule.name}
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "data": {"message": "Rule deleted successfully"}
    }

@router.post("/rules/{rule_id}/run", response_model=SuccessResponse)
async def run_quality_rule(
    rule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Run a quality rule check."""
    rule = db.query(QualityRule).filter(QualityRule.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == rule.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # TODO: Execute rule check
    
    return {
        "success": True,
        "data": {
            "rule_id": str(rule_id),
            "status": "pending",
            "message": "Rule check queued for execution"
        }
    }

# ==================== QUALITY RESULTS ====================

@router.get("/results", response_model=SuccessResponse)
async def list_quality_results(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    workspace_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = None,
):
    """List quality check results."""
    query = db.query(QualityResult)
    
    if workspace_id:
        ws_uuid = uuid.UUID(workspace_id)
        # Get catalog entries in workspace
        catalog_ids = db.query(CatalogEntry.id).filter(
            CatalogEntry.workspace_id == ws_uuid
        ).all()
        catalog_ids = [c[0] for c in catalog_ids]
        query = query.filter(QualityResult.catalog_entry_id.in_(catalog_ids))
        
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
    
    if status:
        query = query.filter(QualityResult.status == status)
    
    total = query.count()
    results = query.order_by(QualityResult.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "success": True,
        "data": [QualityResultResponse.from_orm(r) for r in results],
        "meta": {
            "page": skip // limit + 1 if limit > 0 else 1,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit if limit > 0 else 0
        }
    }

# ==================== QUALITY DASHBOARD ====================

@router.get("/dashboard", response_model=SuccessResponse)
async def get_quality_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    workspace_id: Optional[str] = Query(None),
):
    """Get quality dashboard metrics."""
    query = db.query(QualityResult)
    
    if workspace_id:
        ws_uuid = uuid.UUID(workspace_id)
        # Get catalog entries in workspace
        catalog_ids = db.query(CatalogEntry.id).filter(
            CatalogEntry.workspace_id == ws_uuid
        ).all()
        catalog_ids = [c[0] for c in catalog_ids]
        query = query.filter(QualityResult.catalog_entry_id.in_(catalog_ids))
        
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
    
    results = query.all()
    
    passed = sum(1 for r in results if r.status == "passed")
    warning = sum(1 for r in results if r.status == "warning")
    failed = sum(1 for r in results if r.status == "failed")
    total = len(results)
    
    pass_rate = (passed / total * 100) if total > 0 else 0.0
    
    # Get recent results
    recent = query.order_by(QualityResult.created_at.desc()).limit(20).all()
    
    dashboard = QualityDashboardResponse(
        total_rules=db.query(QualityRule).count(),
        total_checks=total,
        passed_checks=passed,
        warning_checks=warning,
        failed_checks=failed,
        pass_rate=pass_rate,
        recent_results=[QualityResultResponse.from_orm(r) for r in recent]
    )
    
    return {
        "success": True,
        "data": dashboard
    }

# ==================== ANOMALIES ====================

@router.get("/anomalies", response_model=SuccessResponse)
async def list_anomalies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    workspace_id: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """List detected anomalies."""
    # TODO: Implement anomaly detection and tracking
    
    anomalies = []
    
    return {
        "success": True,
        "data": anomalies,
        "meta": {
            "page": skip // limit + 1 if limit > 0 else 1,
            "limit": limit,
            "total": len(anomalies),
            "total_pages": (len(anomalies) + limit - 1) // limit if limit > 0 else 0
        }
    }
