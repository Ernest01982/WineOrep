/*
  # Rep Dashboard Database Schema

  1. New Tables
    - `reps` - Store representative information
    - `clients` - Store client/customer information  
    - `visits` - Log rep visits to clients
    - `orders` - Store order information
    - `order_items` - Store individual order line items
    - `products` - Store product catalog
    - `budgets` - Store rep budget information
    - `free_stock_usage` - Track free stock usage
    - `rep_tasks` - Store tasks assigned to reps
    - `task_types` - Define task categories
    - `stock_discount_reasons` - Define valid discount reasons

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Allow reps to read relevant client and product data

  3. Features
    - UUID primary keys for all tables
    - Proper foreign key relationships
    - Default values and constraints for data integrity
    - Indexes for performance on frequently queried columns
*/

-- Reps table
CREATE TABLE IF NOT EXISTS reps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  region text NOT NULL,
  phone text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  region text NOT NULL,
  phone text,
  email text,
  contact_person text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text UNIQUE NOT NULL,
  unit_price decimal(10,2) NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'wine',
  description text,
  in_stock boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Task types table
CREATE TABLE IF NOT EXISTS task_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Stock discount reasons table
CREATE TABLE IF NOT EXISTS stock_discount_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reason text UNIQUE NOT NULL,
  max_discount_percentage integer NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Visits table
CREATE TABLE IF NOT EXISTS visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id uuid REFERENCES reps(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  check_in_time timestamptz NOT NULL DEFAULT now(),
  check_out_time timestamptz,
  visit_type text CHECK (visit_type IN ('good', 'missed', 'problem', 'bad')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id uuid REFERENCES reps(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  visit_id uuid REFERENCES visits(id) ON DELETE SET NULL,
  total_amount decimal(10,2) NOT NULL DEFAULT 0,
  discount_percentage integer DEFAULT 0,
  discount_reason_id uuid REFERENCES stock_discount_reasons(id) ON DELETE SET NULL,
  is_free_stock boolean DEFAULT false,
  pdf_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  unit_price decimal(10,2) NOT NULL DEFAULT 0,
  line_total decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Rep tasks table
CREATE TABLE IF NOT EXISTS rep_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id uuid REFERENCES reps(id) ON DELETE CASCADE,
  task_type_id uuid REFERENCES task_types(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date timestamptz,
  completed_at timestamptz,
  notes text,
  photo_url text,
  created_at timestamptz DEFAULT now()
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id uuid REFERENCES reps(id) ON DELETE CASCADE,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL,
  budget_amount decimal(10,2) NOT NULL DEFAULT 0,
  spent_amount decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(rep_id, month, year)
);

-- Free stock usage table
CREATE TABLE IF NOT EXISTS free_stock_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id uuid REFERENCES reps(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  unit_value decimal(10,2) NOT NULL DEFAULT 0,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_stock_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE rep_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_discount_reasons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reps
CREATE POLICY "Reps can read own data"
  ON reps
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

-- RLS Policies for clients (all reps can read clients)
CREATE POLICY "Authenticated users can read clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for products (all reps can read products)
CREATE POLICY "Authenticated users can read products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for task types (all reps can read task types)
CREATE POLICY "Authenticated users can read task types"
  ON task_types
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for discount reasons (all reps can read discount reasons)
CREATE POLICY "Authenticated users can read discount reasons"
  ON stock_discount_reasons
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for visits
CREATE POLICY "Reps can manage own visits"
  ON visits
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM reps WHERE reps.id = visits.rep_id AND auth.uid()::text = reps.id::text
  ));

-- RLS Policies for orders
CREATE POLICY "Reps can manage own orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM reps WHERE reps.id = orders.rep_id AND auth.uid()::text = reps.id::text
  ));

-- RLS Policies for order items
CREATE POLICY "Reps can manage own order items"
  ON order_items
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders 
    JOIN reps ON reps.id = orders.rep_id 
    WHERE orders.id = order_items.order_id AND auth.uid()::text = reps.id::text
  ));

-- RLS Policies for rep tasks
CREATE POLICY "Reps can manage own tasks"
  ON rep_tasks
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM reps WHERE reps.id = rep_tasks.rep_id AND auth.uid()::text = reps.id::text
  ));

-- RLS Policies for budgets
CREATE POLICY "Reps can manage own budgets"
  ON budgets
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM reps WHERE reps.id = budgets.rep_id AND auth.uid()::text = reps.id::text
  ));

-- RLS Policies for free stock usage
CREATE POLICY "Reps can manage own free stock usage"
  ON free_stock_usage
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM reps WHERE reps.id = free_stock_usage.rep_id AND auth.uid()::text = reps.id::text
  ));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_visits_rep_id ON visits(rep_id);
CREATE INDEX IF NOT EXISTS idx_visits_client_id ON visits(client_id);
CREATE INDEX IF NOT EXISTS idx_visits_check_in_time ON visits(check_in_time);
CREATE INDEX IF NOT EXISTS idx_orders_rep_id ON orders(rep_id);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_rep_tasks_rep_id ON rep_tasks(rep_id);
CREATE INDEX IF NOT EXISTS idx_rep_tasks_status ON rep_tasks(status);
CREATE INDEX IF NOT EXISTS idx_rep_tasks_due_date ON rep_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_clients_region ON clients(region);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock);