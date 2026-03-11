from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.user import User, Order, OrderStatus, Product, PromoCode
from app.schemas.schemas import (
    UserOut, PromoCodeOut, PromoCodeCreate, PromoCodeUpdate, AdminStats
)

router = APIRouter()


# ── Admin Stats Dashboard ────────────────────────────────────
@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)

    total_revenue = await db.execute(select(func.sum(Order.total)).where(Order.status != OrderStatus.cancelled))
    orders_today = await db.execute(select(func.count(Order.id)).where(Order.created_at >= today_start))
    orders_week = await db.execute(select(func.count(Order.id)).where(Order.created_at >= week_start))
    total_users = await db.execute(select(func.count(User.id)))
    active_users = await db.execute(select(func.count(User.id)).where(User.is_active == True))
    total_orders = await db.execute(select(func.count(Order.id)))
    low_stock = await db.execute(select(func.count(Product.id)).where(Product.stock < 10, Product.is_active == True))

    return AdminStats(
        total_revenue=round(float(total_revenue.scalar() or 0), 2),
        orders_today=orders_today.scalar() or 0,
        orders_this_week=orders_week.scalar() or 0,
        total_users=total_users.scalar() or 0,
        active_users=active_users.scalar() or 0,
        total_orders=total_orders.scalar() or 0,
        low_stock_products=low_stock.scalar() or 0,
    )


# ── Admin: User Management ────────────────────────────────────
@router.get("/users", response_model=List[UserOut])
async def admin_list_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.get("/users/{user_id}", response_model=UserOut)
async def admin_get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/users/{user_id}/toggle-active")
async def admin_toggle_user_active(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    await db.commit()
    return {"user_id": user_id, "is_active": user.is_active}


# ── Admin: Promo Code Management ─────────────────────────────
@router.get("/promos", response_model=List[PromoCodeOut])
async def admin_list_promos(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(select(PromoCode).order_by(PromoCode.created_at.desc()))
    return result.scalars().all()


@router.post("/promos", response_model=PromoCodeOut, status_code=201)
async def admin_create_promo(
    payload: PromoCodeCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    existing = await db.execute(select(PromoCode).where(PromoCode.code == payload.code.upper()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Promo code already exists")
    promo = PromoCode(
        code=payload.code.upper(),
        discount_percent=payload.discount_percent,
        max_uses=payload.max_uses,
        min_order_value=payload.min_order_value,
        expires_at=payload.expires_at,
    )
    db.add(promo)
    await db.commit()
    await db.refresh(promo)
    return promo


@router.patch("/promos/{promo_id}", response_model=PromoCodeOut)
async def admin_update_promo(
    promo_id: int,
    payload: PromoCodeUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(select(PromoCode).where(PromoCode.id == promo_id))
    promo = result.scalar_one_or_none()
    if not promo:
        raise HTTPException(status_code=404, detail="Promo code not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(promo, k, v)
    await db.commit()
    await db.refresh(promo)
    return promo


@router.delete("/promos/{promo_id}", status_code=204)
async def admin_delete_promo(
    promo_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(select(PromoCode).where(PromoCode.id == promo_id))
    promo = result.scalar_one_or_none()
    if not promo:
        raise HTTPException(status_code=404, detail="Promo code not found")
    await db.delete(promo)
    await db.commit()
