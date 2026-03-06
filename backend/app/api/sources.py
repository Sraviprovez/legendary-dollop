"""
Source Management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List, Tuple
import uuid
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.base import User, Workspace, Source, WorkspaceMember, AuditLog, CatalogEntry
from app.schemas import (
    SourceCreate, SourceUpdate, SourceResponse, SourceStatusResponse,
    TestConnectionRequest, SuccessResponse
)

router = APIRouter(prefix="/sources", tags=["sources"])

# ==================== SOURCE MANAGEMENT ====================

@router.get("", response_model=SuccessResponse)
async def list_sources(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    workspace_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    source_type: Optional[str] = None,
):
    """
    List sources with workspace filter and pagination.
    Users see only sources in their workspaces.
    """
    query = db.query(Source)
    
    # Filter by workspace if provided
    if workspace_id:
        ws_uuid = uuid.UUID(workspace_id)
        query = query.filter(Source.workspace_id == ws_uuid)
        
        # Check user has access to workspace
        member = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == ws_uuid,
            WorkspaceMember.user_id == current_user.id
        ).first()
        if not member and current_user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to workspace"
            )
    else:
        # Get user's workspaces
        workspace_ids = db.query(WorkspaceMember.workspace_id).filter(
            WorkspaceMember.user_id == current_user.id
        ).all()
        workspace_ids = [w[0] for w in workspace_ids]
        if workspace_ids:
            query = query.filter(Source.workspace_id.in_(workspace_ids))
        else:
            query = query.filter(False)  # No access
    
    if source_type:
        query = query.filter(Source.type == source_type)
    
    total = query.count()
    sources = query.offset(skip).limit(limit).all()
    
    return {
        "success": True,
        "data": [SourceResponse.from_orm(s) for s in sources],
        "meta": {
            "page": skip // limit + 1 if limit > 0 else 1,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit if limit > 0 else 0
        }
    }

@router.post("", response_model=SuccessResponse)
async def create_source(
    source_data: SourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    workspace_id: str = Query(...),
):
    """Create a new source in a workspace."""
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
    
    new_source = Source(
        name=source_data.name,
        type=source_data.type,
        workspace_id=ws_uuid,
        connection_details=source_data.connection_details,
        created_by=current_user.id,
        is_private=source_data.is_private
    )
    db.add(new_source)
    db.commit()
    db.refresh(new_source)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        workspace_id=ws_uuid,
        action="create",
        resource_type="source",
        resource_id=new_source.id,
        details={"name": source_data.name, "type": source_data.type}
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "data": SourceResponse.from_orm(new_source)
    }

@router.get("/{source_id}", response_model=SuccessResponse)
async def get_source(
    source_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get source details."""
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == source.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return {
        "success": True,
        "data": SourceResponse.from_orm(source)
    }

@router.put("/{source_id}", response_model=SuccessResponse)
async def update_source(
    source_id: uuid.UUID,
    source_data: SourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update source details."""
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == source.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Update fields
    if source_data.name:
        source.name = source_data.name
    if source_data.type:
        source.type = source_data.type
    if source_data.connection_details:
        source.connection_details = source_data.connection_details
    if source_data.is_private is not None:
        source.is_private = source_data.is_private
    
    db.commit()
    db.refresh(source)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        workspace_id=source.workspace_id,
        action="update",
        resource_type="source",
        resource_id=source_id,
        details=source_data.dict(exclude_unset=True)
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "data": SourceResponse.from_orm(source)
    }

@router.delete("/{source_id}", response_model=SuccessResponse)
async def delete_source(
    source_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a source."""
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == source.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    workspace_id = source.workspace_id
    db.delete(source)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        workspace_id=workspace_id,
        action="delete",
        resource_type="source",
        resource_id=source_id,
        details={"name": source.name}
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "data": {"message": "Source deleted successfully"}
    }

# ==================== INTERNAL HELPERS ====================

def _pg_connect(details: Dict[str, Any]):
    conn = psycopg2.connect(
        host=details.get("host"),
        port=int(details.get("port", 5432)),
        dbname=details.get("database") or details.get("dbName"),
        user=details.get("username") or details.get("user"),
        password=details.get("password"),
        connect_timeout=5,
    )
    return conn

def _pg_list_tables_and_columns(conn, include_schemas: Optional[List[str]] = None, include_samples: bool = False) -> Dict[str, Any]:
    cur = conn.cursor(cursor_factory=RealDictCursor)
    schema_filter = ""
    params: List[Any] = []
    
    # Fallback to 'public' if no schemas provided, as requested
    target_schemas = include_schemas if include_schemas else ["public"]
    
    schema_filter = "AND table_schema = ANY(%s)"
    params.append(target_schemas)
    
    cur.execute(f"""
        SELECT table_schema, table_name, table_type
        FROM information_schema.tables
        WHERE table_schema NOT IN ('pg_catalog','information_schema')
        {schema_filter}
        ORDER BY table_schema, table_name
    """, params)
    tables = cur.fetchall()
    result_tables = []
    for t in tables:
        schema = t["table_schema"]
        name = t["table_name"]
        cur.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = %s AND table_name = %s
            ORDER BY ordinal_position
        """, [schema, name])
        cols = cur.fetchall()
        
        # Sample data (only if requested)
        sample_rows: List[List[Any]] = []
        if include_samples:
            try:
                with conn.cursor() as c2:
                    c2.execute(f'SELECT * FROM "{schema}"."{name}" LIMIT 5')
                    sample_raw = c2.fetchall()
                    sample_rows = [list(map(lambda x: x, r)) for r in sample_raw]
            except Exception:
                sample_rows = []
        
        # Row count (fast estimate using pg_class)
        row_count_display = "unknown"
        try:
            with conn.cursor() as c3:
                c3.execute("""
                    SELECT reltuples::bigint 
                    FROM pg_class c 
                    JOIN pg_namespace n ON n.oid = c.relnamespace 
                    WHERE n.nspname = %s AND c.relname = %s
                """, [schema, name])
                cnt = c3.fetchone()
                if cnt and cnt[0] is not None:
                    row_count_display = str(cnt[0])
        except Exception:
            pass
            
        table_data = {
            "schema": schema,
            "name": name,
            "type": "view" if t["table_type"].lower().endswith("view") else "table",
            "rowCountDisplay": row_count_display,
            "columns": [
                {
                    "name": c["column_name"],
                    "type": c["data_type"],
                    "nullable": (c["is_nullable"] == "YES"),
                } for c in cols
            ]
        }
        if include_samples:
            table_data["sampleData"] = sample_rows
            
        result_tables.append(table_data)
    return {"tables": result_tables, "views": [x for x in result_tables if x["type"] == "view"]}

def _persist_catalog_from_pg(db: Session, workspace_id: uuid.UUID, source_id: uuid.UUID, tables: List[Dict[str, Any]]):
    # Remove previous catalog entries for this source
    db.query(CatalogEntry).filter(CatalogEntry.source_id == source_id).delete()
    now = datetime.utcnow()
    for t in tables:
        meta_columns = [{"name": c["name"], "type": c["type"], "nullable": c.get("nullable", True)} for c in t.get("columns", [])]
        ce = CatalogEntry(
            workspace_id=workspace_id,
            name=f'{t.get("schema")}.{t.get("name")}',
            description=None,
            table_type=t.get("type", "table"),
            source_id=source_id,
            schema_name=t.get("schema"),
            row_count=t.get("rowCountDisplay", "unknown"),
            catalog_metadata={"columns": meta_columns},
            created_at=now,
            updated_at=now,
        )
        db.add(ce)
    db.commit()

# ==================== SOURCE OPERATIONS ====================

@router.post("/{source_id}/test-connection", response_model=SuccessResponse)
async def test_source_connection(
    source_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Test connection to a source."""
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == source.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    if source.type == "postgresql":
        try:
            conn = _pg_connect(source.connection_details or {})
            conn.close()
            return {
                "success": True,
                "data": {
                    "source_id": str(source_id),
                    "status": "connected",
                    "message": "Connection test successful"
                }
            }
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"PostgreSQL connection failed: {str(e)}")
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported source type for connection test")

@router.post("/{source_id}/discover-schema", response_model=SuccessResponse)
async def discover_source_schema(
    source_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Discover schema from source."""
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == source.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    if source.type != "postgresql":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Schema discovery currently supports PostgreSQL only")
    try:
        details = source.connection_details or {}
        conn = _pg_connect(details)
        
        # Extract schemas if provided
        schemas = details.get("schemas")
        if isinstance(schemas, str):
            schemas = [s.strip() for s in schemas.split(",") if s.strip()]
            
        scan = _pg_list_tables_and_columns(conn, include_schemas=schemas, include_samples=True)
        conn.close()
        schema_cache = {
            "sourceId": str(source_id),
            "sourceType": source.type,
            "sourceName": source.name,
            "tables": [t for t in scan["tables"] if t["type"] == "table"],
            "views": [t for t in scan["tables"] if t["type"] == "view"],
            "discovered_at": datetime.utcnow().isoformat()
        }
        source.schema_cache = schema_cache
        db.commit()
        _persist_catalog_from_pg(db, source.workspace_id, source.id, scan["tables"])
        return {
            "success": True,
            "data": schema_cache
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Schema discovery failed: {str(e)}")

@router.get("/{source_id}/schema", response_model=SuccessResponse)
async def get_source_schema(
    source_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get cached schema from source."""
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == source.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return {
        "success": True,
        "data": source.schema_cache or {}
    }

@router.post("/{source_id}/sync", response_model=SuccessResponse)
async def sync_source(
    source_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Trigger a sync for the source."""
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == source.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # TODO: Implement actual sync via Airbyte or worker
    
    return {
        "success": True,
        "data": {
            "source_id": str(source_id),
            "status": "sync_initiated",
            "sync_id": str(uuid.uuid4())
        }
    }

@router.get("/types", response_model=SuccessResponse)
async def list_source_types(
    current_user: User = Depends(get_current_active_user),
):
    """List available source types."""
    source_types = [
        {"id": "postgresql", "name": "PostgreSQL"},
        {"id": "mysql", "name": "MySQL"},
        {"id": "snowflake", "name": "Snowflake"},
        {"id": "bigquery", "name": "Google BigQuery"},
        {"id": "redshift", "name": "Amazon Redshift"},
        {"id": "s3", "name": "Amazon S3"},
        {"id": "gcs", "name": "Google Cloud Storage"},
        {"id": "databricks", "name": "Databricks"},
        {"id": "mongodb", "name": "MongoDB"},
        {"id": "elasticsearch", "name": "Elasticsearch"},
    ]
    
    return {
        "success": True,
        "data": source_types
    }

@router.get("/{source_id}/status", response_model=SuccessResponse)
async def get_source_status(
    source_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get source status and connection details."""
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == source.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # TODO: Get real status from connector
    status_data = SourceStatusResponse(
        source_id=str(source_id),
        status="connected",
        last_sync=None,
        tables_count=0,
        columns_count=0
    )
    
    return {
        "success": True,
        "data": status_data
    }

# ==================== DIRECT UTILITIES ====================

@router.post("/test-direct", response_model=SuccessResponse)
async def test_connection_direct(
    payload: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_active_user),
):
    src_type = payload.get("type")
    details = payload.get("connection_details") or {}
    if src_type != "postgresql":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PostgreSQL is supported for direct test")
    try:
        conn = _pg_connect(details)
        conn.close()
        return {
            "success": True,
            "data": {"status": "connected", "message": "Connection test successful"}
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"PostgreSQL connection failed: {str(e)}")

@router.post("/discover-direct", response_model=SuccessResponse)
async def discover_direct(
    payload: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_active_user),
):
    src_type = payload.get("type")
    details = payload.get("connection_details") or {}
    if src_type != "postgresql":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PostgreSQL is supported for direct discovery")
    try:
        conn = _pg_connect(details)
        
        # Extract schemas if provided
        schemas = details.get("schemas")
        if isinstance(schemas, str):
            schemas = [s.strip() for s in schemas.split(",") if s.strip()]
            
        scan = _pg_list_tables_and_columns(conn, include_schemas=schemas, include_samples=False)
        conn.close()
        schema_cache = {
            "sourceType": src_type,
            "sourceName": details.get("database"),
            "tables": [t for t in scan["tables"] if t["type"] == "table"],
            "views": [t for t in scan["tables"] if t["type"] == "view"],
            "discovered_at": datetime.utcnow().isoformat()
        }
        return {
            "success": True,
            "data": schema_cache
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Discovery failed: {str(e)}")
