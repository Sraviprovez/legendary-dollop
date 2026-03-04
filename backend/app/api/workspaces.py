"""
Workspace API endpoints for workspace management.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from datetime import datetime

from app.api.deps import get_current_active_user, require_any_role
from app.core.database import get_db
from app.models.base import (
    User, UserRole, Workspace, WorkspaceMember, WorkspaceMemberRole, AuditLog
)
from app.schemas import (
    WorkspaceCreate, WorkspaceUpdate, WorkspaceResponse,
    WorkspaceMemberCreate, WorkspaceMemberResponse, SuccessResponse
)

router = APIRouter(prefix="/workspaces", tags=["workspaces"])

# ==================== WORKSPACE MANAGEMENT ====================

@router.get("", response_model=SuccessResponse)
async def list_workspaces(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
):
    """
    List user's workspaces.
    Admins see all workspaces, other users see only their workspaces.
    """
    if current_user.role == UserRole.ADMIN:
        query = db.query(Workspace)
    else:
        # Users see only workspaces they're members of
        member_workspace_ids = db.query(WorkspaceMember.workspace_id).filter(
            WorkspaceMember.user_id == current_user.id
        ).all()
        workspace_ids = [w[0] for w in member_workspace_ids]
        query = db.query(Workspace).filter(Workspace.id.in_(workspace_ids))
    
    total = query.count()
    workspaces = query.offset(skip).limit(limit).all()
    
    # Add member counts
    workspace_data = []
    for ws in workspaces:
        member_count = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == ws.id
        ).count()
        ws_dict = WorkspaceResponse.from_orm(ws).dict()
        ws_dict["member_count"] = member_count
        workspace_data.append(ws_dict)
    
    return {
        "success": True,
        "data": workspace_data,
        "meta": {
            "page": skip // limit + 1 if limit > 0 else 1,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit if limit > 0 else 0
        }
    }

@router.post("", response_model=SuccessResponse)
async def create_workspace(
    workspace_data: WorkspaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role([UserRole.ADMIN, UserRole.DATA_ENGINEER])),
):
    """
    Create a new workspace.
    Requires admin or data_engineer role.
    """
    new_workspace = Workspace(
        name=workspace_data.name,
        description=workspace_data.description,
        created_by=current_user.id
    )
    db.add(new_workspace)
    db.commit()
    db.refresh(new_workspace)
    
    # Add creator as admin
    membership = WorkspaceMember(
        workspace_id=new_workspace.id,
        user_id=current_user.id,
        role_in_workspace=WorkspaceMemberRole.ADMIN
    )
    db.add(membership)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        workspace_id=new_workspace.id,
        action="create",
        resource_type="workspace",
        resource_id=new_workspace.id,
        details={"name": workspace_data.name}
    )
    db.add(audit)
    db.commit()
    
    ws_data = WorkspaceResponse.from_orm(new_workspace).dict()
    ws_data["member_count"] = 1
    
    return {
        "success": True,
        "data": ws_data
    }

@router.get("/{workspace_id}", response_model=SuccessResponse)
async def get_workspace(
    workspace_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get workspace details."""
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    # Check access
    if current_user.role != UserRole.ADMIN:
        member = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == current_user.id
        ).first()
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    member_count = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id
    ).count()
    
    ws_data = WorkspaceResponse.from_orm(workspace).dict()
    ws_data["member_count"] = member_count
    
    return {
        "success": True,
        "data": ws_data
    }

@router.put("/{workspace_id}", response_model=SuccessResponse)
async def update_workspace(
    workspace_id: uuid.UUID,
    workspace_data: WorkspaceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update workspace details. Requires workspace admin role."""
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    # Check permission
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    
    if not member and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    if member and member.role_in_workspace != WorkspaceMemberRole.ADMIN and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workspace admins can update"
        )
    
    # Update fields
    if workspace_data.name:
        workspace.name = workspace_data.name
    if workspace_data.description is not None:
        workspace.description = workspace_data.description
    if workspace_data.settings:
        workspace.settings = workspace_data.settings
    
    db.commit()
    db.refresh(workspace)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        workspace_id=workspace_id,
        action="update",
        resource_type="workspace",
        resource_id=workspace_id,
        details=workspace_data.dict(exclude_unset=True)
    )
    db.add(audit)
    db.commit()
    
    ws_data = WorkspaceResponse.from_orm(workspace).dict()
    ws_data["member_count"] = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id
    ).count()
    
    return {
        "success": True,
        "data": ws_data
    }

@router.delete("/{workspace_id}", response_model=SuccessResponse)
async def delete_workspace(
    workspace_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete workspace. Requires workspace admin role."""
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    # Check permission
    if current_user.role != UserRole.ADMIN:
        member = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == current_user.id,
            WorkspaceMember.role_in_workspace == WorkspaceMemberRole.ADMIN
        ).first()
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only workspace admins can delete"
            )
    
    # Delete members and workspace
    db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id
    ).delete()
    db.delete(workspace)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        workspace_id=workspace_id,
        action="delete",
        resource_type="workspace",
        resource_id=workspace_id
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "data": {"message": "Workspace deleted successfully"}
    }

# ==================== WORKSPACE MEMBERS ====================

@router.get("/{workspace_id}/members", response_model=SuccessResponse)
async def list_workspace_members(
    workspace_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    """List workspace members."""
    # Check access
    if current_user.role != UserRole.ADMIN:
        member = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == current_user.id
        ).first()
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    total = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id
    ).count()
    
    members = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id
    ).offset(skip).limit(limit).all()
    
    return {
        "success": True,
        "data": [WorkspaceMemberResponse.from_orm(m) for m in members],
        "meta": {
            "page": skip // limit + 1 if limit > 0 else 1,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit if limit > 0 else 0
        }
    }

@router.post("/{workspace_id}/members", response_model=SuccessResponse)
async def add_workspace_member(
    workspace_id: uuid.UUID,
    member_data: WorkspaceMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Add member to workspace. Requires workspace admin role."""
    # Check permission
    if current_user.role != UserRole.ADMIN:
        admin_member = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == current_user.id,
            WorkspaceMember.role_in_workspace == WorkspaceMemberRole.ADMIN
        ).first()
        if not admin_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only workspace admins can add members"
            )
    
    # Check if user exists
    user = db.query(User).filter(User.id == uuid.UUID(member_data.user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if already member
    existing = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user.id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member"
        )
    
    new_member = WorkspaceMember(
        workspace_id=workspace_id,
        user_id=user.id,
        role_in_workspace=WorkspaceMemberRole(member_data.role)
    )
    db.add(new_member)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        workspace_id=workspace_id,
        action="add_member",
        resource_type="workspace_member",
        details={"user_id": str(user.id), "role": member_data.role}
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "data": WorkspaceMemberResponse.from_orm(new_member)
    }

@router.put("/{workspace_id}/members/{user_id}", response_model=SuccessResponse)
async def update_workspace_member(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    member_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update member role. Requires workspace admin role."""
    # Check permission
    if current_user.role != UserRole.ADMIN:
        admin_member = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == current_user.id,
            WorkspaceMember.role_in_workspace == WorkspaceMemberRole.ADMIN
        ).first()
        if not admin_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only workspace admins can update members"
            )
    
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    ).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    if "role" in member_data and member_data["role"]:
        member.role_in_workspace = WorkspaceMemberRole(member_data["role"])
    
    db.commit()
    db.refresh(member)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        workspace_id=workspace_id,
        action="update_member",
        resource_type="workspace_member",
        details={"user_id": str(user_id), "changes": member_data}
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "data": WorkspaceMemberResponse.from_orm(member)
    }

@router.delete("/{workspace_id}/members/{user_id}", response_model=SuccessResponse)
async def remove_workspace_member(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Remove member from workspace. Requires workspace admin role."""
    # Check permission
    if current_user.role != UserRole.ADMIN:
        admin_member = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == current_user.id,
            WorkspaceMember.role_in_workspace == WorkspaceMemberRole.ADMIN
        ).first()
        if not admin_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only workspace admins can remove members"
            )
    
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    ).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    db.delete(member)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        workspace_id=workspace_id,
        action="remove_member",
        resource_type="workspace_member",
        details={"user_id": str(user_id)}
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "data": {"message": "Member removed successfully"}
    }

@router.get("/{workspace_id}/activity", response_model=SuccessResponse)
async def get_workspace_activity(
    workspace_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    """Get workspace activity log."""
    # Check access
    if current_user.role != UserRole.ADMIN:
        member = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == current_user.id
        ).first()
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    total = db.query(AuditLog).filter(
        AuditLog.workspace_id == workspace_id
    ).count()
    
    logs = db.query(AuditLog).filter(
        AuditLog.workspace_id == workspace_id
    ).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    
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
