from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import random, string,logging

from app.core.database import get_db
from app.core.security import (
    verify_password, hash_password,
    create_access_token, create_refresh_token, get_current_user
)
from app.core.env import env
from app.models.user import User, LoyaltyAccount, Notification, NotifType
from app.schemas.schemas import RegisterRequest, TokenResponse, RefreshRequest, UserOut
from jose import JWTError, jwt

router = APIRouter()
logger = logging.getLogger(__name__)


def generate_referral_code(name: str) -> str:
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"{name[:4].upper()}{suffix}"


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check duplicate email
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Validate admin registration code
    is_admin = False
    if payload.role == "admin":
        if not payload.admin_code or payload.admin_code != env.ADMIN_REGISTRATION_CODE:
            raise HTTPException(status_code=403, detail="Invalid admin authorisation code")
        is_admin = True

    # Find referrer
    referrer_id = None
    if payload.referral_code:
        ref = await db.execute(select(User).where(User.referral_code == payload.referral_code))
        referrer = ref.scalar_one_or_none()
        if referrer:
            referrer_id = referrer.id

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        referral_code=generate_referral_code(payload.full_name),
        referred_by=referrer_id,
        is_admin=is_admin,
    )
    db.add(user)
    await db.flush()  # get user.id

    # Create loyalty account
    loyalty = LoyaltyAccount(user_id=user.id)
    db.add(loyalty)

    # Welcome notification
    welcome_body = (
        "Your admin account is ready. You have full access to the dashboard."
        if is_admin else
        "Use code NEWUSER20 for 20% off your first order."
    )
    notif = Notification(
        user_id=user.id,
        type=NotifType.system,
        icon="👑" if is_admin else "👋",
        title="Welcome to DairyDrop!" + (" (Admin)" if is_admin else ""),
        body=welcome_body,
    )
    db.add(notif)
    await db.commit()
    await db.refresh(user)

    access_token  = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)

@router.post("/login", response_model=TokenResponse)
async def login(form: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == form.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    access_token  = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    try:
        data = jwt.decode(payload.refresh_token, env.SECRET_KEY, algorithms=[env.ALGORITHM])
        if data.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = data.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    access_token  = create_access_token({"sub": str(user.id)})
    new_refresh   = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=access_token, refresh_token=new_refresh)


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
