from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.api.auth import get_current_user
from app.core.database import get_db
from app.core.airbyte_client import AirbyteClient
from app.models.base import User, UserRole, Source, WorkspaceMember, WorkspaceMemberRole
import uuid

router = APIRouter(prefix="/sources", tags=["sources"])
airbyte = AirbyteClient()

@router.get("/")
async def list_sources(
    workspace_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Security check: User must be member of workspace
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    
    if not member and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to access this workspace")

    sources = db.query(Source).filter(Source.workspace_id == workspace_id).all()
    return {"success": True, "data": sources}

@router.post("/")
async def create_source(
    workspace_id: uuid.UUID,
    name: str,
    source_definition_id: str,
    connection_configuration: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check permissions (only ADMIN or EDITOR/DATA_ENGINEER)
    if current_user.role not in [UserRole.ADMIN, UserRole.DATA_ENGINEER, UserRole.DEVOPS]:
        raise HTTPException(status_code=403, detail="Insufficient permissions to create sources")

    # 1. Create in Airbyte
    try:
        # Fetch the first available workspace for now
        airbyte_workspaces = await airbyte.list_workspaces()
        if not airbyte_workspaces:
            raise HTTPException(status_code=500, detail="No Airbyte workspaces found")
        
        airbyte_workspace_id = airbyte_workspaces[0]["workspaceId"]
        
        airbyte_data = await airbyte.create_source(
            name=name, 
            source_definition_id=source_definition_id, 
            workspace_id=airbyte_workspace_id, 
            connection_configuration=connection_configuration
        )
        airbyte_id = airbyte_data["sourceId"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Airbyte creation failed: {str(e)}")

    # 2. Store in local DB
    new_source = Source(
        name=name,
        workspace_id=workspace_id,
        type=source_definition_id,
        connection_details=connection_configuration,
        created_by=current_user.id,
        airbyte_source_id=airbyte_id
    )
    db.add(new_source)
    db.commit()
    db.refresh(new_source)
    
    # 3. Auto-discover schema after creation
    try:
        schema_data = await airbyte.discover_source_schema(airbyte_id)
        new_source.schema_cache = schema_data
        db.commit()
    except:
        pass # Non-blocking discovery failure
    
    return {"success": True, "data": new_source}

@router.post("/{source_id}/test-connection")
async def test_connection(
    source_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
        
    result = await airbyte.check_source_connection(source.airbyte_source_id)
    return {"success": True, "status": result.get("status"), "message": result.get("message")}

@router.post("/{source_id}/discover-schema")
async def discover_schema(
    source_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
        
    schema_data = await airbyte.discover_source_schema(source.airbyte_source_id)
    source.schema_cache = schema_data
    db.commit()
    
    return {"success": True, "data": schema_data}
