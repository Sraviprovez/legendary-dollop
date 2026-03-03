from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import enum

Base = declarative_base()

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    DATA_ENGINEER = "data_engineer"
    DEVELOPER = "developer"
    ANALYST = "analyst"
    DEVOPS = "devops"

class WorkspaceMemberRole(str, enum.Enum):
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"

class PipelineVisibility(str, enum.Enum):
    PUBLIC = "public"
    WORKSPACE = "workspace"
    PRIVATE = "private"

class PermissionType(str, enum.Enum):
    USER = "user"
    ROLE = "role"

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    role = Column(Enum(UserRole), default=UserRole.DEVELOPER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    last_login = Column(DateTime)

class Workspace(Base):
    __tablename__ = "workspaces"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    settings = Column(JSON, default={})

class WorkspaceMember(Base):
    __tablename__ = "workspace_members"
    
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id"), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    role_in_workspace = Column(Enum(WorkspaceMemberRole), default=WorkspaceMemberRole.VIEWER)
    joined_at = Column(DateTime, default=datetime.utcnow)

class Pipeline(Base):
    __tablename__ = "pipelines"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id"))
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    config = Column(JSON, nullable=False)  # nodes and edges
    version = Column(Column(String), default="1")
    is_private = Column(Boolean, default=False)
    visibility = Column(Enum(PipelineVisibility), default=PipelineVisibility.WORKSPACE)

class PipelinePermission(Base):
    __tablename__ = "pipeline_permissions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pipeline_id = Column(UUID(as_uuid=True), ForeignKey("pipelines.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    role = Column(Enum(WorkspaceMemberRole), nullable=True)
    permission_type = Column(Enum(PermissionType))

class Source(Base):
    __tablename__ = "sources"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id"))
    type = Column(String, nullable=False) # e.g., mysql, postgresql
    connection_details = Column(JSON, nullable=False) # Encrypted
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    is_private = Column(Boolean, default=False)
    schema_cache = Column(JSON)
    airbyte_source_id = Column(String, nullable=True) # Sync with Airbyte

class Transformation(Base):
    __tablename__ = "transformations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id"))
    engine = Column(String, nullable=False) # dbt, pyspark, etc.
    config = Column(JSON, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
