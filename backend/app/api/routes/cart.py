from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, CartItem, PromoCode
from app.schemas.schemas import CartItemOut, CartUpdate, PromoValidate, PromoResult

router = APIRouter()


async def _get_cart(user_id: int, db: AsyncSession):
    """Load cart items with their products in 2 queries (not N+1)."""
    result = await db.execute(
        select(CartItem)
        .where(CartItem.user_id == user_id)
        .options(selectinload(CartItem.product))
    )
    return result.scalars().all()


@router.get("/", response_model=List[CartItemOut])
async def get_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _get_cart(current_user.id, db)


@router.post("/", response_model=List[CartItemOut])
async def update_cart(
    payload: CartUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CartItem).where(
            CartItem.user_id == current_user.id,
            CartItem.product_id == payload.product_id,
        )
    )
    existing = result.scalar_one_or_none()

    if payload.quantity <= 0:
        if existing:
            await db.delete(existing)
    elif existing:
        existing.quantity = payload.quantity
    else:
        db.add(CartItem(
            user_id=current_user.id,
            product_id=payload.product_id,
            quantity=payload.quantity,
        ))

    await db.commit()
    return await _get_cart(current_user.id, db)


@router.delete("/clear")
async def clear_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(CartItem).where(CartItem.user_id == current_user.id))
    for item in result.scalars().all():
        await db.delete(item)
    await db.commit()
    return {"message": "Cart cleared"}


@router.post("/validate-promo", response_model=PromoResult)
async def validate_promo(payload: PromoValidate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PromoCode).where(
            PromoCode.code == payload.code.upper(),
            PromoCode.is_active == True,
        )
    )
    promo = result.scalar_one_or_none()
    if not promo:
        return PromoResult(valid=False, message="Invalid promo code")
    if promo.expires_at and promo.expires_at < datetime.utcnow():
        return PromoResult(valid=False, message="Promo code has expired")
    if promo.max_uses and promo.uses_count >= promo.max_uses:
        return PromoResult(valid=False, message="Promo code usage limit reached")
    if payload.order_value < promo.min_order_value:
        return PromoResult(valid=False, message=f"Minimum order ${promo.min_order_value:.2f}")
    return PromoResult(
        valid=True,
        discount_percent=promo.discount_percent,
        message=f"{int(promo.discount_percent)}% discount applied!",
    )