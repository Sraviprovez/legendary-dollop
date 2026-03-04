from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import (
    auth, admin, sources, pipelines, workspaces,
    catalog, quality, lineage, settings, metrics
)
from app.models.base import Base
from app.core.database import engine
from app.core.bootstrap import bootstrap_system
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    # Run bootstrap
    bootstrap_system()
    yield

app = FastAPI(title="SynKrasis Backend API", version="1.0.0", lifespan=lifespan)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(sources.router, prefix="/api")
app.include_router(pipelines.router, prefix="/api")
app.include_router(workspaces.router, prefix="/api")
app.include_router(catalog.router, prefix="/api")
app.include_router(quality.router, prefix="/api")
app.include_router(lineage.router, prefix="/api")
app.include_router(settings.router, prefix="/api")
app.include_router(metrics.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "SynKrasis Backend is running", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
