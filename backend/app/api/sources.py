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
    # For now, we assume a default Airbyte workspace exists or we use one from config
    # This is a bit complex in a real setup, usually we'd link SynKrasis Workspace -> Airbyte Workspace
    try:
        # Mocking Airbyte Workspace ID for now, in reality we'd look this up
        airbyte_workspace_id = str(uuid.uuid4()) 
        # airbyte_data = await airbyte.create_source(name, source_definition_id, airbyte_workspace_id, connection_configuration)
        # airbyte_id = airbyte_data["sourceId"]
        airbyte_id = f"mock-{uuid.uuid4()}" # MOCK for now
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Airbyte creation failed: {str(e)}")

    # 2. Store in local DB
    new_source = Source(
        name=name,
        workspace_id=workspace_id,
        type="TODO", # Should come from definition_id mapping
        connection_details=connection_configuration, # Should be encrypted!
        created_by=current_user.id,
        airbyte_source_id=airbyte_id
    )
    db.add(new_source)
    db.commit()
    db.refresh(new_source)
    
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
        
    # In reality, call airbyte.check_source_connection(source.airbyte_source_id)
    return {"success": True, "status": "succeeded", "message": "Connection test successful (MOCKED)"}

@router.post("/{source_id}/discover-schema")
async def discover_schema(
    source_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
        
    # In reality, call airbyte.discover_source_schema(source.airbyte_source_id)
    # Then update source.schema_cache
    mock_schema = {"tables": [{"name": "users", "columns": ["id", "email"]}]}
    source.schema_cache = mock_schema
    db.commit()
    
    return {"success": True, "data": mock_schema}
