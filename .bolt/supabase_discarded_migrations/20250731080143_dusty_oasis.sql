/*
  # Seed Data for Rep Dashboard

  1. Sample Data
    - Insert sample reps, clients, products
    - Insert task types and discount reasons
    - Create some sample visits and orders for demo

  2. Test Data
    - Provides realistic data for testing the application
    - Covers different regions and scenarios
*/

-- Insert sample reps
INSERT INTO reps (id, name, email, region, phone) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'John Smith', 'john@example.com', 'North', '+1-555-0101'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Sarah Johnson', 'sarah@example.com', 'South', '+1-555-0102'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Mike Wilson', 'mike@example.com', 'East', '+1-555-0103')
ON CONFLICT (id) DO NOTHING;

-- Insert sample clients
INSERT INTO clients (id, name, address, region, phone, email, contact_person) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'Downtown Wine Co.', '123 Main St, City Center', 'North', '+1-555-1001', 'orders@downtownwine.com', 'Alice Manager'),
  ('660e8400-e29b-41d4-a716-446655440002', 'Metro Liquor Store', '456 Oak Ave, Metro District', 'North', '+1-555-1002', 'info@metroliquor.com', 'Bob Owner'),
  ('660e8400-e29b-41d4-a716-446655440003', 'Southside Spirits', '789 Pine Rd, Southside', 'South', '+1-555-1003', 'contact@southsidespirits.com', 'Carol Smith'),
  ('660e8400-e29b-41d4-a716-446655440004', 'Eastern Wine Depot', '321 Elm St, East Town', 'East', '+1-555-1004', 'sales@easternwine.com', 'David Johnson'),
  ('660e8400-e29b-41d4-a716-446655440005', 'City Center Cellars', '654 Maple Dr, Downtown', 'North', '+1-555-1005', 'orders@citycellars.com', 'Emma Wilson')
ON CONFLICT (id) DO NOTHING;

-- Insert sample products
INSERT INTO products (id, name, sku, unit_price, category, description) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', 'Premium Cabernet Sauvignon', 'WINE-CAB-001', 24.99, 'Red Wine', 'Full-bodied red wine with rich berry flavors'),
  ('770e8400-e29b-41d4-a716-446655440002', 'Classic Chardonnay', 'WINE-CHAR-001', 19.99, 'White Wine', 'Crisp white wine with citrus notes'),
  ('770e8400-e29b-41d4-a716-446655440003', 'Vintage Pinot Noir', 'WINE-PINOT-001', 29.99, 'Red Wine', 'Elegant red wine with subtle earth tones'),
  ('770e8400-e29b-41d4-a716-446655440004', 'Sparkling Rosé', 'WINE-ROSE-001', 34.99, 'Sparkling', 'Light and bubbly with fresh fruit flavors'),
  ('770e8400-e29b-41d4-a716-446655440005', 'Reserve Merlot', 'WINE-MER-001', 22.99, 'Red Wine', 'Smooth red wine with chocolate undertones'),
  ('770e8400-e29b-41d4-a716-446655440006', 'Sauvignon Blanc', 'WINE-SAUV-001', 17.99, 'White Wine', 'Bright white wine with grassy notes'),
  ('770e8400-e29b-41d4-a716-446655440007', 'Premium Champagne', 'WINE-CHAMP-001', 49.99, 'Sparkling', 'Luxury sparkling wine for special occasions')
ON CONFLICT (id) DO NOTHING;

-- Insert task types
INSERT INTO task_types (id, name, description) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', 'Client Visit', 'Schedule and complete client visits'),
  ('880e8400-e29b-41d4-a716-446655440002', 'Inventory Check', 'Verify product inventory levels'),
  ('880e8400-e29b-41d4-a716-446655440003', 'Follow-up Call', 'Make follow-up calls to clients'),
  ('880e8400-e29b-41d4-a716-446655440004', 'Marketing Campaign', 'Execute promotional activities'),
  ('880e8400-e29b-41d4-a716-446655440005', 'Training Session', 'Attend product training sessions')
ON CONFLICT (id) DO NOTHING;

-- Insert stock discount reasons
INSERT INTO stock_discount_reasons (id, reason, max_discount_percentage) VALUES
  ('990e8400-e29b-41d4-a716-446655440001', 'Volume Discount', 15),
  ('990e8400-e29b-41d4-a716-446655440002', 'Customer Loyalty', 10),
  ('990e8400-e29b-41d4-a716-446655440003', 'End of Season', 25),
  ('990e8400-e29b-41d4-a716-446655440004', 'Promotional Campaign', 20),
  ('990e8400-e29b-41d4-a716-446655440005', 'Bulk Order', 12)
ON CONFLICT (id) DO NOTHING;

-- Insert sample visits for John Smith
INSERT INTO visits (id, rep_id, client_id, check_in_time, check_out_time, visit_type, notes) VALUES
  ('aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '2024-01-15 10:00:00', '2024-01-15 11:30:00', 'good', 'Great meeting with Alice. Discussed new product line.'),
  ('aa0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', '2024-01-15 14:00:00', '2024-01-15 15:15:00', 'good', 'Bob is interested in increasing order volume.')
ON CONFLICT (id) DO NOTHING;

-- Insert sample orders
INSERT INTO orders (id, rep_id, client_id, visit_id, total_amount, discount_percentage, is_free_stock) VALUES
  ('bb0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'aa0e8400-e29b-41d4-a716-446655440001', 299.88, 10, false),
  ('bb0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 'aa0e8400-e29b-41d4-a716-446655440002', 0.00, 100, true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample order items
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, line_total) VALUES
  ('cc0e8400-e29b-41d4-a716-446655440001', 'bb0e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 6, 24.99, 149.94),
  ('cc0e8400-e29b-41d4-a716-446655440002', 'bb0e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 6, 19.99, 119.94),
  ('cc0e8400-e29b-41d4-a716-446655440003', 'bb0e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440004', 2, 34.99, 69.98)
ON CONFLICT (id) DO NOTHING;

-- Insert sample tasks for John Smith
INSERT INTO rep_tasks (id, rep_id, task_type_id, title, description, status, due_date) VALUES
  ('dd0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', 'Visit City Center Cellars', 'Schedule initial meeting with new client', 'pending', '2024-01-20 15:00:00'),
  ('dd0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440003', 'Follow up with Downtown Wine Co.', 'Check on last order delivery status', 'in_progress', '2024-01-18 10:00:00'),
  ('dd0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440002', 'Inventory check at Metro Liquor', 'Verify stock levels for reorder', 'pending', '2024-01-22 09:00:00')
ON CONFLICT (id) DO NOTHING;

-- Insert sample budgets
INSERT INTO budgets (id, rep_id, month, year, budget_amount, spent_amount) VALUES
  ('ee0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 1, 2024, 5000.00, 1200.50),
  ('ee0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 1, 2024, 4500.00, 890.25),
  ('ee0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 1, 2024, 6000.00, 2100.75)
ON CONFLICT (id) DO NOTHING;