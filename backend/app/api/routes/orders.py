from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import random, string
import stripe

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.env import env
from app.models.user import (
    User, CartItem, Order, OrderItem, PromoCode,
    LoyaltyAccount, LoyaltyTransaction, Notification, NotifType
)
from app.schemas.schemas import OrderOut, PlaceOrderRequest

router = APIRouter()

stripe.api_key = env.STRIPE_SECRET_KEY


def _order_number():
    return "#DY-" + "".join(random.choices(string.digits, k=4))


# ── Create Stripe Payment Intent ────────────────────────────
@router.post("/create-payment-intent")
async def create_payment_intent(
    payload: PlaceOrderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cart_res = await db.execute(select(CartItem).where(CartItem.user_id == current_user.id))
    cart_items = cart_res.scalars().all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    for item in cart_items:
        await db.refresh(item, ["product"])

    subtotal = sum(i.product.price * i.quantity for i in cart_items)
    discount = 0.0

    if payload.promo_code:
        pr = await db.execute(select(PromoCode).where(
            PromoCode.code == payload.promo_code.upper(),
            PromoCode.is_active == True
        ))
        promo = pr.scalar_one_or_none()
        if promo:
            discount = subtotal * promo.discount_percent / 100

    pts_discount = 0.0
    if payload.redeem_points > 0:
        lr = await db.execute(select(LoyaltyAccount).where(LoyaltyAccount.user_id == current_user.id))
        loyalty = lr.scalar_one_or_none()
        if loyalty and loyalty.points >= payload.redeem_points:
            pts_discount = (payload.redeem_points / 500) * 5

    after = subtotal - discount - pts_discount
    tax = round(after * 0.08, 2)
    total = round(after + 1.99 + tax, 2)

    # Stripe expects amount in cents
    amount_cents = int(total * 100)

    intent = stripe.PaymentIntent.create(
        amount=amount_cents,
        currency="usd",
        metadata={
            "user_id": str(current_user.id),
            "promo_code": payload.promo_code or "",
            "address_id": str(payload.address_id),
            "redeem_points": str(payload.redeem_points),
        }
    )

    return {
        "client_secret": intent.client_secret,
        "amount": total,
        "payment_intent_id": intent.id
    }


# ── Confirm Order After Successful Payment ────────────────────
@router.post("/place", response_model=OrderOut, status_code=201)
async def place_order(
    payload: PlaceOrderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify payment if payment_intent_id provided
    if hasattr(payload, 'payment_intent_id') and payload.payment_intent_id:
        intent = stripe.PaymentIntent.retrieve(payload.payment_intent_id)
        if intent.status != "succeeded":
            raise HTTPException(status_code=400, detail="Payment not completed")

    cart_res = await db.execute(select(CartItem).where(CartItem.user_id == current_user.id))
    cart_items = cart_res.scalars().all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    for item in cart_items:
        await db.refresh(item, ["product"])

    subtotal = sum(i.product.price * i.quantity for i in cart_items)
    discount = 0.0
    promo_str = None

    if payload.promo_code:
        pr = await db.execute(select(PromoCode).where(
            PromoCode.code == payload.promo_code.upper(),
            PromoCode.is_active == True
        ))
        promo = pr.scalar_one_or_none()
        if promo:
            discount = subtotal * promo.discount_percent / 100
            promo.uses_count += 1
            promo_str = promo.code

    pts_discount = 0.0
    redeemed = 0
    if payload.redeem_points > 0:
        lr = await db.execute(select(LoyaltyAccount).where(LoyaltyAccount.user_id == current_user.id))
        loyalty = lr.scalar_one_or_none()
        if loyalty and loyalty.points >= payload.redeem_points:
            redeemed = payload.redeem_points
            pts_discount = (redeemed / 500) * 5
            loyalty.points -= redeemed
            db.add(LoyaltyTransaction(account_id=loyalty.id, points=-redeemed, description="Redeemed at checkout"))

    delivery_fee = 1.99
    after = subtotal - discount - pts_discount
    tax = round(after * 0.08, 2)
    total = round(after + delivery_fee + tax, 2)
    points_earned = int(total * 10)

    order = Order(
        order_number=_order_number(),
        user_id=current_user.id,
        address_id=payload.address_id,
        subtotal=subtotal,
        discount=discount + pts_discount,
        delivery_fee=delivery_fee,
        tax=tax,
        total=total,
        promo_code=promo_str,
        points_earned=points_earned,
        points_redeemed=redeemed,
        notes=payload.notes,
        estimated_eta="25-35 min",
    )
    db.add(order)
    await db.flush()

    for item in cart_items:
        db.add(OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.product.price,
            total_price=item.product.price * item.quantity
        ))
        await db.delete(item)

    # Award loyalty points
    lr = await db.execute(select(LoyaltyAccount).where(LoyaltyAccount.user_id == current_user.id))
    loyalty = lr.scalar_one_or_none()
    if loyalty:
        loyalty.points += points_earned
        loyalty.total_earned += points_earned
        if loyalty.total_earned >= 5000: loyalty.tier = "platinum"
        elif loyalty.total_earned >= 2000: loyalty.tier = "gold"
        elif loyalty.total_earned >= 500: loyalty.tier = "silver"
        db.add(LoyaltyTransaction(account_id=loyalty.id, points=points_earned, description=f"Order {order.order_number}"))

    db.add(Notification(
        user_id=current_user.id,
        type=NotifType.order,
        icon="🚚",
        title="Order Confirmed!",
        body=f"Your order {order.order_number} is on the way! ETA: 25-35 min."
    ))
    await db.commit()
    await db.refresh(order, ["items"])
    for item in order.items:
        await db.refresh(item, ["product"])
    return order


# ── User Order Routes ─────────────────────────────────────────
@router.get("", response_model=List[OrderOut])
@router.get("/", response_model=List[OrderOut], include_in_schema=False)
async def list_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order)
        .where(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()
    for order in orders:
        await db.refresh(order, ["items"])
        for item in order.items:
            await db.refresh(item, ["product"])
    return orders


# ── Admin Routes (must be before /{order_id} to avoid conflict) ──
@router.get("/admin/all")
async def admin_list_all_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    result = await db.execute(select(Order).order_by(Order.created_at.desc()))
    orders = result.scalars().all()
    for order in orders:
        await db.refresh(order, ["items", "user"])
        for item in order.items:
            await db.refresh(item, ["product"])
    return orders


@router.patch("/admin/{order_id}/status")
async def admin_update_order_status(
    order_id: int,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    from app.models.user import OrderStatus
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = OrderStatus(payload["status"])
    db.add(Notification(
        user_id=order.user_id,
        type=NotifType.order,
        icon="🚚",
        title="Order Update",
        body=f"Your order {order.order_number} status: {payload['status'].replace('_', ' ').title()}"
    ))
    await db.commit()
    await db.refresh(order, ["items"])
    for item in order.items:
        await db.refresh(item, ["product"])
    return order


# ── User Get Single Order ─────────────────────────────────────
@router.get("/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.user_id == current_user.id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    await db.refresh(order, ["items"])
    for item in order.items:
        await db.refresh(item, ["product"])
    return order