-- Seed Products (prices in ₹ INR — Indian dairy market)

INSERT INTO products (name, description, price, unit, category, emoji, badge, stock, calories, protein, fat, carbs, avg_rating, review_count)
VALUES
  ('Full Cream Milk',    'Farm-fresh full-cream milk. No preservatives, sourced daily from local farms.',          68,  '1 litre',    'Milk',   '🥛', 'bestseller', 100, 150, '8g',  '8g',  '12g', 4.9, 312),
  ('Toned Milk',         'Low-fat toned milk. Lighter and ideal for everyday use.',                                52,  '1 litre',    'Milk',   '🥛', NULL,          100, 80,  '8g',  '3g',  '12g', 4.8, 198),
  ('Oat Milk',           'Creamy plant-based oat milk. Lactose-free and naturally sweet.',                         89,  '1 litre',    'Milk',   '🌾', 'popular',     100, 120, '3g',  '5g',  '16g', 4.7, 145),
  ('Cheddar Cheese',     'Aged sharp cheddar block. Rich flavour, perfect for sandwiches and cooking.',           199, '200g block', 'Cheese', '🧀', 'popular',     100, 110, '7g',  '9g',  '1g',  4.9, 421),
  ('Mozzarella',         'Fresh mozzarella balls. Soft, milky and great for pizza and salads.',                   149, '200g pack',  'Cheese', '🧀', NULL,          100, 80,  '6g',  '6g',  '1g',  4.6, 203),
  ('Greek Yogurt',       'Thick strained Greek yogurt. High protein, probiotic-rich, no added sugar.',             99, '400g tub',   'Yogurt', '🍦', 'new',         100, 90,  '17g', '0g',  '6g',  4.8, 289),
  ('Strawberry Yogurt',  'Fruity strawberry yogurt made with real fruit pulp.',                                    75, '400g tub',   'Yogurt', '🍓', NULL,          100, 130, '5g',  '2g',  '20g', 4.5, 167),
  ('Salted Butter',      'Creamy salted butter. Rich and spreadable, perfect for rotis and toast.',                59, '100g block', 'Butter', '🧈', 'bestseller',  100, 720, '1g',  '81g', '1g',  4.9, 512),
  ('Fresh Cream',        'Rich fresh whipping cream. Great for desserts, curries and coffee.',                     85, '200ml',      'Cream',  '🍶', NULL,          100, 340, '2g',  '36g', '3g',  4.6, 134),
  ('Paneer',             'Fresh homemade-style paneer. Soft, crumbly and perfect for cooking.',                    99, '200g block', 'Cheese', '🧀', 'new',          60, 265, '18g', '20g', '3g',  4.9, 512),
  ('Unsalted Butter',    'Pure unsalted baking butter. Ideal for cakes, cookies and pastries.',                    59, '100g block', 'Butter', '🧈', NULL,          100, 720, '1g',  '81g', '1g',  4.7, 176),
  ('Sour Cream',         'Tangy sour cream dip. Great with snacks, wraps and baked dishes.',                      120, '200g',       'Cream',  '🥣', NULL,           70, 190, '3g',  '20g', '4g',  4.5, 112)
ON CONFLICT DO NOTHING;

-- Seed Promo Codes (min_order_value in ₹)
INSERT INTO promo_codes (code, discount_percent, max_uses, min_order_value, is_active)
VALUES
  ('NEWUSER20', 20.0, 1000, 99.0,  TRUE),   -- 20% off first order, min ₹99
  ('DAIRY10',   10.0, 1000, 199.0, TRUE),   -- 10% off, min ₹199
  ('FRESH15',   15.0, 500,  149.0, TRUE),   -- 15% off, min ₹149
  ('CHEESE20',  20.0, 200,  299.0, TRUE)    -- 20% off, min ₹299
ON CONFLICT DO NOTHING;


-- -- ============================================================
-- -- DairyDrop — Full Database Setup for Supabase
-- -- Run this entire file in Supabase SQL Editor
-- -- ============================================================

-- -- ── Enums ────────────────────────────────────────────────────
-- DO $$ BEGIN
--     CREATE TYPE orderstatus AS ENUM ('pending','confirmed','packing','on_the_way','delivered','cancelled');
-- EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- DO $$ BEGIN
--     CREATE TYPE notiftype AS ENUM ('order','promo','loyalty','system');
-- EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- DO $$ BEGIN
--     CREATE TYPE loyaltytier AS ENUM ('bronze','silver','gold','platinum');
-- EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- -- ── Users ────────────────────────────────────────────────────
-- CREATE TABLE IF NOT EXISTS users (
--     id               SERIAL PRIMARY KEY,
--     email            VARCHAR(255) UNIQUE NOT NULL,
--     full_name        VARCHAR(255) NOT NULL,
--     hashed_password  VARCHAR(255) NOT NULL,
--     phone            VARCHAR(20),
--     avatar_url       VARCHAR(500),
--     is_active        BOOLEAN DEFAULT TRUE,
--     is_admin         BOOLEAN DEFAULT FALSE,
--     referral_code    VARCHAR(20) UNIQUE,
--     referred_by      INTEGER REFERENCES users(id),
--     created_at       TIMESTAMPTZ DEFAULT NOW(),
--     updated_at       TIMESTAMPTZ
-- );

-- -- ── Addresses ────────────────────────────────────────────────
-- CREATE TABLE IF NOT EXISTS addresses (
--     id           SERIAL PRIMARY KEY,
--     user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--     label        VARCHAR(50) NOT NULL,
--     full_address TEXT NOT NULL,
--     lat          FLOAT,
--     lng          FLOAT,
--     is_default   BOOLEAN DEFAULT FALSE,
--     created_at   TIMESTAMPTZ DEFAULT NOW()
-- );

-- -- ── Products ─────────────────────────────────────────────────
-- CREATE TABLE IF NOT EXISTS products (
--     id           SERIAL PRIMARY KEY,
--     name         VARCHAR(255) NOT NULL,
--     description  TEXT,
--     price        FLOAT NOT NULL,
--     unit         VARCHAR(50) NOT NULL,
--     category     VARCHAR(50) NOT NULL,
--     emoji        VARCHAR(10),
--     image_url    VARCHAR(500),
--     badge        VARCHAR(30),
--     stock        INTEGER DEFAULT 100,
--     is_active    BOOLEAN DEFAULT TRUE,
--     calories     INTEGER,
--     protein      VARCHAR(20),
--     fat          VARCHAR(20),
--     carbs        VARCHAR(20),
--     avg_rating   FLOAT DEFAULT 0.0,
--     review_count INTEGER DEFAULT 0,
--     created_at   TIMESTAMPTZ DEFAULT NOW()
-- );

-- -- ── Cart Items ───────────────────────────────────────────────
-- CREATE TABLE IF NOT EXISTS cart_items (
--     id         SERIAL PRIMARY KEY,
--     user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--     product_id INTEGER NOT NULL REFERENCES products(id),
--     quantity   INTEGER DEFAULT 1,
--     created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- -- ── Orders ───────────────────────────────────────────────────
-- CREATE TABLE IF NOT EXISTS orders (
--     id              SERIAL PRIMARY KEY,
--     order_number    VARCHAR(20) UNIQUE NOT NULL,
--     user_id         INTEGER NOT NULL REFERENCES users(id),
--     address_id      INTEGER REFERENCES addresses(id),
--     status          orderstatus DEFAULT 'pending',
--     subtotal        FLOAT NOT NULL,
--     discount        FLOAT DEFAULT 0.0,
--     delivery_fee    FLOAT DEFAULT 1.99,
--     tax             FLOAT NOT NULL,
--     total           FLOAT NOT NULL,
--     promo_code      VARCHAR(30),
--     points_earned   INTEGER DEFAULT 0,
--     points_redeemed INTEGER DEFAULT 0,
--     notes           TEXT,
--     estimated_eta   VARCHAR(50),
--     created_at      TIMESTAMPTZ DEFAULT NOW(),
--     updated_at      TIMESTAMPTZ
-- );

-- -- ── Order Items ──────────────────────────────────────────────
-- CREATE TABLE IF NOT EXISTS order_items (
--     id          SERIAL PRIMARY KEY,
--     order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
--     product_id  INTEGER NOT NULL REFERENCES products(id),
--     quantity    INTEGER NOT NULL,
--     unit_price  FLOAT NOT NULL,
--     total_price FLOAT NOT NULL
-- );

-- -- ── Promo Codes ──────────────────────────────────────────────
-- CREATE TABLE IF NOT EXISTS promo_codes (
--     id               SERIAL PRIMARY KEY,
--     code             VARCHAR(30) UNIQUE NOT NULL,
--     discount_percent FLOAT NOT NULL,
--     max_uses         INTEGER,
--     uses_count       INTEGER DEFAULT 0,
--     min_order_value  FLOAT DEFAULT 0.0,
--     is_active        BOOLEAN DEFAULT TRUE,
--     expires_at       TIMESTAMPTZ,
--     created_at       TIMESTAMPTZ DEFAULT NOW()
-- );

-- -- ── Reviews ──────────────────────────────────────────────────
-- CREATE TABLE IF NOT EXISTS reviews (
--     id         SERIAL PRIMARY KEY,
--     user_id    INTEGER NOT NULL REFERENCES users(id),
--     product_id INTEGER NOT NULL REFERENCES products(id),
--     rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
--     comment    TEXT,
--     created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- -- ── Notifications ────────────────────────────────────────────
-- CREATE TABLE IF NOT EXISTS notifications (
--     id         SERIAL PRIMARY KEY,
--     user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--     type       notiftype DEFAULT 'system',
--     icon       VARCHAR(10) DEFAULT '🔔',
--     title      VARCHAR(255) NOT NULL,
--     body       TEXT NOT NULL,
--     is_read    BOOLEAN DEFAULT FALSE,
--     created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- -- ── Loyalty Accounts ─────────────────────────────────────────
-- CREATE TABLE IF NOT EXISTS loyalty_accounts (
--     id           SERIAL PRIMARY KEY,
--     user_id      INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--     points       INTEGER DEFAULT 0,
--     tier         loyaltytier DEFAULT 'bronze',
--     total_earned INTEGER DEFAULT 0,
--     created_at   TIMESTAMPTZ DEFAULT NOW(),
--     updated_at   TIMESTAMPTZ
-- );

-- -- ── Loyalty Transactions ─────────────────────────────────────
-- CREATE TABLE IF NOT EXISTS loyalty_transactions (
--     id          SERIAL PRIMARY KEY,
--     account_id  INTEGER NOT NULL REFERENCES loyalty_accounts(id) ON DELETE CASCADE,
--     points      INTEGER NOT NULL,
--     description VARCHAR(255) NOT NULL,
--     created_at  TIMESTAMPTZ DEFAULT NOW()
-- );

-- -- ── Wishlist Items ───────────────────────────────────────────
-- CREATE TABLE IF NOT EXISTS wishlist_items (
--     id         SERIAL PRIMARY KEY,
--     user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--     product_id INTEGER NOT NULL REFERENCES products(id),
--     created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- -- ── Subscriptions ────────────────────────────────────────────
-- CREATE TABLE IF NOT EXISTS subscriptions (
--     id            SERIAL PRIMARY KEY,
--     user_id       INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--     frequency     VARCHAR(20) DEFAULT 'weekly',
--     next_delivery TIMESTAMPTZ,
--     is_active     BOOLEAN DEFAULT TRUE,
--     items         JSONB DEFAULT '[]',
--     created_at    TIMESTAMPTZ DEFAULT NOW(),
--     updated_at    TIMESTAMPTZ
-- );

-- -- ── Seed Products ────────────────────────────────────────────
-- INSERT INTO products (name, description, price, unit, category, emoji, badge, stock, calories, protein, fat, carbs) VALUES
-- ('Whole Milk',        'Farm-fresh full-cream milk',        3.99, '1 gallon',   'Milk',   '🥛', 'bestseller', 100, 150, '8g',  '8g',  '12g'),
-- ('Skimmed Milk',      'Low-fat skimmed milk',              3.49, '1 gallon',   'Milk',   '🥛', NULL,         100, 80,  '8g',  '0g',  '12g'),
-- ('Oat Milk',          'Creamy plant-based oat milk',       4.99, '1 litre',    'Milk',   '🌾', 'popular',    100, 120, '3g',  '5g',  '16g'),
-- ('Cheddar Cheese',    'Aged sharp cheddar block',          5.99, '200g block', 'Cheese', '🧀', 'bestseller', 80,  400, '25g', '33g', '1g'),
-- ('Mozzarella',        'Fresh mozzarella balls',            4.49, '250g pack',  'Cheese', '🧀', NULL,         80,  280, '22g', '22g', '2g'),
-- ('Greek Yogurt',      'Thick creamy Greek yogurt',         2.99, '500g tub',   'Yogurt', '🍦', 'popular',    90,  100, '10g', '0g',  '6g'),
-- ('Strawberry Yogurt', 'Fruity strawberry yogurt',          2.49, '500g tub',   'Yogurt', '🍓', 'new',        90,  120, '5g',  '2g',  '20g'),
-- ('Heavy Cream',       'Rich heavy whipping cream',         3.29, '500ml',      'Cream',  '🍶', NULL,         70,  340, '2g',  '36g', '3g'),
-- ('Sour Cream',        'Tangy sour cream dip',              2.49, '300g',       'Cream',  '🥣', NULL,         70,  190, '3g',  '20g', '4g'),
-- ('Salted Butter',     'Creamy salted butter',              3.79, '250g block', 'Butter', '🧈', 'bestseller', 100, 720, '1g',  '81g', '1g'),
-- ('Unsalted Butter',   'Pure unsalted baking butter',       3.79, '250g block', 'Butter', '🧈', NULL,         100, 720, '1g',  '81g', '1g'),
-- ('Paneer',            'Fresh Indian cottage cheese',       4.99, '200g block', 'Cheese', '🧀', 'new',        60,  265, '18g', '20g', '3g')
-- ON CONFLICT DO NOTHING;

-- -- ── Seed Promo Codes ─────────────────────────────────────────
-- INSERT INTO promo_codes (code, discount_percent, max_uses, is_active) VALUES
-- ('WELCOME10', 10, 1000, TRUE),
-- ('DAIRY20',   20, 500,  TRUE),
-- ('FIRST15',   15, 1000, TRUE)
-- ON CONFLICT DO NOTHING;

-- -- ✅ All done! 13 tables created + products + promo codes seeded.