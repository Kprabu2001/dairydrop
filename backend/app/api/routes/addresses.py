from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, Address
from app.schemas.schemas import AddressCreate, AddressOut

router = APIRouter()


@router.get("/", response_model=List[AddressOut])
async def list_addresses(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Address).where(Address.user_id == current_user.id))
    return result.scalars().all()


@router.post("/", response_model=AddressOut, status_code=201)
async def create_address(payload: AddressCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if payload.is_default:
        # Unset other defaults
        result = await db.execute(select(Address).where(Address.user_id == current_user.id, Address.is_default == True))
        for addr in result.scalars().all():
            addr.is_default = False

    address = Address(user_id=current_user.id, **payload.model_dump())
    db.add(address)
    await db.commit()
    await db.refresh(address)
    return address


@router.put("/{address_id}", response_model=AddressOut)
async def update_address(address_id: int, payload: AddressCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Address).where(Address.id == address_id, Address.user_id == current_user.id))
    address = result.scalar_one_or_none()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    for k, v in payload.model_dump().items():
        setattr(address, k, v)
    await db.commit()
    await db.refresh(address)
    return address


@router.delete("/{address_id}")
async def delete_address(address_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Address).where(Address.id == address_id, Address.user_id == current_user.id))
    address = result.scalar_one_or_none()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    await db.delete(address)
    await db.commit()
    return {"message": "Address deleted"}
