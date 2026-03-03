import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Use your local PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://sriravi:rootroot@localhost:5432/auton_meta")

# For Docker to connect to host, replace localhost with host.docker.internal
if os.getenv("DOCKER_ENV"):
    DATABASE_URL = DATABASE_URL.replace("localhost", "host.docker.internal")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
