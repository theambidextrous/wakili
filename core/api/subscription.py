"""Subscription and Credit Management API endpoints"""

from typing import Dict, Any, Optional
from fastapi import HTTPException, APIRouter, Depends, Header
from pydantic import BaseModel

from services.subscription_service import SubscriptionService
from services.auth_service import AuthService

# API Router
router = APIRouter(prefix="/api/v1", tags=["subscription"])

# Pydantic Models
class CreditsResponse(BaseModel):
    available_credits: float
    next_expiration: Optional[str]

class AddCreditsRequest(BaseModel):
    amount: float
    description: Optional[str] = ""

# Dependency to get database
def get_db():
    from main import db
    return db

# Dependency for authentication
async def get_current_user_from_header(
    authorization: str = Header(...)
):
    """Extract and verify JWT token"""
    from main import db
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authorization header missing or invalid"
        )
    token = authorization.replace("Bearer ", "")
    auth_service = AuthService(db)
    payload = auth_service.verify_token(token)
    return payload.get("sub")


# API Endpoints
@router.get("/credits", response_model=CreditsResponse)
async def get_user_credits_endpoint(
    user_id: str = Depends(get_current_user_from_header),
    db = Depends(get_db)
):
    """Get current user's available credits"""
    subscription_service = SubscriptionService(db)
    return subscription_service.get_user_credits(int(user_id))


@router.get("/credits/history")
async def get_credit_history_endpoint(
    limit: int = 50,
    user_id: str = Depends(get_current_user_from_header),
    db = Depends(get_db)
):
    """Get user's credit transaction history"""
    subscription_service = SubscriptionService(db)
    history = subscription_service.get_credit_history(int(user_id), limit)
    return {
        "user_id": int(user_id),
        "transactions": history,
        "total_records": len(history)
    }


@router.post("/credits/add")
async def add_credits_endpoint(
    request: AddCreditsRequest,
    user_id: str = Depends(get_current_user_from_header),
    db = Depends(get_db)
):
    """Add credits to user account"""
    if request.amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Amount must be greater than 0"
        )
    
    subscription_service = SubscriptionService(db)
    return subscription_service.add_credits(
        int(user_id),
        request.amount,
        request.description
    )
