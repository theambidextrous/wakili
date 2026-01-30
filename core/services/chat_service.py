"""Chat service for RAG pipeline and Llama integration"""

import ollama
import time
import json
from typing import Dict, Any
from fastapi import HTTPException


class ChatService:
    """Service to handle chat operations with RAG and LLM"""

    def __init__(self, embed_model, db, subscription_service):
        """Initialize with embedding model, database, and subscription service"""
        self.embed_model = embed_model
        self.db = db
        self.subscription_service = subscription_service

    def process_chat(
        self,
        user_id: int,
        prompt: str,
        limit_results: int = 3,
        model: str = "llama3",
        temperature: float = 0.7,
        top_p: float = 0.9
    ) -> Dict[str, Any]:
        """
        Process user chat query with RAG and LLM

        Args:
            user_id: User ID making the request
            prompt: User's question
            limit_results: Number of context results to retrieve
            model: LLM model to use
            temperature: LLM temperature setting
            top_p: LLM top_p setting

        Returns:
            Dict with answer, sources, profiling, and credit information
        """
        profiling = {}

        try:
            # Check user credits before proceeding
            user_credits = self.subscription_service.get_user_credits(user_id)
            if user_credits["available_credits"] < 0.1:  # Minimum 0.1 credits to chat
                raise HTTPException(
                    status_code=402,
                    detail=f"Insufficient credits. Available: {user_credits['available_credits']}"
                )

            # 1. Embed and Search
            start_embed = time.time()
            query_vector = self.embed_model.encode(prompt).tolist()
            profiling['embedding_time_ms'] = round((time.time() - start_embed) * 1000, 2)

            start_search = time.time()
            table = self.db.connection()
            results = table.search(query_vector).limit(limit_results).to_list()
            profiling['search_time_ms'] = round((time.time() - start_search) * 1000, 2)

            context = "\n\n".join([r['text'] for r in results])

            # 2. Build System Prompt
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
        6. Use your own knowledge to handle greetings if needed.
        7. Avoid referencing the context in your response, give the answer naturally.
        8. Assume all the questions are about Kenyan law.
        """

            # 3. Generate Response with LLM
            start_llm = time.time()
            response = ollama.chat(
                model=model,
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': prompt},
                ],
                options={
                    'temperature': temperature,
                    'top_p': top_p,
                }
            )
            profiling['llm_generation_time_ms'] = round((time.time() - start_llm) * 1000, 2)

            # Calculate total time
            profiling['total_time_ms'] = round(
                profiling['embedding_time_ms'] +
                profiling['search_time_ms'] +
                profiling['llm_generation_time_ms'],
                2
            )

            # Get response text and estimate token count
            response_text = response['message']['content']
            # Rough estimation: ~5 characters per token
            token_count = len(response_text) // 5

            # Deduct credits based on token count
            deduction_result = self.subscription_service.deduct_credits(user_id, token_count)

            # Store chat history
            history_query = """
                INSERT INTO chat_history (user_id, prompt, response, sources)
                VALUES (%s, %s, %s, %s)
            """
            sources_json = [r.get('metadata', {}).get('filename', 'Unknown') for r in results]
            self.db.execute_query(
                history_query,
                (user_id, prompt, response_text, json.dumps(sources_json))
            )

            return {
                "answer": response_text,
                "sources": sources_json,
                "profiling": profiling,
                "credits": {
                    "tokens_used": token_count,
                    "credits_deducted": deduction_result["credits_deducted"],
                    "remaining_credits": deduction_result["remaining_credits"],
                    "expires_at": deduction_result["expires_at"]
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def get_chat_models(self) -> Dict[str, Any]:
        """Return available model information"""
        return {
            "embedding_model": "all-MiniLM-L6-v2",
            "llm_model": "llama3",
            "database_connected": self.db is not None,
            "embedding_model_loaded": self.embed_model is not None
        }
