import lancedb
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import ollama
import os

app = FastAPI()

# Configuration
DB_PATH = "../core/data/lancedb"
TABLE_NAME = "docling"
embed_model = SentenceTransformer('all-MiniLM-L6-v2')
db = lancedb.connect(DB_PATH)

class QueryRequest(BaseModel):
    prompt: str

@app.post("/chat")
async def chat_endpoint(request: QueryRequest):
    try:
        # 1. Embed and Search
        query_vector = embed_model.encode(request.prompt).tolist()
        table = db.open_table(TABLE_NAME)
        results = table.search(query_vector).limit(3).to_list()
        
        context = "\n\n".join([r['text'] for r in results])

        # 2. Humanizing System Rules
        # These rules prevent the "AI-sounding" repetitive patterns
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
        # This structure helps Llama 3 specifically stay in character
        response = ollama.chat(
            model='llama3',
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': request.prompt},
            ],
            options={
                'temperature': 0.7, # Adds a touch of "personality" variability
                'top_p': 0.9,
            }
        )

        return {
            "answer": response['message']['content'],
            "sources": [r.get('metadata', {}).get('filename', 'Unknown') for r in results]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)