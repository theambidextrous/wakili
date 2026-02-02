"""Authentication API endpoints"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

from services.auth_service import AuthService
from services.email_service import EmailService
from services.subscription_service import SubscriptionService

router = APIRouter(prefix="/api/v1", tags=["auth"])

# Pydantic Models
class UserCreate(BaseModel):
    username: str
    name: Optional[str] = None
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
    name: Optional[str] = None
    email: str
    email_verified: bool
    created_at: datetime

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str

class GoogleToken(BaseModel):
    id_token: str

# Dependency to get database
def get_db():
    from main import db
    return db

# Dependency for protected routes
async def get_current_user(
    authorization: Optional[str] = Header(None),
    db = Depends(get_db)
) -> Dict[str, Any]:
    """Get current user from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authorization header missing or invalid",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.replace("Bearer ", "")

    auth_service = AuthService(db)
    return auth_service.get_current_user(token)


@router.post("/register", response_model=UserResponse)
async def register(
    user: UserCreate,
    db = Depends(get_db)
):
    """Register a new user with initial subscription"""
    try:
        # Register user via service
        auth_service = AuthService(db)
        user_data = auth_service.register_user(user.username, user.email, user.password, user.name)
        user_id = user_data["id"]

        # Initialize subscription with 1000 credits
        subscription_service = SubscriptionService(db)
        subscription_service.initialize_user_subscription(user_id)

        # Generate and send verification email
        email_service = EmailService()
        verification_code = EmailService.generate_verification_code()

        # Store verification code via service
        auth_service.update_verification_code(user_id, verification_code)

        # Send email with verification code
        email_service.send_verification_email(user.email, user.username, verification_code)

        return UserResponse(**user_data)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login", response_model=Token)
async def login(
    user: UserLogin,
    db = Depends(get_db)
):
    """Login user and return JWT access token"""
    auth_service = AuthService(db)
    token_data = auth_service.login_user(user.username, user.password)

    return Token(
        access_token=token_data["access_token"],
        token_type=token_data["token_type"],
        expires_in=token_data["expires_in"]
    )


@router.get("/current-user", response_model=UserResponse)
async def get_current_user_info(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get current user information"""
    return UserResponse(**current_user)


@router.post("/verify-email")
async def verify_email(
    request: VerifyEmailRequest,
    db = Depends(get_db)
):
    """Verify user email with verification code"""
    auth_service = AuthService(db)
    result = auth_service.verify_email(request.email, request.code)
    
    # Send welcome email on successful verification
    if "account_status" in result and result["account_status"] == "active":
        email_service = EmailService()
        query = "SELECT username FROM users WHERE email = %s"
        user_result = db.execute_query(query, (request.email,))
        if user_result:
            email_service.send_welcome_email(request.email, user_result[0]["username"])
    
    return result


@router.post("/social-login/google", response_model=Token)
async def google_social_login(
    token: GoogleToken,
    db = Depends(get_db)
):
    """Login/register a user using a Google ID token (id_token).

    If a new user is created via Google sign-in, initialize their subscription and send a welcome email.
    """
    auth_service = AuthService(db)
    result = auth_service.social_login_google(token.id_token)
    user = result.get("user")

    # If user was just created, initialize subscription and send welcome email
    if result.get("created") and user:
        try:
            subscription_service = SubscriptionService(db)
            subscription_service.initialize_user_subscription(user["id"])

            email_service = EmailService()
            email_service.send_welcome_email(user["email"], user.get("username"))
        except Exception:
            # Non-fatal: don't block login if subscription or welcome email fails
            pass

    return Token(
        access_token=result["access_token"],
        token_type=result["token_type"],
        expires_in=result["expires_in"]
    )


@router.post("/resend-verification")
async def resend_verification(
    email: EmailStr,
    db = Depends(get_db)
):
    """Resend verification code to user email"""
    try:
        auth_service = AuthService(db)
        result = auth_service.resend_verification_code(email)
        user = result["user"]

        # Generate new verification code
        email_service = EmailService()
        verification_code = EmailService.generate_verification_code()

        # Update verification code via service
        auth_service.update_verification_code(user["id"], verification_code)

        # Send verification email
        email_service.send_verification_email(user["email"], user["username"], verification_code)

        return {
            "message": "Verification code sent to your email",
            "email": user["email"]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/logout")
async def logout(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Logout user (JWT tokens are stateless, but you can blacklist if needed)"""
    return {"message": "Successfully logged out"}


@router.post("/refresh")
async def refresh_token(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_db)
):
    """Refresh an existing JWT token"""
    auth_service = AuthService(db)
    
    # Create new JWT token with updated expiration
    token_data = {
        "sub": str(current_user["id"]),
        "username": current_user["username"],
        "name": current_user.get("name"),
        "email": current_user["email"]
    }
    access_token_expires = timedelta(hours=24)
    new_access_token = auth_service.create_access_token(data=token_data, expires_delta=access_token_expires)
    
    return Token(
        access_token=new_access_token,
        token_type="bearer",
        expires_in=24 * 3600
    )
