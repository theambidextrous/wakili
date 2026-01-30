"""Payment API endpoints for M-Pesa transactions"""

import logging
from fastapi import APIRouter, HTTPException, Request, Depends, Header
from pydantic import BaseModel, Field
from typing import Optional

from services.payment_service import PaymentService

logger = logging.getLogger(__name__)
payment_service = PaymentService()

router = APIRouter(prefix="/api/payments", tags=["payments"])


class InitiatePaymentRequest(BaseModel):
    """Request to initiate M-Pesa payment"""

    phone_number: str = Field(..., description="Customer phone number (e.g., 254XXXXXXXXX)")
    amount: float = Field(..., gt=0, description="Amount in KES")
    description: Optional[str] = Field(
        "Credit Purchase", description="Transaction description"
    )


class PaymentResponse(BaseModel):
    """Response from payment initiation"""

    success: bool
    request_id: Optional[str] = None
    checkout_request_id: Optional[str] = None
    response_code: Optional[str] = None
    customer_message: Optional[str] = None
    error: Optional[str] = None


class PaymentStatusResponse(BaseModel):
    """Response for payment status check"""

    success: bool
    result_code: Optional[str] = None
    result_description: Optional[str] = None
    error: Optional[str] = None


def get_current_user_from_header(
    authorization: str = Header(...),
):
    """Extract and verify JWT token to get current user"""
    from api.auth import verify_token
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authorization header missing or invalid",
        )
    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)
    return payload.get("sub")


@router.post("/initiate", response_model=PaymentResponse)
async def initiate_payment(
    request: InitiatePaymentRequest,
    user_id: str = Depends(get_current_user_from_header),
):
    """
    Initiate M-Pesa STK Push payment (requires authentication)

    - **phone_number**: Customer phone number (format: 254XXXXXXXXX)
    - **amount**: Amount in KES (must be > 0)
    - **description**: Transaction description (default: "Credit Purchase")
    """
    if not payment_service.is_configured:
        raise HTTPException(
            status_code=503,
            detail="Payment service not configured. Please set M-Pesa credentials.",
        )

    try:
        # Use user_id as account reference
        account_ref = f"user_{user_id}"

        result = payment_service.initiate_stk_push(
            phone_number=request.phone_number,
            amount=request.amount,
            account_reference=account_ref,
            transaction_description=request.description or "Credit Purchase",
        )

        if result.get("success"):
            checkout_request_id = result.get("checkout_request_id")
            
            # Log payment record via service layer
            payment_service.log_payment_initiation(int(user_id), checkout_request_id)
            
            return PaymentResponse(
                success=True,
                request_id=result.get("request_id"),
                checkout_request_id=checkout_request_id,
                response_code=result.get("response_code"),
                customer_message=result.get("customer_message"),
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Failed to initiate payment"),
            )

    except Exception as e:
        logger.error(f"Payment initiation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/callback")
async def payment_callback(request: Request):
    """
    Handle M-Pesa payment callback

    This endpoint receives payment status updates from M-Pesa Daraja API.
    It processes successful/failed transactions and updates user credits.
    Exchange rate: 1 KES = 6.66667 credits
    """
    try:
        callback_data = await request.json()
        logger.info(f"Payment callback received: {callback_data}")

        # Parse callback to extract checkout_request_id and transaction details
        result = payment_service.handle_payment_callback(callback_data)
        checkout_request_id = result.get("checkout_request_id")
        
        if result.get("success"):
            # Transaction successful - update via service layer
            amount_kes = result.get("amount", 0)
            phone_number = result.get("phone_number")
            mpesa_receipt = result.get("mpesa_receipt_number")

            logger.info(
                f"Payment successful: {mpesa_receipt} - KES {amount_kes}"
            )

            # Let service handle all DB operations
            success = payment_service.update_successful_payment(
                checkout_request_id=checkout_request_id,
                phone_number=phone_number,
                amount_kes=amount_kes,
                mpesa_receipt=mpesa_receipt,
                callback_data=callback_data,
            )

            if not success:
                logger.error(f"Failed to update successful payment in DB")
        else:
            # Transaction failed - update status only via service layer
            result_desc = result.get("result_description")
            logger.warning(f"Payment failed: {result_desc}")
            
            payment_service.update_failed_payment(
                checkout_request_id=checkout_request_id,
                callback_data=callback_data,
            )

        # Return 200 to M-Pesa to acknowledge receipt
        return {"ResultCode": "0", "ResultDesc": "Received"}

    except Exception as e:
        logger.error(f"Error processing payment callback: {e}")
        return {"ResultCode": "1", "ResultDesc": f"Error: {str(e)}"}


@router.get("/status/{checkout_request_id}", response_model=PaymentStatusResponse)
async def check_payment_status(checkout_request_id: str):
    """
    Check payment transaction status

    - **checkout_request_id**: The CheckoutRequestID from the initiate payment response
    """
    if not payment_service.is_configured:
        raise HTTPException(
            status_code=503,
            detail="Payment service not configured",
        )

    try:
        result = payment_service.check_transaction_status(checkout_request_id)

        return PaymentStatusResponse(
            success=result.get("success"),
            result_code=result.get("result_code"),
            result_description=result.get("result_description"),
            error=result.get("error"),
        )

    except Exception as e:
        logger.error(f"Status check error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
