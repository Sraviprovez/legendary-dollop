"""
Data Lineage and Impact Analysis API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.base import (
    User, CatalogEntry, WorkspaceMember, Pipeline
)
from app.schemas import (
    LineageGraphResponse, LineageNodeResponse, LineageEdgeResponse,
    ColumnLineageResponse, ImpactAnalysisResponse, SuccessResponse
)

router = APIRouter(prefix="/lineage", tags=["lineage"])

# ==================== TABLE LINEAGE ====================

@router.get("/table/{table_id}", response_model=SuccessResponse)
async def get_table_lineage(
    table_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get lineage for a table (upstream and downstream)."""
    table = db.query(CatalogEntry).filter(CatalogEntry.id == table_id).first()
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == table.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # TODO: Implement actual lineage tracking
    # This would query lineage metadata stored during pipeline execution
    
    nodes = [
        LineageNodeResponse(
            id=str(table_id),
            name=table.name,
            type="table",
            workspace_id=str(table.workspace_id)
        )
    ]
    
    edges = []
    
    lineage_graph = LineageGraphResponse(nodes=nodes, edges=edges)
    
    return {
        "success": True,
        "data": lineage_graph
    }

# ==================== PIPELINE LINEAGE ====================

@router.get("/pipeline/{pipeline_id}", response_model=SuccessResponse)
async def get_pipeline_lineage(
    pipeline_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get lineage for a pipeline (sources to targets)."""
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == pipeline.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Extract lineage from pipeline config
    # TODO: Parse pipeline.config to find source and target nodes
    
    nodes = [
        LineageNodeResponse(
            id=str(pipeline_id),
            name=pipeline.name,
            type="pipeline",
            workspace_id=str(pipeline.workspace_id)
        )
    ]
    
    edges = []
    
    # If pipeline config has nodes, extract sources and targets
    if pipeline.config and "nodes" in pipeline.config:
        for node in pipeline.config["nodes"]:
            node_id = node.get("id", "")
            node_type = node.get("type", "")
            
            if node_type in ["source", "target", "transformation"]:
                nodes.append(LineageNodeResponse(
                    id=node_id,
                    name=node.get("label", node_id),
                    type=node_type
                ))
    
    # Extract edges from pipeline connections
    if pipeline.config and "edges" in pipeline.config:
        for edge in pipeline.config["edges"]:
            edges.append(LineageEdgeResponse(
                source_id=edge.get("source", ""),
                target_id=edge.get("target", ""),
                relationship="dataflow"
            ))
    
    lineage_graph = LineageGraphResponse(nodes=nodes, edges=edges)
    
    return {
        "success": True,
        "data": lineage_graph
    }

# ==================== COLUMN LINEAGE ====================

@router.get("/column/{table_id}/{column_name}", response_model=SuccessResponse)
async def get_column_lineage(
    table_id: uuid.UUID,
    column_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get lineage for a specific column."""
    table = db.query(CatalogEntry).filter(CatalogEntry.id == table_id).first()
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )
    
    # Check access
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == table.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # TODO: Implement column-level lineage tracking
    
    lineage_graph = LineageGraphResponse(nodes=[], edges=[])
    
    column_lineage = ColumnLineageResponse(
        table_id=str(table_id),
        column_name=column_name,
        lineage=lineage_graph
    )
    
    return {
        "success": True,
        "data": column_lineage
    }

# ==================== IMPACT ANALYSIS ====================

@router.get("/impact/{node_id}", response_model=SuccessResponse)
async def get_impact_analysis(
    node_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get impact analysis for a node.
    Shows all downstream tables and pipelines that depend on this node.
    """
    # TODO: Implement impact analysis
    # This would traverse the lineage graph to find all dependent nodes
    
    impact = ImpactAnalysisResponse(
        node_id=node_id,
        downstream_nodes=[],
        affected_pipelines=[],
        affected_tables=[]
    )
    
    return {
        "success": True,
        "data": impact
    }

# ==================== LINEAGE SEARCH ====================

@router.get("/search", response_model=SuccessResponse)
async def search_lineage(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Search for tables or pipelines in lineage graph."""
    # Get user's workspaces
    workspace_ids = db.query(WorkspaceMember.workspace_id).filter(
        WorkspaceMember.user_id == current_user.id
    ).all()
    workspace_ids = [w[0] for w in workspace_ids]
    
    # Search in catalog tables
    tables = db.query(CatalogEntry).filter(
        CatalogEntry.workspace_id.in_(workspace_ids) if workspace_ids else False,
        CatalogEntry.name.ilike(f"%{q}%")
    ).limit(10).all()
    
    # Search in pipelines
    pipelines = db.query(Pipeline).filter(
        Pipeline.workspace_id.in_(workspace_ids) if workspace_ids else False,
        Pipeline.name.ilike(f"%{q}%")
    ).limit(10).all()
    
    results = {
        "tables": [
            LineageNodeResponse(
                id=str(t.id),
                name=t.name,
                type="table",
                workspace_id=str(t.workspace_id)
            ) for t in tables
        ],
        "pipelines": [
            LineageNodeResponse(
                id=str(p.id),
                name=p.name,
                type="pipeline",
                workspace_id=str(p.workspace_id)
            ) for p in pipelines
        ]
    }
    
    return {
        "success": True,
        "data": results
    }
