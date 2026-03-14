from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import random, string, time

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import (
    User, CartItem, Order, OrderItem, OrderStatus, PromoCode,
    LoyaltyAccount, LoyaltyTransaction, Notification, NotifType, Product
)
from app.schemas.schemas import OrderOut, PlaceOrderRequest, CancelOrderRequest

router = APIRouter()


def _order_number():
    return "#DY-" + "".join(random.choices(string.digits, k=4))


# ── Dummy Payment Intent (no Stripe) ─────────────────────────
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
            PromoCode.code == payload.promo_code.upper(), PromoCode.is_active == True
        ))
        promo = pr.scalar_one_or_none()
        if promo:
            discount = subtotal * promo.discount_percent / 100
    pts_discount = 0.0
    if payload.redeem_points > 0:
        lr = await db.execute(select(LoyaltyAccount).where(LoyaltyAccount.user_id == current_user.id))
        loyalty = lr.scalar_one_or_none()
        if loyalty and loyalty.points >= payload.redeem_points:
            pts_discount = (payload.redeem_points / 500) * 50  # 500 pts = ₹50
    after = subtotal - discount - pts_discount
    tax = round(after * 0.05, 2)  # 5% GST
    total = round(after + 29.00 + tax, 2)  # ₹29 delivery
    dummy_id = f"dummy_{current_user.id}_{int(time.time())}"
    return {"client_secret": dummy_id + "_secret", "amount": total, "payment_intent_id": dummy_id}


# ── Admin Routes ──────────────────────────────────────────────
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
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = OrderStatus(payload["status"])
    db.add(Notification(
        user_id=order.user_id, type=NotifType.order, icon="🚚", title="Order Update",
        body=f"Your order {order.order_number} status: {payload['status'].replace('_', ' ').title()}"
    ))
    await db.commit()
    await db.refresh(order, ["items"])
    for item in order.items:
        await db.refresh(item, ["product"])
    return order


# ── Place Order (dummy payment — no Stripe) ───────────────────
@router.post("/place", response_model=OrderOut, status_code=201)
async def place_order(
    payload: PlaceOrderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # No Stripe verification — accept any payment_intent_id
    cart_res = await db.execute(select(CartItem).where(CartItem.user_id == current_user.id))
    cart_items = cart_res.scalars().all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    for item in cart_items:
        await db.refresh(item, ["product"])
    for item in cart_items:
        subtotal = sum(i.product.price * i.quantity for i in cart_items)
        discount = 0.0
        promo_str = None
    if payload.promo_code:
        pr = await db.execute(select(PromoCode).where(
            PromoCode.code == payload.promo_code.upper(), PromoCode.is_active == True
        ))
        promo = pr.scalar_one_or_none()
        if promo:
            discount = subtotal * promo.discount_percent / 100
            promo.uses_count += 1
            promo_str = promo.code
    pts_discount = 0.0
    redeemed = 0
    lr = await db.execute(select(LoyaltyAccount).where(LoyaltyAccount.user_id == current_user.id))
    loyalty = lr.scalar_one_or_none()
    if payload.redeem_points > 0 and loyalty and loyalty.points >= payload.redeem_points:
        redeemed = payload.redeem_points
        pts_discount = (redeemed / 500) * 50  # 500 pts = ₹50
        loyalty.points -= redeemed
        db.add(LoyaltyTransaction(account_id=loyalty.id, points=-redeemed, description="Redeemed at checkout"))
    # Referral credit — cap at actual referral earned, max 50% of subtotal
    from app.api.routes.referrals import _get_referral_credit
    available_credit = await _get_referral_credit(current_user.id, db)
    referral_discount = min(float(payload.referral_credit or 0), available_credit, subtotal * 0.5)
    referral_discount = round(referral_discount, 2)
    delivery_fee = 29.00  # ₹29 delivery fee
    after = subtotal - discount - pts_discount - referral_discount
    tax = round(max(after, 0) * 0.05, 2)  # 5% GST
    total = round(max(after, 0) + delivery_fee + tax, 2)
    points_earned = int(total * 1)  # 1 pt per ₹1 spent
    order = Order(
        order_number=_order_number(), user_id=current_user.id, address_id=payload.address_id,
        subtotal=subtotal, discount=discount + pts_discount + referral_discount, delivery_fee=delivery_fee,
        tax=tax, total=total, promo_code=promo_str, points_earned=points_earned,
        points_redeemed=redeemed, notes=payload.notes, estimated_eta="25-35 min",
    )
    db.add(order)
    await db.flush()
    for item in cart_items:
        db.add(OrderItem(order_id=order.id, product_id=item.product_id, quantity=item.quantity,
                         unit_price=item.product.price, total_price=item.product.price * item.quantity))
        await db.delete(item)
    if loyalty:
        loyalty.points += points_earned
        loyalty.total_earned += points_earned
        if loyalty.total_earned >= 5000: loyalty.tier = "platinum"
        elif loyalty.total_earned >= 2000: loyalty.tier = "gold"
        elif loyalty.total_earned >= 500: loyalty.tier = "silver"
        db.add(LoyaltyTransaction(account_id=loyalty.id, points=points_earned, description=f"Order {order.order_number}"))
    db.add(Notification(user_id=current_user.id, type=NotifType.order, icon="🚚",
                        title="Order Confirmed!", body=f"Your order {order.order_number} is on the way! ETA: 25-35 min."))
    await db.commit()
    await db.refresh(order, ["items"])
    for item in order.items:
        await db.refresh(item, ["product"])
    return order


# ── Cancel Order ──────────────────────────────────────────────
@router.patch("/{order_id}/cancel", response_model=OrderOut)
async def cancel_order(
    order_id: int,
    payload: CancelOrderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Order).where(Order.id == order_id, Order.user_id == current_user.id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status not in (OrderStatus.pending, OrderStatus.confirmed):
        raise HTTPException(status_code=400, detail=f"Cannot cancel order with status '{order.status.value}'.")
    order.status = OrderStatus.cancelled
    await db.refresh(order, ["items"])

    # Adjust loyalty: refund redeemed points, deduct earned points
    lr = await db.execute(select(LoyaltyAccount).where(LoyaltyAccount.user_id == current_user.id))
    loyalty = lr.scalar_one_or_none()
    if loyalty:
        if order.points_redeemed > 0:
            loyalty.points += order.points_redeemed
            db.add(LoyaltyTransaction(account_id=loyalty.id, points=order.points_redeemed,
                                      description=f"Points refunded for cancelled order {order.order_number}"))
        if order.points_earned > 0:
            loyalty.points = max(0, loyalty.points - order.points_earned)
            loyalty.total_earned = max(0, loyalty.total_earned - order.points_earned)
            if loyalty.total_earned >= 5000: loyalty.tier = "platinum"
            elif loyalty.total_earned >= 2000: loyalty.tier = "gold"
            elif loyalty.total_earned >= 500: loyalty.tier = "silver"
            else: loyalty.tier = "bronze"
            db.add(LoyaltyTransaction(account_id=loyalty.id, points=-order.points_earned,
                                      description=f"Points reversed for cancelled order {order.order_number}"))

    db.add(Notification(user_id=current_user.id, type=NotifType.order, icon="❌",
                        title="Order Cancelled",
                        body=f"Your order {order.order_number} has been cancelled.{' Reason: ' + payload.reason if payload.reason else ''}"))
    await db.commit()
    await db.refresh(order, ["items"])
    for item in order.items:
        await db.refresh(item, ["product"])
    return order


# ── List Orders ───────────────────────────────────────────────
@router.get("", response_model=List[OrderOut])
@router.get("/", response_model=List[OrderOut], include_in_schema=False)
async def list_orders(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.user_id == current_user.id).order_by(Order.created_at.desc()))
    orders = result.scalars().all()
    for order in orders:
        await db.refresh(order, ["items"])
        for item in order.items:
            await db.refresh(item, ["product"])
    return orders


# ── Get Single Order ──────────────────────────────────────────
@router.get("/{order_id}", response_model=OrderOut)
async def get_order(order_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.id == order_id, Order.user_id == current_user.id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    await db.refresh(order, ["items"])
    for item in order.items:
        await db.refresh(item, ["product"])
    return order