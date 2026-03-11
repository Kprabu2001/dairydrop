from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user, hash_password, verify_password
from app.models.user import User, Address, Review, Product, LoyaltyAccount, LoyaltyTransaction, Notification
from app.schemas.schemas import UserOut, UserUpdate, PasswordChange, AddressCreate, AddressOut, ReviewCreate, ReviewOut, LoyaltyOut, RedeemPointsRequest, ReferralOut, NotificationOut, SubscriptionUpdate

router = APIRouter()


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
async def update_me(payload: UserUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(current_user, k, v)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post("/me/change-password")
async def change_password(payload: PasswordChange, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = hash_password(payload.new_password)
    await db.commit()
    return {"message": "Password updated successfully"}
