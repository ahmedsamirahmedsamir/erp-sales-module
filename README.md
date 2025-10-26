# ERP Sales Module

A comprehensive sales management module for the LinearBits ERP system.

## Features

- Sales orders and quotations
- Invoice generation and management
- Payment tracking and processing
- Customer relationship management
- Price lists and discounts
- Sales analytics and reporting

## Installation

This module can be installed through the LinearBits ERP Marketplace or directly from GitHub.

## Usage

Once installed, the Sales module will be available in your ERP navigation menu under "Sales".

## API Endpoints

- `GET /api/v1/sales/orders` - List sales orders
- `POST /api/v1/sales/orders` - Create sales order
- `PUT /api/v1/sales/orders/{id}` - Update sales order
- `GET /api/v1/sales/quotes` - List quotations
- `POST /api/v1/sales/quotes` - Create quotation
- `GET /api/v1/sales/invoices` - List invoices
- `POST /api/v1/sales/invoices` - Create invoice
- `GET /api/v1/sales/payments` - List payments
- `POST /api/v1/sales/payments` - Record payment

## Permissions

- `sales.orders.view` - View sales orders
- `sales.orders.create` - Create sales orders
- `sales.orders.edit` - Edit sales orders
- `sales.orders.delete` - Delete sales orders
- `sales.quotes.view` - View quotations
- `sales.quotes.create` - Create quotations
- `sales.invoices.view` - View invoices
- `sales.invoices.create` - Create invoices
- `sales.payments.view` - View payments
- `sales.payments.create` - Record payments

## Database Tables

This module uses the following database tables:
- `sales_orders` - Sales order headers
- `sales_order_items` - Sales order line items
- `sales_quotes` - Quotation headers
- `sales_quote_items` - Quotation line items
- `sales_invoices` - Invoice headers
- `sales_invoice_items` - Invoice line items
- `sales_payments` - Payment records
- `price_lists` - Price list definitions
- `price_list_items` - Price list items

## License

MIT License - see LICENSE file for details.

## Support

For support and questions, please open an issue on GitHub or contact the LinearBits team.
