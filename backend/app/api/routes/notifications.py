from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, Notification, LoyaltyAccount, LoyaltyTransaction
from app.schemas.schemas import NotificationOut, LoyaltyOut, RedeemPointsRequest, ReferralOut

# ── Notifications ────────────────────────────────────────────
router = APIRouter()

TIER_THRESHOLDS = {"bronze": 0, "silver": 500, "gold": 2000, "platinum": 5000}
TIER_NEXT = {"bronze": ("silver", 500), "silver": ("gold", 2000), "gold": ("platinum", 5000), "platinum": (None, 0)}


@router.get("/", response_model=List[NotificationOut])
async def list_notifications(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Notification).where(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).limit(50))
    return result.scalars().all()


@router.post("/{notif_id}/read")
async def mark_read(notif_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Notification).where(Notification.id == notif_id, Notification.user_id == current_user.id))
    notif = result.scalar_one_or_none()
    if notif:
        notif.is_read = True
        await db.commit()
    return {"message": "Marked as read"}


@router.post("/read-all")
async def mark_all_read(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Notification).where(Notification.user_id == current_user.id, Notification.is_read == False))
    for n in result.scalars().all():
        n.is_read = True
    await db.commit()
    return {"message": "All notifications marked as read"}
