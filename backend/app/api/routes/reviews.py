from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, Review, Product
from app.schemas.schemas import ReviewCreate, ReviewOut

router = APIRouter()


@router.get("/product/{product_id}", response_model=List[ReviewOut])
async def get_product_reviews(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Review).where(Review.product_id == product_id).order_by(Review.created_at.desc())
    )
    reviews = result.scalars().all()
    for r in reviews:
        await db.refresh(r, ["user"])
    return reviews


@router.post("/", response_model=ReviewOut, status_code=201)
async def create_review(
    payload: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(Review).where(Review.user_id == current_user.id, Review.product_id == payload.product_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You already reviewed this product")

    review = Review(user_id=current_user.id, **payload.model_dump())
    db.add(review)
    await db.flush()

    # Update product avg rating
    stats = await db.execute(
        select(func.avg(Review.rating), func.count(Review.id)).where(Review.product_id == payload.product_id)
    )
    avg, count = stats.one()
    product_res = await db.execute(select(Product).where(Product.id == payload.product_id))
    product = product_res.scalar_one_or_none()
    if product:
        product.avg_rating = round(float(avg), 1)
        product.review_count = count

    await db.commit()
    await db.refresh(review, ["user"])
    return review


@router.delete("/{review_id}")
async def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Review).where(Review.id == review_id, Review.user_id == current_user.id)
    )
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    product_id = review.product_id
    await db.delete(review)
    await db.flush()

    # ── Recalculate avg_rating after deletion (was missing before)
    stats = await db.execute(
        select(func.avg(Review.rating), func.count(Review.id)).where(Review.product_id == product_id)
    )
    avg, count = stats.one()
    product_res = await db.execute(select(Product).where(Product.id == product_id))
    product = product_res.scalar_one_or_none()
    if product:
        product.avg_rating = round(float(avg), 1) if avg else 0.0
        product.review_count = count

    await db.commit()
    return {"message": "Review deleted"}
