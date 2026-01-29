from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Dict, Any
import ollama

from api.auth import get_current_user

router = APIRouter(prefix="/api/v1", tags=["chat"])

class QueryRequest(BaseModel):
    prompt: str

class Resources:
    """Dependency class to provide shared resources"""
    def __init__(self):
        self.embed_model = None
        self.db = None
    
    def setup(self, embed_model, db):
        """Setup resources from main.py"""
        self.embed_model = embed_model
        self.db = db

# Create singleton instance
resources = Resources()

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
    resources: Resources = Depends(get_resources),
):
    return await get_current_user(
        authorization=authorization,
        db=resources.db
    )


@router.post("/chat")
async def chat_endpoint(
    request: QueryRequest,
    resources: Resources = Depends(get_resources),
    current_user: Dict[str, Any] = Depends(get_current_user_dep)
):
    try:
        # 1. Embed and Search
        query_vector = resources.embed_model.encode(request.prompt).tolist()
        table = resources.db.connection()
        results = table.search(query_vector).limit(3).to_list()
        
        context = "\n\n".join([r['text'] for r in results])

        # 2. Humanizing System Rules
        system_prompt = f"""
        You are a friendly, grounded, and helpful human assistant.
        
        CONTEXT:
        {context}

        RULES:
        1. Use the CONTEXT to answer the user, but speak naturally.
        2. DO NOT say "Based on the documents" or "The context states." Just answer.
        3. If the answer isn't in the context, say you're not sure, but don't be robotic.
        4. Use a warm, conversational tone. Be concise but helpful.
        5. If the user says 'Hi' or 'Hello', just be friendly and ask how you can help.
        6. User your own knowledge to handle greetings if any
        7. Avoid referrencing the context in your response, give the answer naturally
        """

        # 3. Use Llama 3 Instruct Format
        response = ollama.chat(
            model='llama3',
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': request.prompt},
            ],
            options={
                'temperature': 0.7,
                'top_p': 0.9,
            }
        )

        return {
            "answer": response['message']['content'],
            "sources": [r.get('metadata', {}).get('filename', 'Unknown') for r in results]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models")
async def get_available_models(resources: Resources = Depends(get_resources)):
    """Optional endpoint to check if resources are available"""
    return {
        "embedding_model": "all-MiniLM-L6-v2",
        "llm_model": "llama3",
        "database_connected": resources.db is not None,
        "embedding_model_loaded": resources.embed_model is not None
    }