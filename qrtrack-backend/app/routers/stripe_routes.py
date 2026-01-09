from fastapi import APIRouter, HTTPException, Request, Depends, Header
from app.schemas import CheckoutResponse, PortalResponse
from app.auth import get_current_user_id
from app.database import get_db
import stripe
import os

router = APIRouter(prefix="/stripe", tags=["stripe"])

STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
STRIPE_PRICE_ID = os.environ.get("STRIPE_PRICE_ID", "")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

@router.post("/create-checkout", response_model=CheckoutResponse)
async def create_checkout(user_id: int = Depends(get_current_user_id)):
    if not STRIPE_SECRET_KEY or not STRIPE_PRICE_ID:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT email, stripe_customer_id FROM users WHERE id = ?",
            (user_id,)
        )
        user = await cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        customer_id = user["stripe_customer_id"]
        
        if not customer_id:
            customer = stripe.Customer.create(
                email=user["email"],
                metadata={"user_id": str(user_id)}
            )
            customer_id = customer.id
            await db.execute(
                "UPDATE users SET stripe_customer_id = ? WHERE id = ?",
                (customer_id, user_id)
            )
            await db.commit()
        
        checkout_session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{
                "price": STRIPE_PRICE_ID,
                "quantity": 1,
            }],
            mode="subscription",
            success_url=f"{FRONTEND_URL}/dashboard?success=true",
            cancel_url=f"{FRONTEND_URL}/pricing?canceled=true",
            metadata={"user_id": str(user_id)}
        )
        
        return CheckoutResponse(checkout_url=checkout_session.url)

@router.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="Webhook not configured")
    
    payload = await request.body()
    
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("metadata", {}).get("user_id")
        subscription_id = session.get("subscription")
        
        if user_id:
            async with get_db() as db:
                await db.execute(
                    "UPDATE users SET subscription_status = 'pro', subscription_id = ? WHERE id = ?",
                    (subscription_id, int(user_id))
                )
                await db.commit()
    
    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        subscription_id = subscription["id"]
        
        async with get_db() as db:
            await db.execute(
                "UPDATE users SET subscription_status = 'free', subscription_id = NULL WHERE subscription_id = ?",
                (subscription_id,)
            )
            await db.commit()
    
    elif event["type"] == "customer.subscription.updated":
        subscription = event["data"]["object"]
        subscription_id = subscription["id"]
        status = subscription["status"]
        
        new_status = "pro" if status == "active" else "free"
        
        async with get_db() as db:
            await db.execute(
                "UPDATE users SET subscription_status = ? WHERE subscription_id = ?",
                (new_status, subscription_id)
            )
            await db.commit()
    
    return {"status": "success"}

@router.get("/portal", response_model=PortalResponse)
async def get_portal(user_id: int = Depends(get_current_user_id)):
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT stripe_customer_id FROM users WHERE id = ?",
            (user_id,)
        )
        user = await cursor.fetchone()
        
        if not user or not user["stripe_customer_id"]:
            raise HTTPException(status_code=400, detail="No subscription found")
        
        portal_session = stripe.billing_portal.Session.create(
            customer=user["stripe_customer_id"],
            return_url=f"{FRONTEND_URL}/dashboard",
        )
        
        return PortalResponse(portal_url=portal_session.url)
