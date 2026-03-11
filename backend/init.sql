-- Seed Products

INSERT INTO products (name, description, price, unit, category, emoji, badge, stock, calories, protein, fat, carbs, avg_rating, review_count)
VALUES
  ('Fresh Whole Milk',    'Rich, creamy whole milk from grass-fed cows. No hormones, no antibiotics.',                         3.49, '1 gallon',  'Milk',   '🥛', 'bestseller', 100, 150, '8g',  '8g',  '12g', 4.9, 312),
  ('Organic 2% Milk',    'USDA certified organic. Lighter than whole milk with all the goodness.',                             4.29, '1 gallon',  'Milk',   '🥛', NULL,          100, 120, '8g',  '5g',  '12g', 4.8, 198),
  ('Heavy Cream',        'Perfect for whipping, sauces & desserts. Ultra-pasteurized for freshness.',                          2.99, '1 pint',    'Cream',  '🫙', NULL,          100, 340, '2g',  '36g', '3g',  4.7, 145),
  ('Aged Cheddar',       'Sharp, tangy aged cheddar. Cave-aged for 12 months for maximum flavor.',                             6.49, '8 oz block','Cheese', '🧀', 'popular',     100, 110, '7g',  '9g',  '1g',  4.9, 421),
  ('Mozzarella Ball',    'Fresh handmade mozzarella. Soft, milky and perfect for Caprese salads.',                             4.99, '8 oz',      'Cheese', '🧀', NULL,          100, 80,  '6g',  '6g',  '1g',  4.6, 203),
  ('Greek Yogurt',       'Strained thick Greek yogurt. High protein, low fat, probiotic-rich.',                                5.49, '32 oz',     'Yogurt', '🫙', 'new',         100, 90,  '17g', '0g',  '6g',  4.8, 289),
  ('Vanilla Yogurt',     'Creamy vanilla yogurt made with real Madagascar vanilla beans.',                                     3.99, '32 oz',     'Yogurt', '🫙', NULL,          100, 130, '5g',  '2g',  '23g', 4.5, 167),
  ('Salted Butter',      'European-style cultured butter with the perfect amount of sea salt.',                                4.79, '1 lb',      'Butter', '🧈', 'bestseller',  100, 100, '0g',  '11g', '0g',  4.9, 512),
  ('Whipping Cream',     'Light enough to whip into perfect peaks. Great for pies and coffee.',                                3.49, '1 pint',    'Cream',  '🫙', NULL,          100, 290, '2g',  '30g', '3g',  4.6, 134),
  ('Cottage Cheese',     'Low-fat cottage cheese packed with protein. Great for snacking.',                                    3.29, '16 oz',     'Cheese', '🧀', NULL,          100, 90,  '13g', '1g',  '6g',  4.4, 98),
  ('Gouda Slices',       'Mild, creamy Dutch Gouda slices. Melts beautifully on sandwiches.',                                  5.99, '6 oz',      'Cheese', '🧀', NULL,          100, 100, '7g',  '8g',  '0g',  4.7, 176),
  ('Strawberry Kefir',   'Tangy drinkable kefir with real strawberries. 12 live probiotic cultures.',                         4.49, '32 oz',     'Yogurt', '🍓', 'new',         100, 110, '11g', '2g',  '12g', 4.5, 112)
ON CONFLICT DO NOTHING;

-- Seed Promo Codes
INSERT INTO promo_codes (code, discount_percent, max_uses, min_order_value, is_active)
VALUES
  ('DAIRY10',    10.0, 1000, 0.0,  TRUE),
  ('FRESH15',    15.0, 500,  10.0, TRUE),
  ('NEWUSER20',  20.0, NULL, 0.0,  TRUE),
  ('CHEESE20',   20.0, 200,  5.0,  TRUE)
ON CONFLICT DO NOTHING;
