from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.base import User, UserRole, Workspace, WorkspaceMember, WorkspaceMemberRole

router = APIRouter(prefix="/workspaces", tags=["workspaces"])

@router.get("/")
async def list_workspaces(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Users can only see workspaces they are members of (unless Admin)
    if current_user.role == UserRole.ADMIN:
        return {"success": True, "data": db.query(Workspace).all()}
    
    memberships = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == current_user.id).all()
    workspace_ids = [m.workspace_id for m in memberships]
    workspaces = db.query(Workspace).filter(Workspace.id.in_(workspace_ids)).all()
    
    return {"success": True, "data": workspaces}

@router.post("/")
async def create_workspace(
    name: str,
    description: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only Admin or Data Engineers can create workspaces
    if current_user.role not in [UserRole.ADMIN, UserRole.DATA_ENGINEER]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    new_workspace = Workspace(
        name=name,
        description=description,
        created_by=current_user.id
    )
    db.add(new_workspace)
    db.commit()
    db.refresh(new_workspace)
    
    # Auto-add creator as Admin of workspace
    membership = WorkspaceMember(
        workspace_id=new_workspace.id,
        user_id=current_user.id,
        role_in_workspace=WorkspaceMemberRole.ADMIN
    )
    db.add(membership)
    db.commit()
    
    return {"success": True, "data": new_workspace}
