-- Down migration for sales module
-- Drop all sales module tables in reverse order

DROP TABLE IF EXISTS sales_order_items CASCADE;
DROP TABLE IF EXISTS sales_orders CASCADE;
DROP TABLE IF EXISTS sales_quotations CASCADE;
DROP TABLE IF EXISTS sales_invoices CASCADE;
DROP TABLE IF EXISTS sales_payments CASCADE;
DROP TABLE IF EXISTS sales_returns CASCADE;
DROP TABLE IF EXISTS sales_commissions CASCADE;
DROP TABLE IF EXISTS sales_territories CASCADE;

