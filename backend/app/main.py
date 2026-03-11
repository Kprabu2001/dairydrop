from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.core.env import env
from app.core.database import engine, Base

# ── Import ALL models so SQLAlchemy knows about them for create_all ──
import app.models  # noqa: F401

from app.api.routes import (
    auth, users, products, cart, orders,
    reviews, addresses, notifications, loyalty, referrals
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="DairyDrop API",
    description="Full-featured dairy delivery app backend",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=env.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static uploads ────────────────────────────────────────────
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ── Routers ───────────────────────────────────────────────────
app.include_router(auth.router,          prefix="/api/auth",          tags=["Auth"])
app.include_router(users.router,         prefix="/api/users",         tags=["Users"])
app.include_router(products.router,      prefix="/api/products",      tags=["Products"])
app.include_router(cart.router,          prefix="/api/cart",          tags=["Cart"])
app.include_router(orders.router,        prefix="/api/orders",        tags=["Orders"])
app.include_router(reviews.router,       prefix="/api/reviews",       tags=["Reviews"])
app.include_router(addresses.router,     prefix="/api/addresses",     tags=["Addresses"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(loyalty.router,       prefix="/api/loyalty",       tags=["Loyalty"])
app.include_router(referrals.router,     prefix="/api/referrals",     tags=["Referrals"])


@app.get("/api/health")
async def health():
    return {"status": "healthy", "app": "DairyDrop", "version": "1.0.0"}
