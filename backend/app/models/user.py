from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Text, Enum, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


# ── Enums ────────────────────────────────────────────────────
class OrderStatus(str, enum.Enum):
    pending    = "pending"
    confirmed  = "confirmed"
    packing    = "packing"
    on_the_way = "on_the_way"
    delivered  = "delivered"
    cancelled  = "cancelled"


class NotifType(str, enum.Enum):
    order      = "order"
    promo      = "promo"
    loyalty    = "loyalty"
    system     = "system"


class LoyaltyTier(str, enum.Enum):
    bronze   = "bronze"
    silver   = "silver"
    gold     = "gold"
    platinum = "platinum"


# ── User ─────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id             = Column(Integer, primary_key=True, index=True)
    email          = Column(String(255), unique=True, index=True, nullable=False)
    full_name      = Column(String(255), nullable=False)
    hashed_password= Column(String(255), nullable=False)
    phone          = Column(String(20), nullable=True)
    avatar_url     = Column(String(500), nullable=True)
    is_active      = Column(Boolean, default=True)
    is_admin       = Column(Boolean, default=False)
    referral_code  = Column(String(20), unique=True, nullable=True)
    referred_by    = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
    updated_at     = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    addresses      = relationship("Address",      back_populates="user", cascade="all, delete-orphan")
    orders         = relationship("Order",        back_populates="user")
    cart_items     = relationship("CartItem",     back_populates="user", cascade="all, delete-orphan")
    reviews        = relationship("Review",       back_populates="user")
    notifications  = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    loyalty        = relationship("LoyaltyAccount", back_populates="user", uselist=False)
    wishlist       = relationship("WishlistItem", back_populates="user", cascade="all, delete-orphan")


# ── Address ──────────────────────────────────────────────────
class Address(Base):
    __tablename__ = "addresses"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    label      = Column(String(50), nullable=False)       # Home, Work, etc.
    full_address = Column(Text, nullable=False)
    lat        = Column(Float, nullable=True)
    lng        = Column(Float, nullable=True)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user       = relationship("User", back_populates="addresses")
    orders     = relationship("Order", back_populates="address")


# ── Product ──────────────────────────────────────────────────
class Product(Base):
    __tablename__ = "products"

    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String(255), nullable=False, index=True)
    description  = Column(Text, nullable=True)
    price        = Column(Float, nullable=False)
    unit         = Column(String(50), nullable=False)
    category     = Column(String(50), nullable=False, index=True)
    emoji        = Column(String(10), nullable=True)
    image_url    = Column(String(500), nullable=True)
    badge        = Column(String(30), nullable=True)   # bestseller, new, popular
    stock        = Column(Integer, default=100)
    is_active    = Column(Boolean, default=True)

    # Nutrition
    calories     = Column(Integer, nullable=True)
    protein      = Column(String(20), nullable=True)
    fat          = Column(String(20), nullable=True)
    carbs        = Column(String(20), nullable=True)

    # Stats (denormalized for speed)
    avg_rating   = Column(Float, default=0.0)
    review_count = Column(Integer, default=0)

    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    reviews      = relationship("Review",      back_populates="product")
    cart_items   = relationship("CartItem",    back_populates="product")
    order_items  = relationship("OrderItem",   back_populates="product")
    wishlist     = relationship("WishlistItem",back_populates="product")


# ── CartItem ─────────────────────────────────────────────────
class CartItem(Base):
    __tablename__ = "cart_items"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity   = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user       = relationship("User",    back_populates="cart_items")
    product    = relationship("Product", back_populates="cart_items")


# ── Order ────────────────────────────────────────────────────
class Order(Base):
    __tablename__ = "orders"

    id             = Column(Integer, primary_key=True, index=True)
    order_number   = Column(String(20), unique=True, nullable=False)
    user_id        = Column(Integer, ForeignKey("users.id"), nullable=False)
    address_id     = Column(Integer, ForeignKey("addresses.id"), nullable=True)
    status         = Column(Enum(OrderStatus), default=OrderStatus.pending)
    subtotal       = Column(Float, nullable=False)
    discount       = Column(Float, default=0.0)
    delivery_fee   = Column(Float, default=1.99)
    tax            = Column(Float, nullable=False)
    total          = Column(Float, nullable=False)
    promo_code            = Column(String(30), nullable=True)
    points_earned         = Column(Integer, default=0)
    points_redeemed       = Column(Integer, default=0)
    referral_credit_used  = Column(Float, default=0.0)
    notes          = Column(Text, nullable=True)
    estimated_eta  = Column(String(50), nullable=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
    updated_at     = Column(DateTime(timezone=True), onupdate=func.now())

    user           = relationship("User",      back_populates="orders")
    address        = relationship("Address",   back_populates="orders")
    items          = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


# ── OrderItem ────────────────────────────────────────────────
class OrderItem(Base):
    __tablename__ = "order_items"

    id          = Column(Integer, primary_key=True, index=True)
    order_id    = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id  = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity    = Column(Integer, nullable=False)
    unit_price  = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)

    order       = relationship("Order",   back_populates="items")
    product     = relationship("Product", back_populates="order_items")


# ── PromoCode ────────────────────────────────────────────────
class PromoCode(Base):
    __tablename__ = "promo_codes"

    id              = Column(Integer, primary_key=True, index=True)
    code            = Column(String(30), unique=True, nullable=False)
    discount_percent= Column(Float, nullable=False)
    max_uses        = Column(Integer, nullable=True)
    uses_count      = Column(Integer, default=0)
    min_order_value = Column(Float, default=0.0)
    is_active       = Column(Boolean, default=True)
    expires_at      = Column(DateTime(timezone=True), nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())


# ── Review ───────────────────────────────────────────────────
class Review(Base):
    __tablename__ = "reviews"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    rating     = Column(Integer, nullable=False)       # 1-5
    comment    = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user       = relationship("User",    back_populates="reviews")
    product    = relationship("Product", back_populates="reviews")


# ── Notification ─────────────────────────────────────────────
class Notification(Base):
    __tablename__ = "notifications"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    type       = Column(Enum(NotifType), default=NotifType.system)
    icon       = Column(String(10), default="🔔")
    title      = Column(String(255), nullable=False)
    body       = Column(Text, nullable=False)
    is_read    = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user       = relationship("User", back_populates="notifications")


# ── LoyaltyAccount ───────────────────────────────────────────
class LoyaltyAccount(Base):
    __tablename__ = "loyalty_accounts"

    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    points       = Column(Integer, default=0)
    tier         = Column(Enum(LoyaltyTier), default=LoyaltyTier.bronze)
    total_earned = Column(Integer, default=0)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())

    user         = relationship("User", back_populates="loyalty")
    transactions = relationship("LoyaltyTransaction", back_populates="account")


# ── LoyaltyTransaction ───────────────────────────────────────
class LoyaltyTransaction(Base):
    __tablename__ = "loyalty_transactions"

    id          = Column(Integer, primary_key=True, index=True)
    account_id  = Column(Integer, ForeignKey("loyalty_accounts.id"), nullable=False)
    points      = Column(Integer, nullable=False)   # positive=earn, negative=redeem
    description = Column(String(255), nullable=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    account     = relationship("LoyaltyAccount", back_populates="transactions")


# ── WishlistItem ─────────────────────────────────────────────
class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user       = relationship("User",    back_populates="wishlist")
    product    = relationship("Product", back_populates="wishlist")


# ── Subscription ─────────────────────────────────────────────
class Subscription(Base):
    __tablename__ = "subscriptions"

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    frequency     = Column(String(20), default="weekly")   # daily, weekly, biweekly
    next_delivery = Column(DateTime(timezone=True), nullable=True)
    is_active     = Column(Boolean, default=True)
    items         = Column(JSON, default=list)   # [{product_id, quantity}]
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), onupdate=func.now())


# ── SupportTicket ─────────────────────────────────────────
class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject     = Column(String(255), nullable=False)
    message     = Column(Text, nullable=False)
    status      = Column(String(20), default="open")   # open, in_progress, resolved
    order_id    = Column(Integer, ForeignKey("orders.id"), nullable=True)
    admin_reply = Column(Text, nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())

    user        = relationship("User", foreign_keys=[user_id])
    order       = relationship("Order", foreign_keys=[order_id])