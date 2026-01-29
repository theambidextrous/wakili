"""Chat API endpoints for RAG and LLM interaction"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Dict, Any, Optional

from services.chat_service import ChatService
from services.subscription_service import SubscriptionService
from services.auth_service import AuthService

router = APIRouter(prefix="/api/v1", tags=["chat"])

class QueryRequest(BaseModel):
    prompt: str

class ChatResources:
    """Dependency class to provide shared resources"""
    def __init__(self):
        self.embed_model = None
        self.db = None
    
    def setup(self, embed_model, db):
        """Setup resources from main.py"""
        self.embed_model = embed_model
        self.db = db

# Create singleton instance
resources = ChatResources()

async def get_resources():
    """Dependency function to get shared resources"""
    if resources.embed_model is None or resources.db is None:
        raise HTTPException(
            status_code=500, 
            detail="Resources not initialized. Call setup() first."
        )
    return resources

def setup_chat_resources(embed_model, db):
    """Call this from main.py to initialize resources"""
    resources.setup(embed_model, db)

async def get_current_user_dep(
    authorization: str = Header(...),
    resources_obj: ChatResources = Depends(get_resources),
):
    """Get current user from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authorization header missing or invalid"
        )
    token = authorization.replace("Bearer ", "")
    auth_service = AuthService(resources_obj.db)
    user = auth_service.get_current_user(token)
    return user


@router.post("/chat")
async def chat_endpoint(
    request: QueryRequest,
    resources_obj: ChatResources = Depends(get_resources),
    current_user: Dict[str, Any] = Depends(get_current_user_dep)
):
    """Chat endpoint for RAG-based legal Q&A"""
    try:
        user_id = current_user["id"]
        
        # Initialize chat service with dependencies
        subscription_service = SubscriptionService(resources_obj.db)
        chat_service = ChatService(resources_obj.embed_model, resources_obj.db, subscription_service)
        
        # Process chat query
        return chat_service.process_chat(user_id, request.prompt)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models")
async def get_available_models(resources_obj: ChatResources = Depends(get_resources)):
    """Get available model information"""
    subscription_service = SubscriptionService(resources_obj.db)
    chat_service = ChatService(resources_obj.embed_model, resources_obj.db, subscription_service)
    return chat_service.get_chat_models()
