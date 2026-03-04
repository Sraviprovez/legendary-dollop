"""
Admin API endpoints for user management.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from datetime import datetime

from app.api.deps import get_current_active_user, require_admin
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.base import User, UserRole, AuditLog
from app.schemas import (
    UserCreate, UserUpdate, UserResponse, UserActivityResponse, SuccessResponse
)

router = APIRouter(prefix="/admin", tags=["admin"])

# ==================== USER MANAGEMENT ====================

@router.get("/users", response_model=SuccessResponse)
async def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
):
    """
    List all users with pagination and filters.
    Requires admin role.
    """
    query = db.query(User)
    
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    total = query.count()
    users = query.offset(skip).limit(limit).all()
    
    return {
        "success": True,
        "data": [UserResponse.from_orm(u) for u in users],
        "meta": {
            "page": skip // limit + 1 if limit > 0 else 1,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit if limit > 0 else 0
        }
    }

@router.post("/users", response_model=SuccessResponse)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Create a new user.
    Requires admin role.
    """
    # Check if email already exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    new_user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role=UserRole(user_data.role),
        created_by=current_user.id,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="create",
        resource_type="user",
        resource_id=new_user.id,
        details={"email": user_data.email}
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "data": UserResponse.from_orm(new_user)
    }

@router.get("/users/{user_id}", response_model=SuccessResponse)
async def get_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Get user details by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "success": True,
        "data": UserResponse.from_orm(user)
    }

@router.put("/users/{user_id}", response_model=SuccessResponse)
async def update_user(
    user_id: uuid.UUID,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Update user details."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update fields if provided
    update_data = user_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "role" and value:
            setattr(user, field, UserRole(value))
        elif value is not None:
            setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="update",
        resource_type="user",
        resource_id=user_id,
        details=update_data
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "data": UserResponse.from_orm(user)
    }

@router.delete("/users/{user_id}", response_model=SuccessResponse)
async def delete_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Soft delete a user (mark as inactive)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = False
    db.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="delete",
        resource_type="user",
        resource_id=user_id,
        details={"email": user.email}
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "data": {"message": "User deleted successfully"}
    }

@router.post("/users/{user_id}/reset-password", response_model=SuccessResponse)
async def reset_password(
    user_id: uuid.UUID,
    new_password: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Reset user password."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.password_hash = get_password_hash(new_password)
    db.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="reset_password",
        resource_type="user",
        resource_id=user_id,
        details={"email": user.email}
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "data": {"message": "Password reset successfully"}
    }

@router.put("/users/{user_id}/activate", response_model=SuccessResponse)
async def activate_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Activate a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = True
    db.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="activate",
        resource_type="user",
        resource_id=user_id
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "data": UserResponse.from_orm(user)
    }

@router.put("/users/{user_id}/deactivate", response_model=SuccessResponse)
async def deactivate_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Deactivate a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = False
    db.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="deactivate",
        resource_type="user",
        resource_id=user_id
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "data": UserResponse.from_orm(user)
    }

@router.get("/users/{user_id}/activity", response_model=SuccessResponse)
async def get_user_activity(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    """Get user activity log."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    total = db.query(AuditLog).filter(AuditLog.user_id == user_id).count()
    logs = db.query(AuditLog).filter(
        AuditLog.user_id == user_id
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
