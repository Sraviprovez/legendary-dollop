from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.base import User, UserRole, Workspace, WorkspaceMember, WorkspaceMemberRole
from app.core.security import get_password_hash
import os
import uuid

def bootstrap_system():
    db = SessionLocal()
    try:
        # Check if any user exists
        user_count = db.query(User).count()
        if user_count > 0:
            print("System already bootstrapped. Skipping.")
            return

        print("Starting system bootstrap...")
        
        admin_email = os.getenv("ADMIN_EMAIL", "admin@synkrasis.ai")
        admin_password = os.getenv("ADMIN_PASSWORD", "Admin123!")
        admin_first_name = os.getenv("ADMIN_FIRST_NAME", "System")
        admin_last_name = os.getenv("ADMIN_LAST_NAME", "Administrator")
        
        # 1. Create the first admin
        new_user = User(
            email=admin_email,
            password_hash=get_password_hash(admin_password),
            first_name=admin_first_name,
            last_name=admin_last_name,
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(new_user)
        db.flush() # Get the ID
        
        # 2. Create default workspace
        new_workspace = Workspace(
            name="Default Workspace",
            description="The primary workspace for the system admin.",
            created_by=new_user.id
        )
        db.add(new_workspace)
        db.flush()
        
        # 3. Add admin to workspace
        membership = WorkspaceMember(
            workspace_id=new_workspace.id,
            user_id=new_user.id,
            role_in_workspace=WorkspaceMemberRole.ADMIN
        )
        db.add(membership)
        
        db.commit()
        print(f"Bootstrap complete. Admin user created: {admin_email}")
        
    except Exception as e:
        db.rollback()
        print(f"Bootstrap failed: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    bootstrap_system()
