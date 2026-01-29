"""M-Pesa payment service using Daraja API (pydaraja)"""

import os
import logging
from decimal import Decimal
from typing import Dict, Any, Optional
from pydaraja import MpesaPaymentGateway
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class PaymentService:
    """Service to handle M-Pesa payments via Daraja API"""

    def __init__(self):
        """Initialize M-Pesa API client with credentials from environment"""
        self.api_host = os.getenv("MPESA_API_HOST", "https://sandbox.safaricom.co.ke")
        self.consumer_key = os.getenv("MPESA_CONSUMER_KEY", "")
        self.consumer_secret = os.getenv("MPESA_CONSUMER_SECRET", "")
        self.business_code = os.getenv("MPESA_BUSINESS_CODE", "")
        self.passkey = os.getenv("MPESA_PASSKEY", "")
        self.callback_url = os.getenv("MPESA_CALLBACK_URL", "")
        self.environment = os.getenv("MPESA_ENVIRONMENT", "sandbox")  # sandbox or production
        self.credits_per_kes = float(os.getenv("CREDITS_PER_KES", "6.66667"))

        self.mpesa = None

        self.is_configured = bool(
            self.api_host
            and self.consumer_key
            and self.consumer_secret
            and self.business_code
            and self.passkey
            and self.callback_url
            and self.environment in ("sandbox", "production"),
        )

        if self.is_configured:
            try:
                self.mpesa = MpesaPaymentGateway(
                    api_host=self.api_host,
                    consumer_key=self.consumer_key,
                    consumer_secret=self.consumer_secret,
                    business_shortcode=self.business_code,
                    passkey=self.passkey,
                    callback_url=self.callback_url,
                    account_reference="wakili_payment"
                )
            except Exception as e:
                logger.error(f"Failed to initialize MpesaAPI: {e}")
                self.is_configured = False
        else:
            self.mpesa = None
            logger.warning("M-Pesa payment service not configured. Set MPESA_* env vars.")

    def initiate_stk_push(
        self,
        phone_number: str,
        amount: float,
        account_reference: str,
        transaction_description: str = "Payment",
    ) -> Dict[str, Any]:
        """
        Initiate M-Pesa STK Push (prompt user for PIN)

        Args:
            phone_number: Customer's phone number (format: 254XXXXXXXXX)
            amount: Amount in KES

        Returns:
            Dict with request_id, response_code, customer_message, etc.
        """
        if not self.is_configured:
            return {
                "success": False,
                "error": "M-Pesa payment service not configured",
            }

        if not self.callback_url:
            return {
                "success": False,
                "error": "MPESA_CALLBACK_URL not configured",
            }

        try:
            # Validate phone number format
            phone = str(phone_number).strip()
            if not phone.startswith("254"):
                phone = "254" + phone.lstrip("0")

            # Initiate STK Push
            self.mpesa.account_reference = account_reference
            response = self.mpesa.trigger_stk_push(
                phone_number=phone, 
                amount=amount,
                transaction_description=transaction_description,
            )
            logger.info(
                f"STK Push initiated for {phone}: {response.get('ResponseCode')}"
            )
            return {
                "success": response.get("ResponseCode") == "0",
                "response_code": response.get("ResponseCode"),
                "customer_message": response.get("CustomerMessage"),
                "checkout_request_id": response.get("CheckoutRequestID"),
                "response_description": response.get("ResponseDescription"),
            }

        except Exception as e:
            logger.error(f"STK Push failed for {phone_number}: {e}")
            return {"success": False, "error": str(e)}

    def handle_payment_callback(self, callback_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle M-Pesa payment callback (success/failure)

        Expected callback structure:
        {
            "Body": {
                "stkCallback": {
                    "MerchantRequestID": "...",
                    "CheckoutRequestID": "...",
                    "ResultCode": 0,  # 0=success, non-zero=failure
                    "ResultDesc": "...",
                    "CallbackMetadata": {
                        "Item": [...]
                    }
                }
            }
        }

        Args:
            callback_data: Raw callback data from M-Pesa

        Returns:
            Dict with parsed transaction details
        """
        try:
            body = callback_data.get("Body", {})
            stk_callback = body.get("stkCallback", {})

            result_code = stk_callback.get("ResultCode")
            result_desc = stk_callback.get("ResultDesc", "")

            # Parse callback metadata (only present on success)
            callback_metadata = {}
            if result_code == 0:
                items = stk_callback.get("CallbackMetadata", {}).get("Item", [])
                for item in items:
                    key = item.get("Name")
                    value = item.get("Value")
                    if key:
                        callback_metadata[key] = value

            return {
                "success": result_code == 0,
                "result_code": result_code,
                "result_description": result_desc,
                "merchant_request_id": stk_callback.get("MerchantRequestID"),
                "checkout_request_id": stk_callback.get("CheckoutRequestID"),
                "amount": callback_metadata.get("Amount"),
                "mpesa_receipt_number": callback_metadata.get("MpesaReceiptNumber"),
                "transaction_date": callback_metadata.get("TransactionDate"),
                "phone_number": callback_metadata.get("PhoneNumber"),
                "raw_metadata": callback_metadata,
            }

        except Exception as e:
            logger.error(f"Failed to parse payment callback: {e}")
            return {
                "success": False,
                "error": str(e),
                "result_code": -1,
            }

    def check_transaction_status(
        self, checkout_request_id: str
    ) -> Dict[str, Any]:
        """
        Query transaction status using CheckoutRequestID

        Args:
            checkout_request_id: The CheckoutRequestID from STK Push response

        Returns:
            Dict with transaction status details
        """
        if not self.is_configured:
            return {
                "success": False,
                "error": "M-Pesa payment service not configured",
            }

        try:
            response = self.mpesa.query_stk_push(
                checkout_request_id=checkout_request_id,
            )

            return {
                "success": response.get("ResponseCode") == "0",
                "response_code": response.get("ResponseCode"),
                "result_code": response.get("ResultCode"),
                "result_description": response.get("ResultDesc"),
                "checkout_request_id": checkout_request_id,
            }

        except Exception as e:
            logger.error(f"Failed to check transaction status: {e}")
            return {
                "success": False,
                "error": str(e),
            }

    # Database operations
    def log_payment_initiation(self, user_id: int, checkout_request_id: str) -> bool:
        """
        Log initial payment record when STK push is initiated

        Args:
            user_id: ID of the user initiating payment
            checkout_request_id: M-Pesa checkout request ID

        Returns:
            True if successful, False otherwise
        """
        try:
            from ..utils.db import DBClient
            db = DBClient()
            
            db.execute_query(
                """
                INSERT INTO mpesa_payments (user_id, checkout_request_id, status)
                VALUES (%s, %s, %s)
                """,
                (user_id, checkout_request_id, "initiated"),
            )
            logger.info(
                f"M-Pesa payment initiated for user {user_id}: {checkout_request_id}"
            )
            return True
        except Exception as e:
            logger.error(f"Failed to log payment initiation: {e}")
            return False

    def get_payment_record(self, checkout_request_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve payment record by checkout_request_id

        Args:
            checkout_request_id: M-Pesa checkout request ID

        Returns:
            Payment record dict or None if not found
        """
        try:
            from ..utils.db import DBClient
            db = DBClient()
            
            result = db.execute_query(
                "SELECT id, user_id FROM mpesa_payments WHERE checkout_request_id = %s",
                (checkout_request_id,),
            )
            
            if result:
                return dict(result[0])
            return None
        except Exception as e:
            logger.error(f"Failed to retrieve payment record: {e}")
            return None

    def update_successful_payment(
        self,
        checkout_request_id: str,
        phone_number: str,
        amount_kes: float,
        mpesa_receipt: str,
        callback_data: Dict[str, Any],
    ) -> bool:
        """
        Update payment record and user credits after successful M-Pesa transaction

        Args:
            checkout_request_id: M-Pesa checkout request ID
            phone_number: Customer phone number
            amount_kes: Amount in KES
            mpesa_receipt: M-Pesa receipt number
            callback_data: Full callback response from M-Pesa

        Returns:
            True if successful, False otherwise
        """
        try:
            from ..utils.db import DBClient
            db = DBClient()
            
            amount_credits = float(Decimal(str(amount_kes)) * Decimal(str(self.credits_per_kes)))
            
            # Get user_id from payment record
            payment = self.get_payment_record(checkout_request_id)
            if not payment:
                logger.error(f"Payment record not found for {checkout_request_id}")
                return False
            
            user_id = payment["user_id"]
            
            # Update mpesa_payments table
            db.execute_query(
                """
                UPDATE mpesa_payments
                SET phone_number = %s, amount_kes = %s, amount_credits = %s,
                    mpesa_receipt_number = %s, status = %s, callback_response = %s, updated_at = NOW()
                WHERE checkout_request_id = %s
                """,
                (
                    phone_number,
                    float(amount_kes),
                    amount_credits,
                    mpesa_receipt,
                    "completed",
                    callback_data,
                    checkout_request_id,
                ),
            )
            
            # Update user_credits
            db.execute_query(
                """
                INSERT INTO user_credits (user_id, balance)
                VALUES (%s, %s)
                ON CONFLICT (user_id) DO UPDATE SET
                balance = user_credits.balance + %s, updated_at = NOW()
                """,
                (
                    user_id,
                    amount_credits,
                    amount_credits,
                ),
            )
            
            # Log transaction in credit_transactions
            db.execute_query(
                """
                INSERT INTO credit_transactions (user_id, transaction_type, amount, description, reference_id)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    user_id,
                    "topup",
                    amount_credits,
                    f"M-Pesa payment: KES {amount_kes} ({mpesa_receipt})",
                    checkout_request_id,
                ),
            )
            
            logger.info(
                f"User {user_id} credited {amount_credits} credits from M-Pesa payment {mpesa_receipt}"
            )
            return True
        except Exception as e:
            logger.error(f"Error updating successful payment: {e}")
            return False

    def update_failed_payment(
        self,
        checkout_request_id: str,
        callback_data: Dict[str, Any],
    ) -> bool:
        """
        Update payment record to mark transaction as failed

        Args:
            checkout_request_id: M-Pesa checkout request ID
            callback_data: Full callback response from M-Pesa

        Returns:
            True if successful, False otherwise
        """
        try:
            from ..utils.db import DBClient
            db = DBClient()
            
            db.execute_query(
                """
                UPDATE mpesa_payments
                SET status = %s, callback_response = %s, updated_at = NOW()
                WHERE checkout_request_id = %s
                """,
                (
                    "failed",
                    callback_data,
                    checkout_request_id,
                ),
            )
            
            logger.info(f"Payment marked as failed: {checkout_request_id}")
            return True
        except Exception as e:
            logger.error(f"Error updating failed payment: {e}")
            return False
