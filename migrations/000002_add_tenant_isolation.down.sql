-- Rollback tenant isolation from sales module tables

-- Remove all foreign keys
ALTER TABLE sales_territories DROP CONSTRAINT IF EXISTS sales_territories_tenant_fk;
ALTER TABLE sales_representatives DROP CONSTRAINT IF EXISTS sales_representatives_tenant_fk;
ALTER TABLE price_lists DROP CONSTRAINT IF EXISTS price_lists_tenant_fk;
ALTER TABLE price_list_items DROP CONSTRAINT IF EXISTS price_list_items_tenant_fk;
ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS sales_orders_tenant_fk;
ALTER TABLE sales_order_lines DROP CONSTRAINT IF EXISTS sales_order_lines_tenant_fk;
ALTER TABLE sales_quotes DROP CONSTRAINT IF EXISTS sales_quotes_tenant_fk;
ALTER TABLE sales_quote_lines DROP CONSTRAINT IF EXISTS sales_quote_lines_tenant_fk;
ALTER TABLE sales_invoices DROP CONSTRAINT IF EXISTS sales_invoices_tenant_fk;
ALTER TABLE sales_invoice_lines DROP CONSTRAINT IF EXISTS sales_invoice_lines_tenant_fk;
ALTER TABLE sales_payments DROP CONSTRAINT IF EXISTS sales_payments_tenant_fk;
ALTER TABLE sales_returns DROP CONSTRAINT IF EXISTS sales_returns_tenant_fk;
ALTER TABLE sales_return_lines DROP CONSTRAINT IF EXISTS sales_return_lines_tenant_fk;

-- Remove all indexes
DROP INDEX IF EXISTS idx_sales_territories_tenant;
DROP INDEX IF EXISTS idx_sales_representatives_tenant;
DROP INDEX IF EXISTS idx_price_lists_tenant;
DROP INDEX IF EXISTS idx_price_list_items_tenant;
DROP INDEX IF EXISTS idx_sales_orders_tenant;
DROP INDEX IF EXISTS idx_sales_order_lines_tenant;
DROP INDEX IF EXISTS idx_sales_quotes_tenant;
DROP INDEX IF EXISTS idx_sales_quote_lines_tenant;
DROP INDEX IF EXISTS idx_sales_invoices_tenant;
DROP INDEX IF EXISTS idx_sales_invoice_lines_tenant;
DROP INDEX IF EXISTS idx_sales_payments_tenant;
DROP INDEX IF EXISTS idx_sales_returns_tenant;
DROP INDEX IF EXISTS idx_sales_return_lines_tenant;

-- Restore original unique constraints
ALTER TABLE sales_territories DROP CONSTRAINT IF EXISTS sales_territories_tenant_code_unique;
ALTER TABLE sales_territories ADD CONSTRAINT sales_territories_code_key UNIQUE(code);

ALTER TABLE price_lists DROP CONSTRAINT IF EXISTS price_lists_tenant_code_unique;
ALTER TABLE price_lists ADD CONSTRAINT price_lists_code_key UNIQUE(code);

ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS sales_orders_tenant_number_unique;
ALTER TABLE sales_orders ADD CONSTRAINT sales_orders_order_number_key UNIQUE(order_number);

ALTER TABLE sales_quotes DROP CONSTRAINT IF EXISTS sales_quotes_tenant_number_unique;
ALTER TABLE sales_quotes ADD CONSTRAINT sales_quotes_quote_number_key UNIQUE(quote_number);

ALTER TABLE sales_invoices DROP CONSTRAINT IF EXISTS sales_invoices_tenant_number_unique;
ALTER TABLE sales_invoices ADD CONSTRAINT sales_invoices_invoice_number_key UNIQUE(invoice_number);

ALTER TABLE sales_payments DROP CONSTRAINT IF EXISTS sales_payments_tenant_number_unique;
ALTER TABLE sales_payments ADD CONSTRAINT sales_payments_payment_number_key UNIQUE(payment_number);

ALTER TABLE sales_returns DROP CONSTRAINT IF EXISTS sales_returns_tenant_number_unique;
ALTER TABLE sales_returns ADD CONSTRAINT sales_returns_return_number_key UNIQUE(return_number);

-- Remove tenant_id columns
ALTER TABLE sales_territories DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE sales_representatives DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE price_lists DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE price_list_items DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE sales_orders DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE sales_order_lines DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE sales_quotes DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE sales_quote_lines DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE sales_invoices DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE sales_invoice_lines DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE sales_payments DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE sales_returns DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE sales_return_lines DROP COLUMN IF EXISTS tenant_id;

