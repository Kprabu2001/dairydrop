from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, LoyaltyAccount, LoyaltyTransaction
from app.schemas.schemas import LoyaltyOut, RedeemPointsRequest

router = APIRouter()

TIER_NEXT = {
    "bronze":   ("silver",   500),
    "silver":   ("gold",     2000),
    "gold":     ("platinum", 5000),
    "platinum": (None,       0),
}


@router.get("/", response_model=LoyaltyOut)
async def get_loyalty(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LoyaltyAccount).where(LoyaltyAccount.user_id == current_user.id))
    loyalty = result.scalar_one_or_none()
    if not loyalty:
        loyalty = LoyaltyAccount(user_id=current_user.id)
        db.add(loyalty)
        await db.commit()
        await db.refresh(loyalty)

    next_tier, next_pts = TIER_NEXT.get(loyalty.tier.value if hasattr(loyalty.tier, "value") else loyalty.tier, (None, 0))
    return LoyaltyOut(
        points=loyalty.points,
        tier=loyalty.tier,
        total_earned=loyalty.total_earned,
        next_tier_points=max(0, next_pts - loyalty.total_earned) if next_pts else 0,
        next_tier_name=next_tier,
    )


@router.get("/transactions")
async def get_transactions(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LoyaltyAccount).where(LoyaltyAccount.user_id == current_user.id))
    loyalty = result.scalar_one_or_none()
    if not loyalty:
        return []
    txs = await db.execute(select(LoyaltyTransaction).where(LoyaltyTransaction.account_id == loyalty.id).order_by(LoyaltyTransaction.created_at.desc()).limit(20))
    return txs.scalars().all()


@router.post("/redeem")
async def redeem_points(payload: RedeemPointsRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if payload.points < 100 or payload.points % 100 != 0:
        raise HTTPException(status_code=400, detail="Redeem in multiples of 100 points")
    result = await db.execute(select(LoyaltyAccount).where(LoyaltyAccount.user_id == current_user.id))
    loyalty = result.scalar_one_or_none()
    if not loyalty or loyalty.points < payload.points:
        raise HTTPException(status_code=400, detail="Insufficient points")
    loyalty.points -= payload.points
    db.add(LoyaltyTransaction(account_id=loyalty.id, points=-payload.points, description="Manual redemption"))
    await db.commit()
    credit = (payload.points / 100) * 10
    return {"message": f"Redeemed {payload.points} pts for ₹{credit:.2f} credit"}