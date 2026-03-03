from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.models.base import User, UserRole, Workspace, WorkspaceMember, WorkspaceMemberRole
from jose import JWTError, jwt
import os

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = os.getenv("JWT_SECRET", "super-secret-key-change-me")
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "success": True,
        "data": {
            "id": str(current_user.id),
            "email": current_user.email,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "role": current_user.role
        }
    }

@router.post("/register")
async def register(db: Session = Depends(get_db)):
    # Check if any user exists
    user_count = db.query(User).count()
    if user_count > 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registration is only allowed for the first admin user. Use the Admin panel to add more users."
        )
    
    admin_email = os.getenv("ADMIN_EMAIL", "admin@synkrasis.ai")
    admin_password = os.getenv("ADMIN_PASSWORD", "changeme123")
    
    # Create the first admin
    new_user = User(
        email=admin_email,
        password_hash=get_password_hash(admin_password),
        first_name="Admin",
        last_name="System",
        role=UserRole.ADMIN,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create default workspace
    new_workspace = Workspace(
        name="Default Workspace",
        description="The primary workspace for the system admin.",
        created_by=new_user.id
    )
    db.add(new_workspace)
    db.commit()
    db.refresh(new_workspace)
    
    # Add admin to workspace
    membership = WorkspaceMember(
        workspace_id=new_workspace.id,
        user_id=new_user.id,
        role_in_workspace=WorkspaceMemberRole.ADMIN
    )
    db.add(membership)
    db.commit()
    
    return {"success": True, "message": "Admin user and default workspace created successfully."}
