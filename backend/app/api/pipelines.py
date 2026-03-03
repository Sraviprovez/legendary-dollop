from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.base import User, UserRole, Pipeline, WorkspaceMember, WorkspaceMemberRole, PermissionType

router = APIRouter(prefix="/pipelines", tags=["pipelines"])

@router.get("/")
async def list_pipelines(
    workspace_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Security check: User must be member of workspace or admin
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    
    if not member and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to access this workspace")

    pipelines = db.query(Pipeline).filter(Pipeline.workspace_id == workspace_id).all()
    # Filter private pipelines if user is not the owner
    visible_pipelines = [p for p in pipelines if not p.is_private or p.created_by == current_user.id]
    
    return {"success": True, "data": visible_pipelines}

@router.get("/{pipeline_id}")
async def get_pipeline(
    pipeline_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
        
    # Visibility check
    if pipeline.is_private and pipeline.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Private pipeline access denied")

    return {"success": True, "data": pipeline}

@router.post("/")
async def save_pipeline(
    workspace_id: uuid.UUID,
    name: str,
    config: dict,
    pipeline_id: uuid.UUID = None,
    is_private: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.DATA_ENGINEER, UserRole.DEVELOPER]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    from datetime import datetime
    
    if pipeline_id:
        pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
        if not pipeline:
            raise HTTPException(status_code=404, detail="Pipeline not found")
            
        pipeline.name = name
        pipeline.config = config
        pipeline.is_private = is_private
        pipeline.updated_at = datetime.utcnow()
    else:
        pipeline = Pipeline(
            name=name,
            workspace_id=workspace_id,
            config=config,
            is_private=is_private,
            created_by=current_user.id
        )
        db.add(pipeline)

    db.commit()
    db.refresh(pipeline)
    return {"success": True, "data": pipeline}

@router.post("/{pipeline_id}/run")
async def run_pipeline(
    pipeline_id: uuid.UUID,
    engine: str,
    engine_config: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    # TODO: Trigger Celery task based on engine
    return {
        "success": True, 
        "data": {
            "job_id": str(uuid.uuid4()),
            "status": "submitted",
            "message": f"Pipeline {pipeline.name} submitted for execution on {engine} (MOCKED)"
        }
    }

@router.put("/{pipeline_id}/permissions")
async def update_pipeline_permissions(
    pipeline_id: uuid.UUID,
    permission_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
        
    if pipeline.created_by != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Permission denied")

    if "is_private" in permission_data:
        pipeline.is_private = permission_data["is_private"]
    if "visibility" in permission_data:
        pipeline.visibility = permission_data["visibility"]
        
    db.commit()
    return {"success": True, "message": "Permissions updated successfully"}
