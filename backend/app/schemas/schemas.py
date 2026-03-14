from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from app.models.user import OrderStatus, LoyaltyTier


# ── Auth ────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    referral_code: Optional[str] = None
    role: Optional[str] = "user"          # "user" | "admin"
    admin_code: Optional[str] = None      # required when role == "admin"

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    username: str   # email
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


# ── User ────────────────────────────────────────────────────
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None


class UserOut(UserBase):
    id: int
    avatar_url: Optional[str]
    is_active: bool
    is_admin: bool
    referral_code: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


# ── Address ─────────────────────────────────────────────────
class AddressCreate(BaseModel):
    label: str
    full_address: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    is_default: bool = False


class AddressOut(AddressCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Product ─────────────────────────────────────────────────
class ProductOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price: float
    unit: str
    category: str
    emoji: Optional[str]
    image_url: Optional[str]
    badge: Optional[str]
    stock: int
    calories: Optional[int]
    protein: Optional[str]
    fat: Optional[str]
    carbs: Optional[str]
    avg_rating: float
    review_count: int
    is_active: bool

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    unit: str
    category: str
    emoji: Optional[str] = None
    badge: Optional[str] = None
    stock: int = 100
    calories: Optional[int] = None
    protein: Optional[str] = None
    fat: Optional[str] = None
    carbs: Optional[str] = None


# ── Cart ────────────────────────────────────────────────────
class CartItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    product: ProductOut

    class Config:
        from_attributes = True


class CartUpdate(BaseModel):
    product_id: int
    quantity: int   # 0 = remove


# ── Promo ───────────────────────────────────────────────────
class PromoValidate(BaseModel):
    code: str
    order_value: float


class PromoResult(BaseModel):
    valid: bool
    discount_percent: Optional[float] = None
    message: str


# ── Promo Code Admin ────────────────────────────────────────
class PromoCodeOut(BaseModel):
    id: int
    code: str
    discount_percent: float
    max_uses: Optional[int]
    uses_count: int
    min_order_value: float
    is_active: bool
    expires_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class PromoCodeCreate(BaseModel):
    code: str
    discount_percent: float
    max_uses: Optional[int] = None
    min_order_value: float = 0.0
    expires_at: Optional[datetime] = None


class PromoCodeUpdate(BaseModel):
    discount_percent: Optional[float] = None
    max_uses: Optional[int] = None
    min_order_value: Optional[float] = None
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None


# ── Order ───────────────────────────────────────────────────
class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    total_price: float
    product: ProductOut

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: int
    order_number: str
    status: OrderStatus
    subtotal: float
    discount: float
    delivery_fee: float
    tax: float
    total: float
    promo_code: Optional[str]
    points_earned: int
    points_redeemed: int
    estimated_eta: Optional[str]
    notes: Optional[str]
    items: List[OrderItemOut]
    created_at: datetime

    class Config:
        from_attributes = True


class PlaceOrderRequest(BaseModel):
    address_id: int
    promo_code: Optional[str] = None
    redeem_points: int = 0
    referral_credit: float = 0.0   # ₹ referral credit to apply
    notes: Optional[str] = None
    payment_intent_id: Optional[str] = None   # Required for paid orders


class CancelOrderRequest(BaseModel):
    reason: Optional[str] = None


# ── Review ──────────────────────────────────────────────────
class ReviewCreate(BaseModel):
    product_id: int
    rating: int
    comment: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v):
        if not 1 <= v <= 5:
            raise ValueError("Rating must be between 1 and 5")
        return v


class ReviewOut(BaseModel):
    id: int
    user_id: int
    product_id: int
    rating: int
    comment: Optional[str]
    created_at: datetime
    user: UserOut

    class Config:
        from_attributes = True


# ── Notification ────────────────────────────────────────────
class NotificationOut(BaseModel):
    id: int
    type: str
    icon: str
    title: str
    body: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Loyalty ─────────────────────────────────────────────────
class LoyaltyOut(BaseModel):
    points: int
    tier: LoyaltyTier
    total_earned: int
    next_tier_points: int
    next_tier_name: Optional[str]

    class Config:
        from_attributes = True


class RedeemPointsRequest(BaseModel):
    points: int


# ── Referral ────────────────────────────────────────────────
class ReferralOut(BaseModel):
    referral_code: str
    total_referrals: int
    successful_referrals: int
    total_credit_earned: float


# ── Subscription ────────────────────────────────────────────
class SubscriptionUpdate(BaseModel):
    frequency: str   # daily, weekly, biweekly
    items: Optional[list] = None


# ── Support Ticket ──────────────────────────────────────────
class SupportTicketCreate(BaseModel):
    subject: str
    message: str
    order_id: Optional[int] = None


class SupportTicketOut(BaseModel):
    id: int
    user_id: int
    subject: str
    message: str
    status: str
    order_id: Optional[int]
    admin_reply: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class SupportTicketReply(BaseModel):
    reply: str
    status: Optional[str] = None



# ── Wishlist ─────────────────────────────────────────────────
class WishlistItemOut(BaseModel):
    id: int
    product_id: int
    product: ProductOut
    created_at: datetime

    class Config:
        from_attributes = True

# ── Admin Stats ─────────────────────────────────────────────
class AdminStats(BaseModel):
    total_revenue: float
    orders_today: int
    orders_this_week: int
    total_users: int
    active_users: int
    total_orders: int
    total_products: int
    low_stock_products: int