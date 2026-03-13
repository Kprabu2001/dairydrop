from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, WishlistItem, Product
from app.schemas.schemas import WishlistItemOut

router = APIRouter()


async def _get_wishlist(user_id: int, db: AsyncSession):
    result = await db.execute(
        select(WishlistItem)
        .where(WishlistItem.user_id == user_id)
        .options(selectinload(WishlistItem.product))
        .order_by(WishlistItem.created_at.desc())
    )
    return result.scalars().all()


# ── GET /wishlist ─────────────────────────────────────────────
@router.get("/", response_model=List[WishlistItemOut])
async def get_wishlist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _get_wishlist(current_user.id, db)


# ── POST /wishlist/{product_id} — toggle (add if not present, remove if already) ──
@router.post("/{product_id}", response_model=List[WishlistItemOut])
async def toggle_wishlist(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify product exists
    prod = await db.execute(select(Product).where(Product.id == product_id))
    if not prod.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Product not found")

    existing = await db.execute(
        select(WishlistItem).where(
            WishlistItem.user_id == current_user.id,
            WishlistItem.product_id == product_id,
        )
    )
    item = existing.scalar_one_or_none()

    if item:
        await db.delete(item)  # already saved → unsave
    else:
        db.add(WishlistItem(user_id=current_user.id, product_id=product_id))

    await db.commit()
    return await _get_wishlist(current_user.id, db)


# ── DELETE /wishlist/{product_id} — explicit remove ──────────
@router.delete("/{product_id}", response_model=List[WishlistItemOut])
async def remove_from_wishlist(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        delete(WishlistItem).where(
            WishlistItem.user_id == current_user.id,
            WishlistItem.product_id == product_id,
        )
    )
    await db.commit()
    return await _get_wishlist(current_user.id, db)