from fastapi import FastAPI, HTTPException
from sentence_transformers import SentenceTransformer
from utils.db import DBClient
from datetime import datetime
from api import chat, auth, payment

app = FastAPI()

# Initialize global resources
embed_model = SentenceTransformer('all-MiniLM-L6-v2')
db = DBClient()

# Setup resources for chat API
chat.setup_chat_resources(embed_model, db)

# Include routers
app.include_router(chat.router)
app.include_router(auth.router)
app.include_router(payment.router)


@app.get("/")
async def root():
    return {"status": "Wakili API is running"}

@app.get("/health")
async def health_check():
    """Health check endpoint for all services"""
    health_status = db.health_check()
    
    return {
        "status": "healthy" if all(health_status.values()) else "degraded",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "api": True,
            "embedding_model": embed_model is not None,
            **health_status
        }
    }

# Add a test endpoint to verify both databases work
@app.get("/test-db")
async def test_databases():
    """Test both database connections"""
    try:
        # Test LanceDB
        lance_table = db.connection()
        lance_count = lance_table.count_rows()
        
        # Test PostgreSQL
        pg_conn = db.connection_pgsql()
        with pg_conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) as count FROM users")
            pg_result = cursor.fetchone()
        
        return {
            "lancedb": {
                "connected": True,
                "table": db.lance_table_name,
                "row_count": lance_count
            },
            "postgresql": {
                "connected": True,
                "database": db.pg_database,
                "user_count": pg_result["count"] if pg_result else 0
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)