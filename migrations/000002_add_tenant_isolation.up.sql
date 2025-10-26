-- Add tenant isolation to sales module tables
-- This migration adds tenant_id columns and updates constraints for multi-tenant support

-- Add tenant_id to all sales module tables
ALTER TABLE sales_territories ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE sales_representatives ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE price_lists ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE price_list_items ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE sales_quote_lines ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE sales_invoice_lines ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE sales_payments ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE sales_returns ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE sales_return_lines ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Update unique constraints to include tenant_id
ALTER TABLE sales_territories DROP CONSTRAINT IF EXISTS sales_territories_code_key;
ALTER TABLE sales_territories ADD CONSTRAINT sales_territories_tenant_code_unique UNIQUE(tenant_id, code);

ALTER TABLE price_lists DROP CONSTRAINT IF EXISTS price_lists_code_key;
ALTER TABLE price_lists ADD CONSTRAINT price_lists_tenant_code_unique UNIQUE(tenant_id, code);

ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS sales_orders_order_number_key;
ALTER TABLE sales_orders ADD CONSTRAINT sales_orders_tenant_number_unique UNIQUE(tenant_id, order_number);

ALTER TABLE sales_quotes DROP CONSTRAINT IF EXISTS sales_quotes_quote_number_key;
ALTER TABLE sales_quotes ADD CONSTRAINT sales_quotes_tenant_number_unique UNIQUE(tenant_id, quote_number);

ALTER TABLE sales_invoices DROP CONSTRAINT IF EXISTS sales_invoices_invoice_number_key;
ALTER TABLE sales_invoices ADD CONSTRAINT sales_invoices_tenant_number_unique UNIQUE(tenant_id, invoice_number);

ALTER TABLE sales_payments DROP CONSTRAINT IF EXISTS sales_payments_payment_number_key;
ALTER TABLE sales_payments ADD CONSTRAINT sales_payments_tenant_number_unique UNIQUE(tenant_id, payment_number);

ALTER TABLE sales_returns DROP CONSTRAINT IF EXISTS sales_returns_return_number_key;
ALTER TABLE sales_returns ADD CONSTRAINT sales_returns_tenant_number_unique UNIQUE(tenant_id, return_number);

-- Add indexes on tenant_id for all tables
CREATE INDEX IF NOT EXISTS idx_sales_territories_tenant ON sales_territories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_representatives_tenant ON sales_representatives(tenant_id);
CREATE INDEX IF NOT EXISTS idx_price_lists_tenant ON price_lists(tenant_id);
CREATE INDEX IF NOT EXISTS idx_price_list_items_tenant ON price_list_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_tenant ON sales_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_lines_tenant ON sales_order_lines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_tenant ON sales_quotes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_quote_lines_tenant ON sales_quote_lines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_tenant ON sales_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_lines_tenant ON sales_invoice_lines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_payments_tenant ON sales_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_returns_tenant ON sales_returns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_return_lines_tenant ON sales_return_lines(tenant_id);

-- Add foreign keys to tenants table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_territories_tenant_fk') THEN
        ALTER TABLE sales_territories ADD CONSTRAINT sales_territories_tenant_fk 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_representatives_tenant_fk') THEN
        ALTER TABLE sales_representatives ADD CONSTRAINT sales_representatives_tenant_fk 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'price_lists_tenant_fk') THEN
        ALTER TABLE price_lists ADD CONSTRAINT price_lists_tenant_fk 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'price_list_items_tenant_fk') THEN
        ALTER TABLE price_list_items ADD CONSTRAINT price_list_items_tenant_fk 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_orders_tenant_fk') THEN
        ALTER TABLE sales_orders ADD CONSTRAINT sales_orders_tenant_fk 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_order_lines_tenant_fk') THEN
        ALTER TABLE sales_order_lines ADD CONSTRAINT sales_order_lines_tenant_fk 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_quotes_tenant_fk') THEN
        ALTER TABLE sales_quotes ADD CONSTRAINT sales_quotes_tenant_fk 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_quote_lines_tenant_fk') THEN
        ALTER TABLE sales_quote_lines ADD CONSTRAINT sales_quote_lines_tenant_fk 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_invoices_tenant_fk') THEN
        ALTER TABLE sales_invoices ADD CONSTRAINT sales_invoices_tenant_fk 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_invoice_lines_tenant_fk') THEN
        ALTER TABLE sales_invoice_lines ADD CONSTRAINT sales_invoice_lines_tenant_fk 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_payments_tenant_fk') THEN
        ALTER TABLE sales_payments ADD CONSTRAINT sales_payments_tenant_fk 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_returns_tenant_fk') THEN
        ALTER TABLE sales_returns ADD CONSTRAINT sales_returns_tenant_fk 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_return_lines_tenant_fk') THEN
        ALTER TABLE sales_return_lines ADD CONSTRAINT sales_return_lines_tenant_fk 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

