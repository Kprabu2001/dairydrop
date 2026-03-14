from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, Order
from app.schemas.schemas import ReferralOut

router = APIRouter()


async def _get_referral_credit(user_id: int, db) -> float:
    """Return TOTAL referral credit ever earned (₹50 per successful referral)."""
    subq = select(Order.user_id).where(Order.user_id == User.id).exists()
    res = await db.execute(
        select(func.count(User.id)).where(User.referred_by == user_id).where(subq)
    )
    successful = res.scalar() or 0
    return float(successful * 50.0)


async def _get_available_referral_credit(user_id: int, db) -> float:
    """
    FIX #3: Return AVAILABLE (unspent) referral credit.
    Subtracts the sum of referral_credit_used from all non-cancelled past orders.
    """
    total_earned = await _get_referral_credit(user_id, db)

    # Sum up all referral credit already spent in placed (non-cancelled) orders
    spent_res = await db.execute(
        select(func.coalesce(func.sum(Order.referral_credit_used), 0.0)).where(
            Order.user_id == user_id,
            Order.status != "cancelled",
        )
    )
    total_spent = float(spent_res.scalar() or 0.0)
    return max(0.0, total_earned - total_spent)


@router.get("/", response_model=ReferralOut)
async def get_referral_info(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Count users referred by this user
    total_res = await db.execute(select(func.count(User.id)).where(User.referred_by == current_user.id))
    total = total_res.scalar() or 0

    # Count those who have placed at least 1 order
    subq = select(Order.user_id).where(Order.user_id == User.id).exists()
    successful_res = await db.execute(
        select(func.count(User.id)).where(User.referred_by == current_user.id).where(subq)
    )
    successful = successful_res.scalar() or 0
    total_credit = successful * 50.0  # ₹50 per successful referral

    # Available (unspent) credit
    available = await _get_available_referral_credit(current_user.id, db)

    return ReferralOut(
        referral_code=current_user.referral_code or "",
        total_referrals=total,
        successful_referrals=successful,
        total_credit_earned=total_credit,
        available_credit=available,
    )