from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.models.user import User, Product, CartItem, Order, OrderItem, PromoCode, LoyaltyAccount, LoyaltyTransaction, Notification, NotifType
from app.schemas.schemas import ProductOut, ProductCreate, CartItemOut, CartUpdate, OrderOut, PlaceOrderRequest, PromoValidate, PromoResult
from datetime import datetime
import random, string

router = APIRouter()

# ── PRODUCTS ────────────────────────────────────────────────
products_router = APIRouter()

@products_router.get("/", response_model=List[ProductOut])
async def list_products(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Product).where(Product.is_active == True)
    if category and category != "All":
        query = query.where(Product.category == category)
    if search:
        query = query.where(Product.name.ilike(f"%{search}%"))
    result = await db.execute(query)
    return result.scalars().all()


@products_router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@products_router.post("/", response_model=ProductOut, status_code=201)
async def create_product(
    payload: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    product = Product(**payload.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


# ── CART ────────────────────────────────────────────────────
cart_router = APIRouter()

@cart_router.get("/", response_model=List[CartItemOut])
async def get_cart(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CartItem).where(CartItem.user_id == current_user.id)
    )
    items = result.scalars().all()
    # Eager load products
    for item in items:
        await db.refresh(item, ["product"])
    return items


@cart_router.post("/", response_model=List[CartItemOut])
async def update_cart(
    payload: CartUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CartItem).where(
            CartItem.user_id == current_user.id,
            CartItem.product_id == payload.product_id
        )
    )
    existing = result.scalar_one_or_none()

    if payload.quantity <= 0:
        if existing:
            await db.delete(existing)
    elif existing:
        existing.quantity = payload.quantity
    else:
        db.add(CartItem(user_id=current_user.id, product_id=payload.product_id, quantity=payload.quantity))

    await db.commit()
    return await get_cart(current_user, db)


@cart_router.delete("/clear")
async def clear_cart(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CartItem).where(CartItem.user_id == current_user.id))
    for item in result.scalars().all():
        await db.delete(item)
    await db.commit()
    return {"message": "Cart cleared"}


@cart_router.post("/validate-promo", response_model=PromoResult)
async def validate_promo(payload: PromoValidate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PromoCode).where(PromoCode.code == payload.code.upper(), PromoCode.is_active == True)
    )
    promo = result.scalar_one_or_none()
    if not promo:
        return PromoResult(valid=False, message="Invalid promo code")
    if promo.expires_at and promo.expires_at < datetime.utcnow():
        return PromoResult(valid=False, message="Promo code has expired")
    if promo.max_uses and promo.uses_count >= promo.max_uses:
        return PromoResult(valid=False, message="Promo code usage limit reached")
    if payload.order_value < promo.min_order_value:
        return PromoResult(valid=False, message=f"Minimum order value is ${promo.min_order_value:.2f}")
    return PromoResult(valid=True, discount_percent=promo.discount_percent, message=f"{int(promo.discount_percent)}% discount applied!")


# ── ORDERS ──────────────────────────────────────────────────
orders_router = APIRouter()


def generate_order_number():
    return "#DY-" + "".join(random.choices(string.digits, k=4))


@orders_router.post("/place", response_model=OrderOut, status_code=201)
async def place_order(
    payload: PlaceOrderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Get cart items
    cart_result = await db.execute(select(CartItem).where(CartItem.user_id == current_user.id))
    cart_items = cart_result.scalars().all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Load products
    for item in cart_items:
        await db.refresh(item, ["product"])

    subtotal = sum(item.product.price * item.quantity for item in cart_items)
    discount = 0.0
    promo_code_str = None

    # Apply promo
    if payload.promo_code:
        promo_result = await db.execute(
            select(PromoCode).where(PromoCode.code == payload.promo_code.upper(), PromoCode.is_active == True)
        )
        promo = promo_result.scalar_one_or_none()
        if promo:
            discount = (subtotal * promo.discount_percent) / 100
            promo.uses_count += 1
            promo_code_str = promo.code

    # Points redemption ($5 per 500 pts)
    points_discount = 0.0
    redeemed = 0
    if payload.redeem_points > 0:
        loyalty_result = await db.execute(select(LoyaltyAccount).where(LoyaltyAccount.user_id == current_user.id))
        loyalty = loyalty_result.scalar_one_or_none()
        if loyalty and loyalty.points >= payload.redeem_points:
            redeemed = payload.redeem_points
            points_discount = (redeemed / 500) * 5
            loyalty.points -= redeemed
            db.add(LoyaltyTransaction(account_id=loyalty.id, points=-redeemed, description="Redeemed at checkout"))

    delivery_fee = 1.99
    after_discount = subtotal - discount - points_discount
    tax = after_discount * 0.08
    total = after_discount + delivery_fee + tax
    points_earned = int(total * 10)

    order = Order(
        order_number=generate_order_number(),
        user_id=current_user.id,
        address_id=payload.address_id,
        subtotal=subtotal,
        discount=discount + points_discount,
        delivery_fee=delivery_fee,
        tax=tax,
        total=total,
        promo_code=promo_code_str,
        points_earned=points_earned,
        points_redeemed=redeemed,
        notes=payload.notes,
        estimated_eta="25-35 min",
    )
    db.add(order)
    await db.flush()

    # Create order items
    for item in cart_items:
        db.add(OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.product.price,
            total_price=item.product.price * item.quantity,
        ))
        # Clear cart
        await db.delete(item)

    # Award loyalty points
    loyalty_result = await db.execute(select(LoyaltyAccount).where(LoyaltyAccount.user_id == current_user.id))
    loyalty = loyalty_result.scalar_one_or_none()
    if loyalty:
        loyalty.points += points_earned
        loyalty.total_earned += points_earned
        # Update tier
        if loyalty.total_earned >= 5000:
            loyalty.tier = "platinum"
        elif loyalty.total_earned >= 2000:
            loyalty.tier = "gold"
        elif loyalty.total_earned >= 500:
            loyalty.tier = "silver"
        db.add(LoyaltyTransaction(account_id=loyalty.id, points=points_earned, description=f"Order {order.order_number}"))

    # Order notification
    db.add(Notification(
        user_id=current_user.id,
        type=NotifType.order,
        icon="🚚",
        title="Order Confirmed!",
        body=f"Your order {order.order_number} is being prepared. ETA: 25-35 min.",
    ))

    await db.commit()
    await db.refresh(order, ["items"])
    for item in order.items:
        await db.refresh(item, ["product"])
    return order


@orders_router.get("/", response_model=List[OrderOut])
async def list_orders(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Order).where(Order.user_id == current_user.id).order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()
    for order in orders:
        await db.refresh(order, ["items"])
        for item in order.items:
            await db.refresh(item, ["product"])
    return orders


@orders_router.get("/{order_id}", response_model=OrderOut)
async def get_order(order_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
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
