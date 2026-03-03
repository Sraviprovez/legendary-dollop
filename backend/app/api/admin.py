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
@router.put("/users/{user_id}")
async def update_user(
    user_id: uuid.UUID,
    user_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if "email" in user_data:
        user.email = user_data["email"]
    if "first_name" in user_data:
        user.first_name = user_data["first_name"]
    if "last_name" in user_data:
        user.last_name = user_data["last_name"]
    if "role" in user_data:
        user.role = user_data["role"]
    if "password" in user_data and user_data["password"]:
        user.password_hash = get_password_hash(user_data["password"])
    if "is_active" in user_data:
        user.is_active = user_data["is_active"]
        
    db.commit()
    return {"success": True, "data": user}

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db.delete(user)
    db.commit()
    return {"success": True, "message": "User deleted successfully"}

@router.get("/workspaces")
async def list_all_workspaces(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return {"success": True, "data": db.query(Workspace).all()}
