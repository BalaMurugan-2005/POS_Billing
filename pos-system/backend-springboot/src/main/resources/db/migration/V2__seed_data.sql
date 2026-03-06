-- Insert admin user (password: admin123)
INSERT INTO users (username, password, name, email, role, is_active) VALUES 
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBpwTTyU4Jj6hu', 'Admin User', 'admin@pos.com', 'ROLE_ADMIN', true);

-- Insert cashier user (password: cashier123)
INSERT INTO users (username, password, name, email, role, is_active) VALUES 
('cashier', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBpwTTyU4Jj6hu', 'Cashier User', 'cashier@pos.com', 'ROLE_CASHIER', true);

-- Insert customer user (password: customer123)
INSERT INTO users (username, password, name, email, role, is_active) VALUES 
('customer', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBpwTTyU4Jj6hu', 'Customer User', 'customer@pos.com', 'ROLE_CUSTOMER', true);

-- Insert customer details
INSERT INTO customers (user_id, loyalty_number, loyalty_points, tier) VALUES 
(3, 'LOYAL001', 150.00, 'SILVER');

-- Insert sample products
INSERT INTO products (name, barcode, description, price, cost_price, tax_rate, stock_quantity, min_stock_level, category, unit, is_weighted) VALUES
('Fresh Apples', '8901234567890', 'Fresh red apples', 2.99, 1.99, 5.00, 150, 20, 'Fruits', 'kg', true),
('Whole Milk', '8901234567891', 'Fresh whole milk', 3.49, 2.49, 5.00, 80, 15, 'Dairy', 'l', false),
('Bread', '8901234567892', 'Fresh baked bread', 2.29, 1.29, 5.00, 45, 10, 'Bakery', 'pcs', false),
('Rice 5kg', '8901234567893', 'Premium basmati rice', 12.99, 9.99, 5.00, 60, 10, 'Groceries', 'bag', false),
('Orange Juice', '8901234567894', 'Fresh orange juice', 4.99, 3.49, 5.00, 35, 8, 'Beverages', 'l', false),
('Potatoes', '8901234567895', 'Fresh potatoes', 1.99, 0.99, 5.00, 200, 30, 'Vegetables', 'kg', true),
('Cheddar Cheese', '8901234567896', 'Aged cheddar cheese', 5.99, 3.99, 5.00, 25, 5, 'Dairy', 'kg', true),
('Chicken Breast', '8901234567897', 'Fresh chicken breast', 8.99, 5.99, 5.00, 40, 10, 'Meat', 'kg', true),
('Coca Cola', '8901234567898', 'Coca cola 2L', 2.49, 1.49, 5.00, 90, 20, 'Beverages', 'pcs', false),
('Chips', '8901234567899', 'Potato chips', 1.99, 0.99, 5.00, 120, 25, 'Snacks', 'pcs', false);

-- Insert sample inventory movements
INSERT INTO inventory (product_id, quantity_change, type, reason, previous_quantity, new_quantity, performed_by) VALUES
(1, 150, 'PURCHASE', 'Initial stock', 0, 150, 1),
(2, 80, 'PURCHASE', 'Initial stock', 0, 80, 1),
(3, 45, 'PURCHASE', 'Initial stock', 0, 45, 1),
(4, 60, 'PURCHASE', 'Initial stock', 0, 60, 1),
(5, 35, 'PURCHASE', 'Initial stock', 0, 35, 1),
(6, 200, 'PURCHASE', 'Initial stock', 0, 200, 1),
(7, 25, 'PURCHASE', 'Initial stock', 0, 25, 1),
(8, 40, 'PURCHASE', 'Initial stock', 0, 40, 1),
(9, 90, 'PURCHASE', 'Initial stock', 0, 90, 1),
(10, 120, 'PURCHASE', 'Initial stock', 0, 120, 1);

-- Insert sample transaction
INSERT INTO transactions (transaction_number, cashier_id, customer_id, subtotal, tax, total, payment_method, paid_amount, change_amount, status) VALUES
('TXN20240101001', 2, 1, 25.47, 1.27, 26.74, 'CASH', 30.00, 3.26, 'COMPLETED');

-- Insert sample transaction items
INSERT INTO transaction_items (transaction_id, product_id, quantity, weight, price, subtotal, tax) VALUES
(1, 1, 1, 1.5, 2.99, 4.49, 0.22),
(1, 2, 2, NULL, 3.49, 6.98, 0.35),
(1, 3, 1, NULL, 2.29, 2.29, 0.11),
(1, 5, 1, NULL, 4.99, 4.99, 0.25),
(1, 10, 3, NULL, 1.99, 5.97, 0.30);

-- Update inventory after sale
UPDATE products SET stock_quantity = stock_quantity - 1 WHERE id = 1;
UPDATE products SET stock_quantity = stock_quantity - 2 WHERE id = 2;
UPDATE products SET stock_quantity = stock_quantity - 1 WHERE id = 3;
UPDATE products SET stock_quantity = stock_quantity - 1 WHERE id = 5;
UPDATE products SET stock_quantity = stock_quantity - 3 WHERE id = 10;

INSERT INTO inventory (product_id, quantity_change, type, reason, previous_quantity, new_quantity, performed_by) VALUES
(1, -1, 'SALE', 'Transaction TXN20240101001', 150, 149, 2),
(2, -2, 'SALE', 'Transaction TXN20240101001', 80, 78, 2),
(3, -1, 'SALE', 'Transaction TXN20240101001', 45, 44, 2),
(5, -1, 'SALE', 'Transaction TXN20240101001', 35, 34, 2),
(10, -3, 'SALE', 'Transaction TXN20240101001', 120, 117, 2);