-- ============================================
-- MIGRATION: Add Orders Table
-- Date: 2025-01-06
-- Description: Restructure from Customer→Gates to Customer→Orders→Gates
-- ============================================

-- Step 1: Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL,
    order_number TEXT NOT NULL,
    type TEXT DEFAULT 'standard',
    status TEXT DEFAULT 'anfrage',
    sage_ref TEXT,
    appointment TEXT,
    follow_up_date TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Step 3: Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies
CREATE POLICY "Users can view their own orders"
    ON orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
    ON orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
    ON orders FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own orders"
    ON orders FOR DELETE
    USING (auth.uid() = user_id);

-- Step 5: Add order_id column to gates table
ALTER TABLE gates ADD COLUMN IF NOT EXISTS order_id TEXT;
CREATE INDEX IF NOT EXISTS idx_gates_order_id ON gates(order_id);

-- Step 6: Data Migration - Create default order for each customer with gates
-- This creates one order per customer that has gates
INSERT INTO orders (id, user_id, customer_id, order_number, type, status, sage_ref, appointment, follow_up_date, notes, created_at)
SELECT
    'order_' || c.id || '_default' as id,
    c.user_id,
    c.id as customer_id,
    'ORD-' || TO_CHAR(COALESCE(c.created_at, NOW()), 'YYYYMMDD') || '-001' as order_number,
    COALESCE(c.type, 'standard') as type,
    COALESCE(c.status, 'anfrage') as status,
    c.sage_ref,
    c.appointment,
    c.follow_up_date,
    'Automatisch bei Migration erstellt' as notes,
    COALESCE(c.created_at, NOW()) as created_at
FROM customers c
WHERE EXISTS (
    SELECT 1 FROM gates g WHERE g.customer_id = c.id
)
ON CONFLICT (id) DO NOTHING;

-- Step 7: Update gates to reference the new orders
UPDATE gates g
SET order_id = 'order_' || g.customer_id || '_default'
WHERE order_id IS NULL
  AND EXISTS (
    SELECT 1 FROM orders o WHERE o.id = 'order_' || g.customer_id || '_default'
);

-- Step 8: Add updated_at trigger for orders table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- OPTIONAL CLEANUP (uncomment if you want to remove old fields from customers)
-- ============================================
-- ALTER TABLE customers DROP COLUMN IF EXISTS type;
-- ALTER TABLE customers DROP COLUMN IF EXISTS status;
-- ALTER TABLE customers DROP COLUMN IF EXISTS sage_ref;
-- ALTER TABLE customers DROP COLUMN IF EXISTS appointment;
-- ALTER TABLE customers DROP COLUMN IF EXISTS follow_up_date;
-- ALTER TABLE customers DROP COLUMN IF EXISTS source;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Check orders created:
-- SELECT COUNT(*) as orders_count FROM orders;

-- Check gates with order_id:
-- SELECT COUNT(*) as gates_with_orders FROM gates WHERE order_id IS NOT NULL;

-- Check customers with orders:
-- SELECT c.name, COUNT(o.id) as order_count
-- FROM customers c
-- LEFT JOIN orders o ON o.customer_id = c.id
-- GROUP BY c.id, c.name;
