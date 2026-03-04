"""
Settings and Configuration API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.base import (
    User, Settings, Workspace, WorkspaceMember, AuditLog
)
from app.schemas import (
    SettingCreate, SettingUpdate, SettingResponse,
    IntegrationConfig, AuditLogResponse, SuccessResponse
)

router = APIRouter(prefix="/settings", tags=["settings"])

# ==================== USER SETTINGS ====================

@router.get("", response_model=SuccessResponse)
async def get_user_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get current user's settings."""
    settings = db.query(Settings).filter(
        Settings.user_id == current_user.id
    ).all()
    
    settings_dict = {}
    for setting in settings:
        settings_dict[setting.key] = setting.value
    
    return {
        "success": True,
        "data": settings_dict
    }

@router.put("", response_model=SuccessResponse)
async def update_user_settings(
    settings_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update user settings."""
    for key, value in settings_data.items():
        existing = db.query(Settings).filter(
            Settings.user_id == current_user.id,
            Settings.key == key
        ).first()
        
        if existing:
            existing.value = value
        else:
            new_setting = Settings(
                user_id=current_user.id,
                key=key,
                value=value
            )
            db.add(new_setting)
    
    db.commit()
    
    return {
        "success": True,
        "data": {"message": "Settings updated successfully"}
    }

# ==================== WORKSPACE SETTINGS ====================

@router.get("/workspace", response_model=SuccessResponse)
async def get_workspace_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    workspace_id: str = Query(...),
):
    """Get workspace settings."""
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
    
    settings = db.query(Settings).filter(
        Settings.workspace_id == ws_uuid
    ).all()
    
    settings_dict = {}
    for setting in settings:
        settings_dict[setting.key] = setting.value
    
    # Include workspace basic settings
    settings_dict["name"] = workspace.name
    settings_dict["description"] = workspace.description
    
    return {
        "success": True,
        "data": settings_dict
    }

@router.put("/workspace", response_model=SuccessResponse)
async def update_workspace_settings(
    workspace_id: str,
    settings_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update workspace settings."""
    ws_uuid = uuid.UUID(workspace_id)
    workspace = db.query(Workspace).filter(Workspace.id == ws_uuid).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    # Check permission
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == ws_uuid,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Update settings in database
    for key, value in settings_data.items():
        if key not in ["name", "description"]:
            existing = db.query(Settings).filter(
                Settings.workspace_id == ws_uuid,
                Settings.key == key
            ).first()
            
            if existing:
                existing.value = value
            else:
                new_setting = Settings(
                    workspace_id=ws_uuid,
                    key=key,
                    value=value
                )
                db.add(new_setting)
    
    # Update workspace basic settings
    if "name" in settings_data:
        workspace.name = settings_data["name"]
    if "description" in settings_data:
        workspace.description = settings_data["description"]
    
    db.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        workspace_id=ws_uuid,
        action="update_settings",
        resource_type="workspace_settings",
        details=settings_data
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "data": {"message": "Workspace settings updated successfully"}
    }

# ==================== INTEGRATIONS ====================

@router.get("/integrations", response_model=SuccessResponse)
async def get_integrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    workspace_id: Optional[str] = Query(None),
):
    """Get configured integrations."""
    # TODO: Implement integration storage and retrieval
    
    integrations = [
        {
            "type": "airbyte",
            "name": "Airbyte",
            "status": "connected",
            "configured_at": None
        },
        {
            "type": "dbt",
            "name": "dbt Cloud",
            "status": "not_configured",
            "configured_at": None
        },
        {
            "type": "slack",
            "name": "Slack",
            "status": "not_configured",
            "configured_at": None
        }
    ]
    
    return {
        "success": True,
        "data": integrations
    }

@router.post("/integrations/{integration_type}", response_model=SuccessResponse)
async def configure_integration(
    integration_type: str,
    config: IntegrationConfig,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    workspace_id: Optional[str] = Query(None),
):
    """Configure an integration."""
    ws_uuid = uuid.UUID(workspace_id) if workspace_id else None
    
    if ws_uuid:
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
    
    # TODO: Store integration configuration securely
    # Validate integration type and config
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        workspace_id=ws_uuid,
        action="configure_integration",
        resource_type="integration",
        details={"type": integration_type}
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "data": {
            "integration": integration_type,
            "status": "configured",
            "message": f"{integration_type} integration configured successfully"
        }
    }

# ==================== AUDIT LOGS ====================

@router.get("/audit-logs", response_model=SuccessResponse)
async def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    workspace_id: Optional[str] = Query(None),
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    """Get audit logs for user or workspace."""
    query = db.query(AuditLog)
    
    if workspace_id:
        ws_uuid = uuid.UUID(workspace_id)
        query = query.filter(AuditLog.workspace_id == ws_uuid)
        
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
    else:
        # User's own logs
        query = query.filter(AuditLog.user_id == current_user.id)
    
    # Apply filters
    if action:
        query = query.filter(AuditLog.action == action)
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)
    
    total = query.count()
    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "success": True,
        "data": logs,
        "meta": {
            "page": skip // limit + 1 if limit > 0 else 1,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit if limit > 0 else 0
        }
    }
