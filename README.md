# 🥛 DairyDrop — Full Stack Dairy Delivery App

A production-ready, Docker-ready full stack dairy ordering app with:

- **Backend**: Python + FastAPI + PostgreSQL + Redis
- **Frontend**: React 18
- **Proxy**: Nginx
- **Auth**: JWT (access + refresh tokens)
- **ORM**: SQLAlchemy async + Alembic migrations

---

## 🚀 Quick Start (Docker)

```bash
# 1. Clone or unzip this project
cd dairydrop

# 2. Copy environment file
cp .env .env.local   # optional: edit values

# 3. Start everything
docker-compose up --build

# 4. Open the app
open http://localhost          # via Nginx
open http://localhost:3000     # React directly
open http://localhost:8000/api/docs   # FastAPI Swagger UI
```

**First-time login:**
- The database is auto-seeded with 12 products and 4 promo codes
- Register a new account, or use the demo credentials in the app

---

## 📁 Project Structure

```
dairydrop/
├── docker-compose.yml          # Orchestrates all services
├── .env                        # Environment variables
├── nginx/
│   └── nginx.conf              # Reverse proxy config
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── init.sql                # DB seed (products + promos)
│   ├── alembic/
│   │   └── env.py
│   └── app/
│       ├── main.py             # FastAPI entry point
│       ├── core/
│       │   ├── config.py       # Settings from .env
│       │   ├── database.py     # Async SQLAlchemy engine
│       │   └── security.py     # JWT + password hashing
│       ├── models/
│       │   └── user.py         # All DB models
│       ├── schemas/
│       │   └── schemas.py      # Pydantic request/response models
│       └── api/routes/
│           ├── auth.py         # Register, Login, Refresh
│           ├── users.py        # Profile update, password change
│           ├── products.py     # Product catalog + search
│           ├── cart.py         # Cart CRUD + promo validation
│           ├── orders.py       # Place order + order history
│           ├── reviews.py      # Product reviews
│           ├── addresses.py    # Delivery addresses
│           ├── notifications.py# Push notifications
│           ├── loyalty.py      # Points + tier management
│           └── referrals.py    # Referral tracking
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        ├── api.js              # Axios client + all API calls
        └── App.js              # Full UI connected to backend
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login (returns JWT) |
| POST | `/api/auth/refresh` | Refresh access token |
| GET  | `/api/products` | List products (filter/search) |
| GET  | `/api/products/{id}` | Product detail |
| GET  | `/api/cart` | Get cart |
| POST | `/api/cart` | Add/update cart item |
| POST | `/api/cart/validate-promo` | Validate promo code |
| POST | `/api/orders/place` | Place order |
| GET  | `/api/orders` | Order history |
| GET  | `/api/orders/{id}` | Order detail + tracking |
| POST | `/api/reviews` | Submit review |
| GET  | `/api/addresses` | List addresses |
| POST | `/api/addresses` | Add address |
| GET  | `/api/notifications` | List notifications |
| GET  | `/api/loyalty` | Loyalty account + tier |
| GET  | `/api/referrals` | Referral stats |

**Full interactive docs**: http://localhost:8000/api/docs

---

## 🏷️ Promo Codes (pre-seeded)

| Code | Discount |
|------|----------|
| `DAIRY10` | 10% off |
| `FRESH15` | 15% off |
| `NEWUSER20` | 20% off |
| `CHEESE20` | 20% off |

---

## ✨ Features

- 🔐 JWT auth (access + refresh tokens, auto-refresh in frontend)
- 🛒 Real-time cart synced to backend
- 📦 Order placement with promo codes, loyalty point redemption
- ⭐ Loyalty points (Bronze → Silver → Gold → Platinum)
- 🏷️ Promo code validation with expiry + usage limits
- 📍 Multiple saved delivery addresses
- 🔔 Per-user push notifications
- ⭐ Product reviews with auto-updating avg rating
- 🎁 Referral program with credit tracking
- 🧾 Order invoices with full line items
- 🌙 Dark mode
- 💬 Live chat support (Daisy bot)
- 🥗 Full nutrition info per product
- 🔗 Related products on product detail

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `dairydrop` | DB username |
| `POSTGRES_PASSWORD` | `dairydrop_secret` | DB password |
| `SECRET_KEY` | (change this!) | JWT signing key |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | JWT lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token lifetime |
| `ENVIRONMENT` | `development` | `development` or `production` |

---

## 🌐 Deploying to Production

1. **Set strong secrets** in `.env`:
   ```bash
   SECRET_KEY=$(openssl rand -hex 32)
   POSTGRES_PASSWORD=$(openssl rand -hex 16)
   ```

2. **Build production frontend**:
   ```bash
   cd frontend && npm run build
   ```

3. **Use a production Nginx config** with SSL (certbot/Let's Encrypt)

4. **Deploy to any Docker host**: AWS ECS, DigitalOcean, Railway, Render, Fly.io

---

## 🧪 Development

```bash
# Backend only (with hot reload)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend only
cd frontend
npm install && npm start

# Run DB migrations manually
cd backend
alembic upgrade head
```
