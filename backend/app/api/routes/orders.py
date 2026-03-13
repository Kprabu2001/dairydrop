from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
import random, string, time

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.models.user import (
    User, CartItem, Order, OrderItem, OrderStatus, PromoCode,
    LoyaltyAccount, LoyaltyTransaction, Notification, NotifType, Product
)
from app.schemas.schemas import OrderOut, PlaceOrderRequest, CancelOrderRequest

router = APIRouter()


def _order_number():
    return "#DY-" + "".join(random.choices(string.digits, k=4))


# ── Shared eager-load helper — replaces all N+1 loops ────────
def _orders_with_items():
    """selectinload items+product in 2 queries regardless of result count."""
    return (
        select(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product)
        )
    )


# ── Dummy Payment Intent (no Stripe) ─────────────────────────
@router.post("/create-payment-intent")
async def create_payment_intent(
    payload: PlaceOrderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cart_res = await db.execute(
        select(CartItem)
        .where(CartItem.user_id == current_user.id)
        .options(selectinload(CartItem.product))
    )
    cart_items = cart_res.scalars().all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

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
            raw_discount = (payload.redeem_points / 100) * 10  # 100 pts = ₹10
            pts_discount = min(raw_discount, subtotal * 0.5)   # cap at 50% of subtotal

    after = subtotal - discount - pts_discount
    tax = round(after * 0.08, 2)
    total = round(after + 1.99 + tax, 2)
    dummy_id = f"dummy_{current_user.id}_{int(time.time())}"
    return {"client_secret": dummy_id + "_secret", "amount": total, "payment_intent_id": dummy_id}


# ── Admin Routes — registered BEFORE /{order_id} ─────────────
@router.get("/admin/all")
async def admin_list_all_orders(
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        _orders_with_items()
        .options(selectinload(Order.user))
        .order_by(Order.created_at.desc())
    )
    return result.scalars().all()


@router.patch("/admin/{order_id}/status")
async def admin_update_order_status(
    order_id: int,
    payload: dict,
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        _orders_with_items().where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = OrderStatus(payload["status"])
    db.add(Notification(
        user_id=order.user_id, type=NotifType.order, icon="🚚", title="Order Update",
        body=f"Your order {order.order_number} status: {payload['status'].replace('_', ' ').title()}"
    ))
    await db.commit()
    # Refresh only the scalar fields — relationships already loaded
    await db.refresh(order)
    return order


# ── Place Order (dummy payment — no Stripe) ───────────────────
@router.post("/place", response_model=OrderOut, status_code=201)
async def place_order(
    payload: PlaceOrderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Load cart with products in one query
    cart_res = await db.execute(
        select(CartItem)
        .where(CartItem.user_id == current_user.id)
        .options(selectinload(CartItem.product))
    )
    cart_items = cart_res.scalars().all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Stock check
    for item in cart_items:
        if item.product.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {item.product.name}. Available: {item.product.stock}"
            )

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
        raw_discount = (redeemed / 100) * 10  # 100 pts = ₹10
        max_allowed = round(subtotal * 0.5, 2)  # cap at 50% of subtotal
        pts_discount = min(raw_discount, max_allowed)
        # Only deduct the points actually used
        redeemed = int(pts_discount / 10) * 100
        loyalty.points -= redeemed
        db.add(LoyaltyTransaction(account_id=loyalty.id, points=-redeemed, description="Redeemed at checkout"))

    delivery_fee = 1.99
    after = subtotal - discount - pts_discount
    tax = round(after * 0.08, 2)
    total = round(after + delivery_fee + tax, 2)
    points_earned = int(subtotal / 10)  # 1 point per ₹10 spent (realistic rate)

    order = Order(
        order_number=_order_number(), user_id=current_user.id, address_id=payload.address_id,
        subtotal=subtotal, discount=discount + pts_discount, delivery_fee=delivery_fee,
        tax=tax, total=total, promo_code=promo_str, points_earned=points_earned,
        points_redeemed=redeemed, notes=payload.notes, estimated_eta="25-35 min",
    )
    db.add(order)
    await db.flush()  # get order.id

    # Decrement stock and clear cart — products already in memory
    for item in cart_items:
        db.add(OrderItem(
            order_id=order.id, product_id=item.product_id, quantity=item.quantity,
            unit_price=item.product.price, total_price=item.product.price * item.quantity
        ))
        item.product.stock = max(0, item.product.stock - item.quantity)
        await db.delete(item)

    if loyalty:
        loyalty.points += points_earned
        loyalty.total_earned += points_earned
        # Use enum values, not raw strings
        from app.models.user import LoyaltyTier
        if loyalty.total_earned >= 5000:   loyalty.tier = LoyaltyTier.platinum
        elif loyalty.total_earned >= 2000: loyalty.tier = LoyaltyTier.gold
        elif loyalty.total_earned >= 500:  loyalty.tier = LoyaltyTier.silver
        db.add(LoyaltyTransaction(
            account_id=loyalty.id, points=points_earned,
            description=f"Order {order.order_number}"
        ))

    db.add(Notification(
        user_id=current_user.id, type=NotifType.order, icon="🚚",
        title="Order Confirmed!",
        body=f"Your order {order.order_number} is on the way! ETA: 25-35 min."
    ))
    await db.commit()

    # Load the completed order with relationships in 2 queries
    result = await db.execute(
        _orders_with_items().where(Order.id == order.id)
    )
    return result.scalar_one()


# ── Cancel Order ──────────────────────────────────────────────
@router.patch("/{order_id}/cancel", response_model=OrderOut)
async def cancel_order(
    order_id: int,
    payload: CancelOrderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        _orders_with_items()
        .where(Order.id == order_id, Order.user_id == current_user.id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status not in (OrderStatus.pending, OrderStatus.confirmed):
        raise HTTPException(status_code=400, detail=f"Cannot cancel order with status '{order.status.value}'.")

    order.status = OrderStatus.cancelled

    # Restore stock — products already loaded via selectinload
    for item in order.items:
        item.product.stock += item.quantity

    # Adjust loyalty
    lr = await db.execute(select(LoyaltyAccount).where(LoyaltyAccount.user_id == current_user.id))
    loyalty = lr.scalar_one_or_none()
    if loyalty:
        from app.models.user import LoyaltyTier
        if order.points_redeemed > 0:
            loyalty.points += order.points_redeemed
            db.add(LoyaltyTransaction(
                account_id=loyalty.id, points=order.points_redeemed,
                description=f"Points refunded for cancelled order {order.order_number}"
            ))
        if order.points_earned > 0:
            loyalty.points = max(0, loyalty.points - order.points_earned)
            loyalty.total_earned = max(0, loyalty.total_earned - order.points_earned)
            if loyalty.total_earned >= 5000:   loyalty.tier = LoyaltyTier.platinum
            elif loyalty.total_earned >= 2000: loyalty.tier = LoyaltyTier.gold
            elif loyalty.total_earned >= 500:  loyalty.tier = LoyaltyTier.silver
            else:                              loyalty.tier = LoyaltyTier.bronze
            db.add(LoyaltyTransaction(
                account_id=loyalty.id, points=-order.points_earned,
                description=f"Points reversed for cancelled order {order.order_number}"
            ))

    db.add(Notification(
        user_id=current_user.id, type=NotifType.order, icon="❌",
        title="Order Cancelled",
        body=f"Your order {order.order_number} has been cancelled."
              + (f" Reason: {payload.reason}" if payload.reason else "")
    ))
    await db.commit()

    result = await db.execute(_orders_with_items().where(Order.id == order.id))
    return result.scalar_one()


# ── List Orders ───────────────────────────────────────────────
@router.get("", response_model=List[OrderOut])
@router.get("/", response_model=List[OrderOut], include_in_schema=False)
async def list_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        _orders_with_items()
        .where(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
    )
    return result.scalars().all()


# ── Get Single Order ──────────────────────────────────────────
@router.get("/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        _orders_with_items()
        .where(Order.id == order_id, Order.user_id == current_user.id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order