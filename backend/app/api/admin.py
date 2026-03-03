from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
from app.api.auth import get_current_user
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.base import User, UserRole, Workspace, WorkspaceMember, WorkspaceMemberRole

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users")
async def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = db.query(User).all()
    return {"success": True, "data": users}

@router.post("/users")
async def create_user(
    user_data: dict, # Should use Pydantic model
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Simple validation
    if db.query(User).filter(User.email == user_data["email"]).first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    new_user = User(
        email=user_data["email"],
        password_hash=get_password_hash(user_data["password"]),
        first_name=user_data.get("first_name"),
        last_name=user_data.get("last_name"),
        role=user_data.get("role", UserRole.DEVELOPER),
        created_by=current_user.id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"success": True, "data": new_user}

@router.get("/workspaces")
async def list_all_workspaces(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return {"success": True, "data": db.query(Workspace).all()}
