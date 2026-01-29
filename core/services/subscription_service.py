"""Subscription and credit management service"""

from typing import Dict, Any
from datetime import datetime, timedelta
from fastapi import HTTPException
import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

class SubscriptionService:
    """Service to manage user subscriptions and credits"""

    # Constants
    INITIAL_CREDITS = int(os.getenv("INITIAL_CREDITS", 1000))
    CREDITS_VALIDITY_DAYS = int(os.getenv("CREDITS_VALIDITY_DAYS", 180))  # 6 months
    COST_PER_TOKEN = float(os.getenv("COST_PER_TOKEN", 0.0005))  # Cost per token in credits

    def __init__(self, db):
        """Initialize with database client"""
        self.db = db

    def initialize_user_subscription(self, user_id: int) -> Dict[str, Any]:
        """
        Initialize subscription for a new user with 1000 credits
        Creates a single credit balance row per user
        """
        try:
            created_at = datetime.now()
            expires_at = created_at + timedelta(days=self.CREDITS_VALIDITY_DAYS)

            # Check if subscription already exists
            check_query = """
                SELECT id FROM user_credits WHERE user_id = %s
            """
            existing = self.db.execute_query(check_query, (user_id,))

            if existing:
                # Update existing subscription
                update_query = """
                    UPDATE user_credits
                    SET amount = %s, expires_at = %s, is_active = TRUE, updated_at = NOW()
                    WHERE user_id = %s
                """
                self.db.execute_query(
                    update_query,
                    (self.INITIAL_CREDITS, expires_at, user_id)
                )
            else:
                # Create new subscription
                insert_query = """
                    INSERT INTO user_credits (user_id, amount, expires_at, created_at)
                    VALUES (%s, %s, %s, %s)
                """
                self.db.execute_query(
                    insert_query,
                    (user_id, self.INITIAL_CREDITS, expires_at, created_at)
                )

            return {
                "user_id": user_id,
                "credits": self.INITIAL_CREDITS,
                "expires_at": expires_at.isoformat(),
                "message": "Subscription initialized successfully"
            }
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to initialize subscription: {str(e)}"
            )

    def get_user_credits(self, user_id: int) -> Dict[str, Any]:
        """
        Get current credit balance for a user
        Returns 0 if credits are expired
        """
        try:
            query = """
                SELECT 
                    amount,
                    expires_at
                FROM user_credits
                WHERE user_id = %s 
                  AND is_active = TRUE
            """
            result = self.db.execute_query(query, (user_id,))

            if not result:
                return {
                    "user_id": user_id,
                    "available_credits": 0,
                    "expires_at": None
                }

            row = result[0]
            available_credits = float(row["amount"])
            expires_at = row["expires_at"]

            # Check if credits have expired
            if expires_at and datetime.now() > expires_at:
                return {
                    "user_id": user_id,
                    "available_credits": 0,
                    "expires_at": expires_at.isoformat() if expires_at else None,
                    "status": "expired"
                }

            return {
                "user_id": user_id,
                "available_credits": available_credits,
                "expires_at": expires_at.isoformat() if expires_at else None
            }
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to retrieve credits: {str(e)}"
            )

    def deduct_credits(self, user_id: int, token_count: int) -> Dict[str, Any]:
        """
        Deduct credits based on token count (cost = token_count * COST_PER_TOKEN)
        Updates single credit balance row per user
        """
        try:
            cost = token_count * self.COST_PER_TOKEN

            # Get user's current credit balance
            get_credits_query = """
                SELECT id, amount, expires_at
                FROM user_credits
                WHERE user_id = %s 
                  AND is_active = TRUE
                FOR UPDATE
            """
            credits = self.db.execute_query(get_credits_query, (user_id,))

            if not credits:
                raise HTTPException(
                    status_code=402,
                    detail="No active subscription found"
                )

            credit_row = credits[0]
            available = float(credit_row["amount"])
            expires_at = credit_row["expires_at"]

            # Check if credits expired
            if expires_at and datetime.utcnow() > expires_at:
                raise HTTPException(
                    status_code=402,
                    detail="Credits have expired"
                )

            if available < cost:
                raise HTTPException(
                    status_code=402,
                    detail=f"Insufficient credits. Available: {available}, Required: {cost}"
                )

            # Deduct credits from the single balance row
            new_balance = available - cost
            update_query = """
                UPDATE user_credits
                SET amount = %s, updated_at = NOW()
                WHERE id = %s
            """
            self.db.execute_query(update_query, (new_balance, credit_row["id"]))

            # Log the deduction
            log_query = """
                INSERT INTO credit_transactions (user_id, transaction_type, amount, description)
                VALUES (%s, %s, %s, %s)
            """
            self.db.execute_query(
                log_query,
                (user_id, "deduction", cost, f"Chat response: {token_count} tokens")
            )

            return {
                "user_id": user_id,
                "tokens_used": token_count,
                "credits_deducted": cost,
                "remaining_credits": new_balance,
                "expires_at": expires_at.isoformat() if expires_at else None
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to deduct credits: {str(e)}"
            )

    def add_credits(self, user_id: int, amount: float, description: str = "") -> Dict[str, Any]:
        """
        Add credits to a user's account (admin/billing operation)
        Updates the single credit balance row per user
        """
        try:
            # Get existing subscription
            get_query = """
                SELECT id, amount, expires_at FROM user_credits WHERE user_id = %s AND is_active = TRUE
            """
            existing = self.db.execute_query(get_query, (user_id,))

            if not existing:
                # Create new subscription with added credits
                created_at = datetime.utcnow()
                expires_at = created_at + timedelta(days=self.CREDITS_VALIDITY_DAYS)

                insert_query = """
                    INSERT INTO user_credits (user_id, amount, expires_at, created_at)
                    VALUES (%s, %s, %s, %s)
                """
                self.db.execute_query(
                    insert_query,
                    (user_id, amount, expires_at, created_at)
                )
                new_total = amount
                expires_at_result = expires_at.isoformat()
            else:
                # Update existing subscription by adding to current amount
                credit_row = existing[0]
                new_total = float(credit_row["amount"]) + amount
                expires_at_result = credit_row["expires_at"].isoformat() if credit_row["expires_at"] else None

                update_query = """
                    UPDATE user_credits
                    SET amount = %s, updated_at = NOW()
                    WHERE user_id = %s
                """
                self.db.execute_query(
                    update_query,
                    (new_total, user_id)
                )

            # Log the transaction
            log_query = """
                INSERT INTO credit_transactions (user_id, transaction_type, amount, description)
                VALUES (%s, %s, %s, %s)
            """
            self.db.execute_query(
                log_query,
                (user_id, "addition", amount, description or "Credits added")
            )

            return {
                "user_id": user_id,
                "credits_added": amount,
                "total_available_credits": new_total,
                "expires_at": expires_at_result
            }
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to add credits: {str(e)}"
            )

    def get_credit_history(self, user_id: int, limit: int = 50) -> list:
        """
        Get transaction history for a user
        """
        try:
            query = """
                SELECT 
                    id,
                    user_id,
                    transaction_type,
                    amount,
                    description,
                    created_at
                FROM credit_transactions
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT %s
            """
            return self.db.execute_query(query, (user_id, limit))
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to retrieve credit history: {str(e)}"
            )
