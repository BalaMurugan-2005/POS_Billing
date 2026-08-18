-- POS Billing System — Seed Data

-- 1. Initial Users (Passwords encoded with BCrypt: 'password123' -> $2a$10$e8V/h7d2nZ6Y.e6/4H4A9uO3mHhJ8f9w.G7h8j9k0l1m2n3o4p5q6)
-- Admin User (username: admin, password: password123)
INSERT INTO users (username, password, name, email, phone, role, is_active, is_superuser, is_staff, first_name, last_name, date_joined, created_at, updated_at)
VALUES 
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9tq4F.B7fE2zK2O', 'System Administrator', 'admin@pos.com', '1234567890', 'ROLE_ADMIN', TRUE, TRUE, TRUE, 'Admin', 'User', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cashier', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9tq4F.B7fE2zK2O', 'John Cashier', 'cashier@pos.com', '0987654321', 'ROLE_CASHIER', TRUE, FALSE, TRUE, 'John', 'Cashier', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('customer', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9tq4F.B7fE2zK2O', 'Jane Customer', 'customer@pos.com', '1122334455', 'ROLE_CUSTOMER', TRUE, FALSE, FALSE, 'Jane', 'Customer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (username) DO NOTHING;

-- 2. Customer Profile
INSERT INTO customers (user_id, loyalty_number, loyalty_points, tier, preferred_payment_method, newsletter_subscription, total_purchases, created_at, updated_at)
SELECT id, 'LOY1001', 50.00, 'BRONZE', 'CARD', TRUE, 500.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users WHERE username = 'customer'
ON CONFLICT (user_id) DO NOTHING;

-- 3. Initial Products
INSERT INTO products (name, barcode, description, price, cost_price, tax_rate, stock_quantity, min_stock_level, max_stock_level, category, brand, unit, is_weighted, is_active, created_at, updated_at)
VALUES 
('Organic Milk 1L', '8901001001', 'Fresh organic whole milk 1 liter pack', 3.50, 2.20, 5.00, 50, 10, 100, 'Dairy', 'FarmFresh', 'liter', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Whole Wheat Bread', '8901001002', 'Nutritious whole wheat bread slice', 2.20, 1.30, 0.00, 40, 10, 80, 'Bakery', 'BakersChoice', 'piece', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Arabica Coffee Beans 250g', '8901001003', 'Premium roasted coffee beans 250g', 12.00, 7.50, 10.00, 25, 5, 50, 'Beverages', 'RoastMasters', 'pack', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Red Apples (Per Kg)', '8901001004', 'Crisp fresh red apples per kilogram', 4.00, 2.50, 0.00, 100, 20, 200, 'Fruits', 'FreshOrchard', 'kg', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Dark Chocolate Bar 100g', '8901001005', '70% Cocoa dark chocolate bar', 2.80, 1.40, 8.00, 60, 15, 120, 'Snacks', 'ChocoDelight', 'piece', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (barcode) DO NOTHING;

-- 4. Sample Transaction & Items
INSERT INTO transactions (transaction_number, cashier_id, customer_id, subtotal, tax, discount, total, payment_method, paid_amount, change_amount, status, notes, created_at, updated_at)
SELECT 'TXN-INIT-001', u.id, c.id, 17.70, 0.98, 0.00, 18.68, 'cash', 20.00, 1.32, 'COMPLETED', 'Initial seed transaction', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u, customers c
WHERE u.username = 'cashier' AND c.loyalty_number = 'LOY1001'
ON CONFLICT (transaction_number) DO NOTHING;

INSERT INTO transaction_items (transaction_id, product_id, quantity, weight, price, subtotal, tax)
SELECT t.id, p.id, 2, NULL, p.price, p.price * 2, (p.price * 2) * (p.tax_rate / 100)
FROM transactions t, products p
WHERE t.transaction_number = 'TXN-INIT-001' AND p.barcode = '8901001001';
