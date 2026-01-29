from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
import bcrypt
import secrets
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/v1", tags=["auth"])

# Pydantic Models
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

# Dependency to get database
def get_db():
    from main import db
    return db

# Helper functions
def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash"""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

def create_session_token() -> str:
    """Create a secure session token"""
    return secrets.token_urlsafe(32)

# Routes
@router.post("/register", response_model=UserResponse)
async def register(
    user: UserCreate,
    db = Depends(get_db)
):
    """Register a new user"""
    try:
        # Check if user already exists
        check_query = """
            SELECT * FROM users 
            WHERE username = %s OR email = %s
        """
        existing = db.execute_query(check_query, (user.username, user.email))
        
        if existing:
            raise HTTPException(
                status_code=400, 
                detail="Username or email already exists"
            )
        
        # Hash password
        password_hash = hash_password(user.password)
        
        # Insert new user
        insert_query = """
            INSERT INTO users (username, email, password_hash)
            VALUES (%s, %s, %s)
        """
        db.execute_query(
            insert_query, 
            (user.username, user.email, password_hash)
        )

        result = existing = db.execute_query(check_query, (user.username, user.email))
        print("Results: " + str(result))
        if not result:
            raise HTTPException(status_code=500, detail="Failed to create user")
        return UserResponse(**result[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login", response_model=Token)
async def login(
    user: UserLogin,
    db = Depends(get_db)
):
    """Login user and return access token"""
    try:
        # Get user from database
        query = """
            SELECT id, username, password_hash 
            FROM users 
            WHERE username = %s AND is_active = TRUE
        """
        result = db.execute_query(query, (user.username,))
        
        if not result:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        db_user = result[0]
        
        # Verify password
        if not verify_password(user.password, db_user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Create session token
        token = create_session_token()
        expires_at = datetime.now() + timedelta(hours=24)
        
        # Store session in database
        session_query = """
            INSERT INTO user_sessions (user_id, token, expires_at)
            VALUES (%s, %s, %s)
        """
        db.execute_query(
            session_query,
            (db_user["id"], token, expires_at)
        )
        
        return Token(
            access_token=token,
            token_type="bearer",
            expires_in=86400  # 24 hours in seconds
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Dependency for protected routes
async def get_current_user(
    authorization: Optional[str] = Header(None),
    db = Depends(get_db)
) -> Dict[str, Any]:
    """Get current user from token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authorization header missing or invalid",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.replace("Bearer ", "")
    
    # Check token in database
    query = """
        SELECT u.id, u.username, u.email, u.created_at, s.expires_at
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = %s 
          AND s.is_valid = TRUE 
          AND s.expires_at > NOW()
          AND u.is_active = TRUE
    """
    result = db.execute_query(query, (token,))
    
    if not result:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return result[0]

@router.get("/current-user", response_model=UserResponse)
async def get_current_user_info(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get current user information"""
    return UserResponse(**current_user)

@router.post("/logout")
async def logout(
    current_user: Dict[str, Any] = Depends(get_current_user),
    authorization: Optional[str] = Header(None),
    db = Depends(get_db)
):
    """Logout user (invalidate token)"""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
        invalidate_query = """
            UPDATE user_sessions 
            SET is_valid = FALSE 
            WHERE token = %s
        """
        db.execute_query(invalidate_query, (token,))
    
    return {"message": "Successfully logged out"}

@router.post("/refresh")
async def refresh_token(
    current_user: Dict[str, Any] = Depends(get_current_user),
    authorization: Optional[str] = Header(None),
    db = Depends(get_db)
):
    """Refresh an existing token"""
    if authorization and authorization.startswith("Bearer "):
        old_token = authorization.replace("Bearer ", "")
        # Create new token
        new_token = create_session_token()
        expires_at = datetime.now() + timedelta(hours=24)
        
        # Update session with new token
        refresh_query = """
            UPDATE user_sessions 
            SET token = %s, expires_at = %s, created_at = NOW()
            WHERE token = %s
        """
        db.execute_query(
            refresh_query,
            (new_token, expires_at, old_token)
        )
        
        return Token(
            access_token=new_token,
            token_type="bearer",
            expires_in=86400
        )
    
    raise HTTPException(status_code=400, detail="Invalid token")