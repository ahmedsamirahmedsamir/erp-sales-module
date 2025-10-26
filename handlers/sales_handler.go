package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jmoiron/sqlx"
	sdk "github.com/linearbits/erp-backend/pkg/module-sdk"
	"go.uber.org/zap"
)

// Local domain types
type SalesOrder struct {
	ID              int                  `json:"id"`
	OrderNumber     string               `json:"order_number"`
	CustomerID      int                  `json:"customer_id"`
	QuoteID         *int                 `json:"quote_id"`
	OrderDate       time.Time            `json:"order_date"`
	RequiredDate    *time.Time           `json:"required_date"`
	ShippedDate     *time.Time           `json:"shipped_date"`
	Status          string               `json:"status"`
	Subtotal        float64              `json:"subtotal"`
	TaxAmount       float64              `json:"tax_amount"`
	DiscountAmount  float64              `json:"discount_amount"`
	ShippingAmount  float64              `json:"shipping_amount"`
	TotalAmount     float64              `json:"total_amount"`
	Currency        string               `json:"currency"`
	PaymentTerms    *string              `json:"payment_terms"`
	ShippingAddress interface{}          `json:"shipping_address"`
	BillingAddress  interface{}          `json:"billing_address"`
	Notes           *string              `json:"notes"`
	SalesRepID      *int                 `json:"sales_rep_id"`
	CreatedBy       int                  `json:"created_by"`
	CreatedAt       time.Time            `json:"created_at"`
	UpdatedAt       time.Time            `json:"updated_at"`
	Customer        *Customer            `json:"customer,omitempty"`
	SalesRep        *SalesRepresentative `json:"sales_rep,omitempty"`
	Items           []SalesOrderItem     `json:"items,omitempty"`
}

type Customer struct {
	ID          int     `json:"id"`
	CompanyName *string `json:"company_name"`
	FirstName   *string `json:"first_name"`
	LastName    *string `json:"last_name"`
	Email       *string `json:"email"`
	Phone       *string `json:"phone"`
}

type SalesRepresentative struct {
	ID        int     `json:"id"`
	FirstName *string `json:"first_name"`
	LastName  *string `json:"last_name"`
}

type SalesOrderItem struct {
	ID              int       `json:"id"`
	OrderID         int       `json:"order_id"`
	ProductID       int       `json:"product_id"`
	Quantity        int       `json:"quantity"`
	UnitPrice       float64   `json:"unit_price"`
	DiscountPercent float64   `json:"discount_percent"`
	DiscountAmount  float64   `json:"discount_amount"`
	LineTotal       float64   `json:"line_total"`
	ShippedQuantity int       `json:"shipped_quantity"`
	Notes           *string   `json:"notes"`
	CreatedAt       time.Time `json:"created_at"`
	Product         *Product  `json:"product,omitempty"`
}

type Product struct {
	ID          int     `json:"id"`
	Name        string  `json:"name"`
	SKU         string  `json:"sku"`
	Description *string `json:"description"`
}

type SalesQuote struct {
	ID             int                  `json:"id"`
	QuoteNumber    string               `json:"quote_number"`
	CustomerID     int                  `json:"customer_id"`
	QuoteDate      time.Time            `json:"quote_date"`
	ValidUntil     *time.Time           `json:"valid_until"`
	Status         string               `json:"status"`
	Subtotal       float64              `json:"subtotal"`
	TaxAmount      float64              `json:"tax_amount"`
	DiscountAmount float64              `json:"discount_amount"`
	TotalAmount    float64              `json:"total_amount"`
	Currency       string               `json:"currency"`
	Notes          *string              `json:"notes"`
	Terms          *string              `json:"terms"`
	SalesRepID     *int                 `json:"sales_rep_id"`
	CreatedBy      int                  `json:"created_by"`
	CreatedAt      time.Time            `json:"created_at"`
	UpdatedAt      time.Time            `json:"updated_at"`
	Customer       *Customer            `json:"customer,omitempty"`
	SalesRep       *SalesRepresentative `json:"sales_rep,omitempty"`
	Items          []SalesQuoteItem     `json:"items,omitempty"`
}

type SalesQuoteItem struct {
	ID              int       `json:"id"`
	QuoteID         int       `json:"quote_id"`
	ProductID       int       `json:"product_id"`
	Quantity        int       `json:"quantity"`
	UnitPrice       float64   `json:"unit_price"`
	DiscountPercent float64   `json:"discount_percent"`
	DiscountAmount  float64   `json:"discount_amount"`
	LineTotal       float64   `json:"line_total"`
	Notes           *string   `json:"notes"`
	CreatedAt       time.Time `json:"created_at"`
}

// SalesHandler handles all sales-related HTTP requests
type SalesHandler struct {
	db     *sqlx.DB
	logger *zap.Logger
}

// NewSalesHandler creates a new sales handler
func NewSalesHandler(db *sqlx.DB, logger *zap.Logger) *SalesHandler {
	return &SalesHandler{db: db, logger: logger}
}

// Sales Order Handlers

// GetSalesOrders retrieves all sales orders with optional filtering
func (h *SalesHandler) GetSalesOrders(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	customerID := r.URL.Query().Get("customer_id")
	limit := r.URL.Query().Get("limit")

	if limit == "" {
		limit = "50"
	}

	query := `
		SELECT so.*, c.first_name, c.last_name, c.company_name, c.email,
		       sr.first_name as rep_first_name, sr.last_name as rep_last_name
		FROM sales_orders so
		LEFT JOIN customers c ON so.customer_id = c.id
		LEFT JOIN sales_representatives sr ON so.sales_rep_id = sr.id
		WHERE 1=1
	`

	args := []interface{}{}
	argIndex := 1

	if status != "" {
		query += fmt.Sprintf(" AND so.status = $%d", argIndex)
		args = append(args, status)
		argIndex++
	}

	if customerID != "" {
		query += fmt.Sprintf(" AND so.customer_id = $%d", argIndex)
		args = append(args, customerID)
		argIndex++
	}

	query += fmt.Sprintf(" ORDER BY so.order_date DESC LIMIT $%d", argIndex)
	args = append(args, limit)

	rows, err := h.db.Query(query, args...)
	if err != nil {
		sdk.WriteError(w, http.StatusInternalServerError, "Failed to fetch sales orders")
		return
	}
	defer rows.Close()

	var orders []SalesOrder
	for rows.Next() {
		var order SalesOrder
		var firstName, lastName, companyName, email, repFirstName, repLastName sql.NullString

		err := rows.Scan(
			&order.ID, &order.OrderNumber, &order.CustomerID, &order.QuoteID,
			&order.OrderDate, &order.RequiredDate, &order.ShippedDate, &order.Status,
			&order.Subtotal, &order.TaxAmount, &order.DiscountAmount, &order.ShippingAmount,
			&order.TotalAmount, &order.Currency, &order.PaymentTerms, &order.ShippingAddress,
			&order.BillingAddress, &order.Notes, &order.SalesRepID, &order.CreatedBy,
			&order.CreatedAt, &order.UpdatedAt, &firstName, &lastName, &companyName, &email,
			&repFirstName, &repLastName,
		)
		if err != nil {
			// Error scanning - skip this order
			continue
		}

		order.Customer = &Customer{
			ID:          order.CustomerID,
			CompanyName: &companyName.String,
			FirstName:   &firstName.String,
			LastName:    &lastName.String,
			Email:       &email.String,
		}

		if repFirstName.Valid && order.SalesRepID != nil {
			order.SalesRep = &SalesRepresentative{
				ID:        *order.SalesRepID,
				FirstName: &repFirstName.String,
				LastName:  &repLastName.String,
			}
		}

		orders = append(orders, order)
	}

	sdk.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"orders": orders,
		"count":  len(orders),
	})
}

// GetSalesOrder retrieves a single sales order by ID
func (h *SalesHandler) GetSalesOrder(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		sdk.WriteError(w, http.StatusBadRequest, "Invalid order ID")
		return
	}

	// Get order details
	query := `
		SELECT so.*, c.first_name, c.last_name, c.company_name, c.email, c.phone,
		       sr.first_name as rep_first_name, sr.last_name as rep_last_name
		FROM sales_orders so
		LEFT JOIN customers c ON so.customer_id = c.id
		LEFT JOIN sales_representatives sr ON so.sales_rep_id = sr.id
		WHERE so.id = $1
	`

	var order SalesOrder
	var firstName, lastName, companyName, email, phone, repFirstName, repLastName sql.NullString

	err = h.db.QueryRow(query, id).Scan(
		&order.ID, &order.OrderNumber, &order.CustomerID, &order.QuoteID,
		&order.OrderDate, &order.RequiredDate, &order.ShippedDate, &order.Status,
		&order.Subtotal, &order.TaxAmount, &order.DiscountAmount, &order.ShippingAmount,
		&order.TotalAmount, &order.Currency, &order.PaymentTerms, &order.ShippingAddress,
		&order.BillingAddress, &order.Notes, &order.SalesRepID, &order.CreatedBy,
		&order.CreatedAt, &order.UpdatedAt, &firstName, &lastName, &companyName, &email, &phone,
		&repFirstName, &repLastName,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			sdk.WriteError(w, http.StatusNotFound, "Sales order not found")
			return
		}
		// Error:"Failed to fetch sales order", zap.Error(err))
		sdk.WriteError(w, http.StatusInternalServerError, "Failed to fetch sales order")
		return
	}

	order.Customer = &Customer{
		ID:          order.CustomerID,
		CompanyName: &companyName.String,
		FirstName:   &firstName.String,
		LastName:    &lastName.String,
		Email:       &email.String,
		Phone:       &phone.String,
	}

	if repFirstName.Valid && order.SalesRepID != nil {
		order.SalesRep = &SalesRepresentative{
			ID:        *order.SalesRepID,
			FirstName: &repFirstName.String,
			LastName:  &repLastName.String,
		}
	}

	// Get order items
	itemsQuery := `
		SELECT soi.*, p.name as product_name, p.sku, p.description
		FROM sales_order_items soi
		JOIN products p ON soi.product_id = p.id
		WHERE soi.order_id = $1
		ORDER BY soi.id
	`

	itemRows, err := h.db.Query(itemsQuery, id)
	if err == nil {
		defer itemRows.Close()

		for itemRows.Next() {
			var item SalesOrderItem
			var productName, sku, description sql.NullString

			err := itemRows.Scan(
				&item.ID, &item.OrderID, &item.ProductID, &item.Quantity,
				&item.UnitPrice, &item.DiscountPercent, &item.DiscountAmount,
				&item.LineTotal, &item.ShippedQuantity, &item.Notes, &item.CreatedAt,
				&productName, &sku, &description,
			)
			if err != nil {
				continue
			}

			item.Product = &Product{
				ID:          item.ProductID,
				Name:        productName.String,
				SKU:         sku.String,
				Description: &description.String,
			}

			order.Items = append(order.Items, item)
		}
	}

	sdk.WriteJSON(w, http.StatusOK, order)
}

// CreateSalesOrder creates a new sales order
func (h *SalesHandler) CreateSalesOrder(w http.ResponseWriter, r *http.Request) {
	var req struct {
		CustomerID      int              `json:"customer_id" validate:"required"`
		QuoteID         *int             `json:"quote_id"`
		OrderDate       string           `json:"order_date" validate:"required"`
		RequiredDate    *string          `json:"required_date"`
		PaymentTerms    *string          `json:"payment_terms"`
		ShippingAddress *string          `json:"shipping_address"`
		BillingAddress  *string          `json:"billing_address"`
		Notes           *string          `json:"notes"`
		SalesRepID      *int             `json:"sales_rep_id"`
		Items           []SalesOrderItem `json:"items" validate:"required"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sdk.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if len(req.Items) == 0 {
		sdk.WriteError(w, http.StatusBadRequest, "At least one item is required")
		return
	}

	// Parse order date
	orderDate, err := time.Parse("2006-01-02", req.OrderDate)
	if err != nil {
		sdk.WriteError(w, http.StatusBadRequest, "Invalid order date format")
		return
	}

	var requiredDate *time.Time
	if req.RequiredDate != nil {
		rd, err := time.Parse("2006-01-02", *req.RequiredDate)
		if err != nil {
			sdk.WriteError(w, http.StatusBadRequest, "Invalid required date format")
			return
		}
		requiredDate = &rd
	}

	// Generate order number
	orderNumber := fmt.Sprintf("SO-%d", time.Now().Unix())

	// Start transaction
	tx, err := h.db.Beginx()
	if err != nil {
		// Error:"Failed to begin transaction", zap.Error(err))
		sdk.WriteError(w, http.StatusInternalServerError, "Failed to create order")
		return
	}
	defer tx.Rollback()

	// Calculate totals
	var subtotal, taxAmount, discountAmount float64
	for _, item := range req.Items {
		lineTotal := float64(item.Quantity) * item.UnitPrice
		if item.DiscountAmount > 0 {
			lineTotal -= item.DiscountAmount
		}
		subtotal += lineTotal
		discountAmount += item.DiscountAmount
	}

	totalAmount := subtotal + taxAmount + discountAmount

	// Create sales order
	orderQuery := `
		INSERT INTO sales_orders (order_number, customer_id, quote_id, order_date, required_date,
		                          subtotal, tax_amount, discount_amount, shipping_amount, total_amount,
		                          currency, payment_terms, shipping_address, billing_address, notes,
		                          sales_rep_id, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
		RETURNING id, created_at, updated_at
	`

	var orderID int
	var createdAt, updatedAt time.Time

	err = tx.QueryRow(orderQuery, orderNumber, req.CustomerID, req.QuoteID, orderDate, requiredDate,
		subtotal, taxAmount, discountAmount, 0, totalAmount, "USD", req.PaymentTerms,
		req.ShippingAddress, req.BillingAddress, req.Notes, req.SalesRepID, 1).
		Scan(&orderID, &createdAt, &updatedAt)

	if err != nil {
		// Error:"Failed to create sales order", zap.Error(err))
		sdk.WriteError(w, http.StatusInternalServerError, "Failed to create sales order")
		return
	}

	// Create order items
	for _, item := range req.Items {
		itemQuery := `
			INSERT INTO sales_order_items (order_id, product_id, quantity, unit_price,
			                               discount_percent, discount_amount, notes)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`

		_, err = tx.Exec(itemQuery, orderID, item.ProductID, item.Quantity, item.UnitPrice,
			item.DiscountPercent, item.DiscountAmount, item.Notes)
		if err != nil {
			// Error:"Failed to create order item", zap.Error(err))
			sdk.WriteError(w, http.StatusInternalServerError, "Failed to create order item")
			return
		}
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		// Error:"Failed to commit transaction", zap.Error(err))
		sdk.WriteError(w, http.StatusInternalServerError, "Failed to create order")
		return
	}

	sdk.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"order_id":     orderID,
		"order_number": orderNumber,
		"created_at":   createdAt,
		"updated_at":   updatedAt,
		"message":      "Sales order created successfully",
	})
}

// UpdateSalesOrder updates an existing sales order
func (h *SalesHandler) UpdateSalesOrder(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		sdk.WriteError(w, http.StatusBadRequest, "Invalid order ID")
		return
	}

	var req struct {
		Status          *string `json:"status"`
		RequiredDate    *string `json:"required_date"`
		ShippedDate     *string `json:"shipped_date"`
		PaymentTerms    *string `json:"payment_terms"`
		ShippingAddress *string `json:"shipping_address"`
		BillingAddress  *string `json:"billing_address"`
		Notes           *string `json:"notes"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sdk.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Build dynamic update query
	setParts := []string{}
	args := []interface{}{}
	argIndex := 1

	if req.Status != nil {
		setParts = append(setParts, fmt.Sprintf("status = $%d", argIndex))
		args = append(args, *req.Status)
		argIndex++
	}
	if req.RequiredDate != nil {
		rd, err := time.Parse("2006-01-02", *req.RequiredDate)
		if err != nil {
			sdk.WriteError(w, http.StatusBadRequest, "Invalid required date format")
			return
		}
		setParts = append(setParts, fmt.Sprintf("required_date = $%d", argIndex))
		args = append(args, rd)
		argIndex++
	}
	if req.ShippedDate != nil {
		sd, err := time.Parse("2006-01-02", *req.ShippedDate)
		if err != nil {
			sdk.WriteError(w, http.StatusBadRequest, "Invalid shipped date format")
			return
		}
		setParts = append(setParts, fmt.Sprintf("shipped_date = $%d", argIndex))
		args = append(args, sd)
		argIndex++
	}
	if req.PaymentTerms != nil {
		setParts = append(setParts, fmt.Sprintf("payment_terms = $%d", argIndex))
		args = append(args, *req.PaymentTerms)
		argIndex++
	}
	if req.ShippingAddress != nil {
		setParts = append(setParts, fmt.Sprintf("shipping_address = $%d", argIndex))
		args = append(args, *req.ShippingAddress)
		argIndex++
	}
	if req.BillingAddress != nil {
		setParts = append(setParts, fmt.Sprintf("billing_address = $%d", argIndex))
		args = append(args, *req.BillingAddress)
		argIndex++
	}
	if req.Notes != nil {
		setParts = append(setParts, fmt.Sprintf("notes = $%d", argIndex))
		args = append(args, *req.Notes)
		argIndex++
	}

	if len(setParts) == 0 {
		sdk.WriteError(w, http.StatusBadRequest, "No fields to update")
		return
	}

	query := fmt.Sprintf("UPDATE sales_orders SET %s WHERE id = $%d",
		fmt.Sprintf("%s", setParts[0]), argIndex)
	for i := 1; i < len(setParts); i++ {
		query = fmt.Sprintf("UPDATE sales_orders SET %s WHERE id = $%d",
			fmt.Sprintf("%s, %s", query[19:], setParts[i]), argIndex)
	}
	args = append(args, id)

	result, err := h.db.Exec(query, args...)
	if err != nil {
		// Error:"Failed to update sales order", zap.Error(err))
		sdk.WriteError(w, http.StatusInternalServerError, "Failed to update sales order")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		// Error:"Failed to get rows affected", zap.Error(err))
		sdk.WriteError(w, http.StatusInternalServerError, "Failed to update sales order")
		return
	}

	if rowsAffected == 0 {
		sdk.WriteError(w, http.StatusNotFound, "Sales order not found")
		return
	}

	sdk.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Sales order updated successfully",
	})
}

// Sales Quote Handlers

// GetSalesQuotes retrieves all sales quotes
func (h *SalesHandler) GetSalesQuotes(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	customerID := r.URL.Query().Get("customer_id")
	limit := r.URL.Query().Get("limit")

	if limit == "" {
		limit = "50"
	}

	query := `
		SELECT sq.*, c.first_name, c.last_name, c.company_name, c.email,
		       sr.first_name as rep_first_name, sr.last_name as rep_last_name
		FROM sales_quotes sq
		LEFT JOIN customers c ON sq.customer_id = c.id
		LEFT JOIN sales_representatives sr ON sq.sales_rep_id = sr.id
		WHERE 1=1
	`

	args := []interface{}{}
	argIndex := 1

	if status != "" {
		query += fmt.Sprintf(" AND sq.status = $%d", argIndex)
		args = append(args, status)
		argIndex++
	}

	if customerID != "" {
		query += fmt.Sprintf(" AND sq.customer_id = $%d", argIndex)
		args = append(args, customerID)
		argIndex++
	}

	query += fmt.Sprintf(" ORDER BY sq.quote_date DESC LIMIT $%d", argIndex)
	args = append(args, limit)

	rows, err := h.db.Query(query, args...)
	if err != nil {
		// Error:"Failed to fetch sales quotes", zap.Error(err))
		sdk.WriteError(w, http.StatusInternalServerError, "Failed to fetch sales quotes")
		return
	}
	defer rows.Close()

	var quotes []SalesQuote
	for rows.Next() {
		var quote SalesQuote
		var firstName, lastName, companyName, email, repFirstName, repLastName sql.NullString

		err := rows.Scan(
			&quote.ID, &quote.QuoteNumber, &quote.CustomerID, &quote.QuoteDate,
			&quote.ValidUntil, &quote.Status, &quote.Subtotal, &quote.TaxAmount,
			&quote.DiscountAmount, &quote.TotalAmount, &quote.Currency, &quote.Notes,
			&quote.Terms, &quote.SalesRepID, &quote.CreatedBy, &quote.CreatedAt,
			&quote.UpdatedAt, &firstName, &lastName, &companyName, &email,
			&repFirstName, &repLastName,
		)
		if err != nil {
			// Error:"Failed to scan sales quote", zap.Error(err))
			continue
		}

		quote.Customer = &Customer{
			ID:          quote.CustomerID,
			CompanyName: &companyName.String,
			FirstName:   &firstName.String,
			LastName:    &lastName.String,
			Email:       &email.String,
		}

		if repFirstName.Valid && quote.SalesRepID != nil {
			quote.SalesRep = &SalesRepresentative{
				ID:        *quote.SalesRepID,
				FirstName: &repFirstName.String,
				LastName:  &repLastName.String,
			}
		}

		quotes = append(quotes, quote)
	}

	sdk.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"quotes": quotes,
		"count":  len(quotes),
	})
}

// CreateSalesQuote creates a new sales quote
func (h *SalesHandler) CreateSalesQuote(w http.ResponseWriter, r *http.Request) {
	var req struct {
		CustomerID int              `json:"customer_id" validate:"required"`
		QuoteDate  string           `json:"quote_date" validate:"required"`
		ValidUntil *string          `json:"valid_until"`
		Notes      *string          `json:"notes"`
		Terms      *string          `json:"terms"`
		SalesRepID *int             `json:"sales_rep_id"`
		Items      []SalesQuoteItem `json:"items" validate:"required"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sdk.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if len(req.Items) == 0 {
		sdk.WriteError(w, http.StatusBadRequest, "At least one item is required")
		return
	}

	// Parse quote date
	quoteDate, err := time.Parse("2006-01-02", req.QuoteDate)
	if err != nil {
		sdk.WriteError(w, http.StatusBadRequest, "Invalid quote date format")
		return
	}

	var validUntil *time.Time
	if req.ValidUntil != nil {
		vu, err := time.Parse("2006-01-02", *req.ValidUntil)
		if err != nil {
			sdk.WriteError(w, http.StatusBadRequest, "Invalid valid until date format")
			return
		}
		validUntil = &vu
	}

	// Generate quote number
	quoteNumber := fmt.Sprintf("SQ-%d", time.Now().Unix())

	// Start transaction
	tx, err := h.db.Beginx()
	if err != nil {
		// Error:"Failed to begin transaction", zap.Error(err))
		sdk.WriteError(w, http.StatusInternalServerError, "Failed to create quote")
		return
	}
	defer tx.Rollback()

	// Calculate totals
	var subtotal, taxAmount, discountAmount float64
	for _, item := range req.Items {
		lineTotal := float64(item.Quantity) * item.UnitPrice
		if item.DiscountAmount > 0 {
			lineTotal -= item.DiscountAmount
		}
		subtotal += lineTotal
		discountAmount += item.DiscountAmount
	}

	totalAmount := subtotal + taxAmount + discountAmount

	// Create sales quote
	quoteQuery := `
		INSERT INTO sales_quotes (quote_number, customer_id, quote_date, valid_until,
		                          subtotal, tax_amount, discount_amount, total_amount,
		                          currency, notes, terms, sales_rep_id, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id, created_at, updated_at
	`

	var quoteID int
	var createdAt, updatedAt time.Time

	err = tx.QueryRow(quoteQuery, quoteNumber, req.CustomerID, quoteDate, validUntil,
		subtotal, taxAmount, discountAmount, totalAmount, "USD", req.Notes,
		req.Terms, req.SalesRepID, 1).Scan(&quoteID, &createdAt, &updatedAt)

	if err != nil {
		// Error:"Failed to create sales quote", zap.Error(err))
		sdk.WriteError(w, http.StatusInternalServerError, "Failed to create sales quote")
		return
	}

	// Create quote items
	for _, item := range req.Items {
		itemQuery := `
			INSERT INTO sales_quote_items (quote_id, product_id, quantity, unit_price,
			                               discount_percent, discount_amount, notes)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`

		_, err = tx.Exec(itemQuery, quoteID, item.ProductID, item.Quantity, item.UnitPrice,
			item.DiscountPercent, item.DiscountAmount, item.Notes)
		if err != nil {
			// Error:"Failed to create quote item", zap.Error(err))
			sdk.WriteError(w, http.StatusInternalServerError, "Failed to create quote item")
			return
		}
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		// Error:"Failed to commit transaction", zap.Error(err))
		sdk.WriteError(w, http.StatusInternalServerError, "Failed to create quote")
		return
	}

	sdk.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"quote_id":     quoteID,
		"quote_number": quoteNumber,
		"created_at":   createdAt,
		"updated_at":   updatedAt,
		"message":      "Sales quote created successfully",
	})
}

// ConvertQuoteToOrder converts a quote to a sales order
func (h *SalesHandler) ConvertQuoteToOrder(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	quoteID, err := strconv.Atoi(idStr)
	if err != nil {
		sdk.WriteError(w, http.StatusBadRequest, "Invalid quote ID")
		return
	}

	// Get quote details
	quoteQuery := `
		SELECT customer_id, quote_date, subtotal, tax_amount, discount_amount, total_amount,
		       currency, notes, terms, sales_rep_id, created_by
		FROM sales_quotes
		WHERE id = $1 AND status = 'draft'
	`

	var customerID, createdBy int
	var quoteDate time.Time
	var subtotal, taxAmount, discountAmount, totalAmount float64
	var currency, notes, terms string
	var salesRepID sql.NullInt64

	err = h.db.QueryRow(quoteQuery, quoteID).Scan(
		&customerID, &quoteDate, &subtotal, &taxAmount, &discountAmount, &totalAmount,
		&currency, &notes, &terms, &salesRepID, &createdBy,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			sdk.WriteError(w, http.StatusNotFound, "Quote not found or not in draft status")
			return
		}
		// Error:"Failed to fetch quote", zap.Error(err))
		sdk.WriteError(w, http.StatusInternalServerError, "Failed to fetch quote")
		return
	}

	// Generate order number
	orderNumber := fmt.Sprintf("SO-%d", time.Now().Unix())

	// Start transaction
	tx, err := h.db.Beginx()
	if err != nil {
		// Error:"Failed to begin transaction", zap.Error(err))
		sdk.WriteError(w, http.StatusInternalServerError, "Failed to convert quote")
		return
	}
	defer tx.Rollback()

	// Create sales order
	orderQuery := `
		INSERT INTO sales_orders (order_number, customer_id, quote_id, order_date,
		                          subtotal, tax_amount, discount_amount, shipping_amount, total_amount,
		                          currency, notes, sales_rep_id, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id, created_at, updated_at
	`

	var orderID int
	var createdAt, updatedAt time.Time

	var salesRepIDVal *int
	if salesRepID.Valid {
		srID := int(salesRepID.Int64)
		salesRepIDVal = &srID
	}

	err = tx.QueryRow(orderQuery, orderNumber, customerID, quoteID, quoteDate,
		subtotal, taxAmount, discountAmount, 0, totalAmount, currency, notes,
		salesRepIDVal, createdBy).Scan(&orderID, &createdAt, &updatedAt)

	if err != nil {
		// Error:"Failed to create sales order", zap.Error(err))
		sdk.WriteError(w, http.StatusInternalServerError, "Failed to create sales order")
		return
	}

	// Copy quote items to order items
	copyItemsQuery := `
		INSERT INTO sales_order_items (order_id, product_id, quantity, unit_price,
		                               discount_percent, discount_amount, notes)
		SELECT $1, product_id, quantity, unit_price, discount_percent, discount_amount, notes
		FROM sales_quote_items
		WHERE quote_id = $2
	`

	_, err = tx.Exec(copyItemsQuery, orderID, quoteID)
	if err != nil {
		// Error:"Failed to copy quote items", zap.Error(err))
		sdk.WriteError(w, http.StatusInternalServerError, "Failed to copy quote items")
		return
	}

	// Update quote status
	_, err = tx.Exec("UPDATE sales_quotes SET status = 'accepted' WHERE id = $1", quoteID)
	if err != nil {
		// Error:"Failed to update quote status", zap.Error(err))
		sdk.WriteError(w, http.StatusInternalServerError, "Failed to update quote status")
		return
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		// Error:"Failed to commit transaction", zap.Error(err))
		sdk.WriteError(w, http.StatusInternalServerError, "Failed to convert quote")
		return
	}

	sdk.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"order_id":     orderID,
		"order_number": orderNumber,
		"created_at":   createdAt,
		"updated_at":   updatedAt,
		"message":      "Quote converted to order successfully",
	})
}

// Sales Report Handlers

// GetSalesReport generates a sales report
func (h *SalesHandler) GetSalesReport(w http.ResponseWriter, r *http.Request) {
	startDate := r.URL.Query().Get("start_date")
	endDate := r.URL.Query().Get("end_date")

	if startDate == "" || endDate == "" {
		sdk.WriteError(w, http.StatusBadRequest, "Start date and end date are required")
		return
	}

	query := `
		SELECT 
			COUNT(*) as total_orders,
			SUM(total_amount) as total_sales,
			AVG(total_amount) as average_order_value,
			COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
			SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as completed_sales
		FROM sales_orders
		WHERE order_date BETWEEN $1 AND $2
	`

	var report struct {
		TotalOrders       int     `json:"total_orders"`
		TotalSales        float64 `json:"total_sales"`
		AverageOrderValue float64 `json:"average_order_value"`
		CompletedOrders   int     `json:"completed_orders"`
		CompletedSales    float64 `json:"completed_sales"`
	}

	err := h.db.QueryRow(query, startDate, endDate).Scan(
		&report.TotalOrders, &report.TotalSales, &report.AverageOrderValue,
		&report.CompletedOrders, &report.CompletedSales,
	)

	if err != nil {
		// Error:"Failed to generate sales report", zap.Error(err))
		sdk.WriteError(w, http.StatusInternalServerError, "Failed to generate sales report")
		return
	}

	sdk.WriteJSON(w, http.StatusOK, report)
}

// Advanced Sales Features

// GetSalesPipeline retrieves sales pipeline data
func (h *SalesHandler) GetSalesPipeline(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT 
			so.status,
			COUNT(*) as count,
			SUM(so.total_amount) as total_value,
			AVG(so.total_amount) as average_value
		FROM sales_orders so
		WHERE so.order_date >= CURRENT_DATE - INTERVAL '30 days'
		GROUP BY so.status
		ORDER BY 
			CASE so.status
				WHEN 'pending' THEN 1
				WHEN 'confirmed' THEN 2
				WHEN 'shipped' THEN 3
				WHEN 'delivered' THEN 4
				WHEN 'cancelled' THEN 5
				ELSE 6
			END
	`

	rows, err := h.db.Query(query)
	if err != nil {
		// Error:"Failed to fetch sales pipeline", zap.Error(err))
		sdk.WriteError(w, http.StatusInternalServerError, "Failed to fetch sales pipeline")
		return
	}
	defer rows.Close()

	var pipeline []PipelineStage
	for rows.Next() {
		var stage PipelineStage
		err := rows.Scan(&stage.Status, &stage.Count, &stage.TotalValue, &stage.AverageValue)
		if err != nil {
			continue
		}
		pipeline = append(pipeline, stage)
	}

	sdk.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"pipeline": pipeline,
		"period":   "30_days",
	})
}

// GetSalesForecast generates sales forecast based on historical data
func (h *SalesHandler) GetSalesForecast(w http.ResponseWriter, r *http.Request) {
	period := r.URL.Query().Get("period") // monthly, quarterly, yearly
	if period == "" {
		period = "monthly"
	}

	var forecastQuery string
	var groupBy string

	switch period {
	case "monthly":
		forecastQuery = `
			SELECT 
				DATE_TRUNC('month', order_date) as period,
				SUM(total_amount) as actual_sales,
				COUNT(*) as order_count,
				AVG(total_amount) as average_order_value
			FROM sales_orders
			WHERE order_date >= CURRENT_DATE - INTERVAL '12 months'
			  AND status IN ('delivered', 'shipped')
			GROUP BY DATE_TRUNC('month', order_date)
			ORDER BY period
		`
		groupBy = "month"
	case "quarterly":
		forecastQuery = `
			SELECT 
				DATE_TRUNC('quarter', order_date) as period,
				SUM(total_amount) as actual_sales,
				COUNT(*) as order_count,
				AVG(total_amount) as average_order_value
			FROM sales_orders
			WHERE order_date >= CURRENT_DATE - INTERVAL '4 quarters'
			  AND status IN ('delivered', 'shipped')
			GROUP BY DATE_TRUNC('quarter', order_date)
			ORDER BY period
		`
		groupBy = "quarter"
	case "yearly":
		forecastQuery = `
			SELECT 
				DATE_TRUNC('year', order_date) as period,
				SUM(total_amount) as actual_sales,
				COUNT(*) as order_count,
				AVG(total_amount) as average_order_value
			FROM sales_orders
			WHERE order_date >= CURRENT_DATE - INTERVAL '3 years'
			  AND status IN ('delivered', 'shipped')
			GROUP BY DATE_TRUNC('year', order_date)
			ORDER BY period
		`
		groupBy = "year"
	}

	rows, err := h.db.Query(forecastQuery)
	if err != nil {
		// Error:"Failed to fetch sales forecast", zap.Error(err))
		sdk.WriteError(w, http.StatusInternalServerError, "Failed to fetch sales forecast")
		return
	}
	defer rows.Close()

	var historicalData []SalesDataPoint
	for rows.Next() {
		var dataPoint SalesDataPoint
		err := rows.Scan(&dataPoint.Period, &dataPoint.ActualSales, &dataPoint.OrderCount, &dataPoint.AverageOrderValue)
		if err != nil {
			continue
		}
		historicalData = append(historicalData, dataPoint)
	}

	// Simple linear regression for forecasting
	forecast := h.calculateSalesForecast(historicalData, groupBy)

	sdk.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"historical_data": historicalData,
		"forecast":        forecast,
		"period":          period,
		"generated_at":    time.Now(),
	})
}

// GetTopCustomers retrieves top customers by sales
func (h *SalesHandler) GetTopCustomers(w http.ResponseWriter, r *http.Request) {
	limit := r.URL.Query().Get("limit")
	period := r.URL.Query().Get("period") // 30_days, 90_days, 1_year, all_time

	if limit == "" {
		limit = "10"
	}

	if period == "" {
		period = "1_year"
	}

	var periodCondition string
	switch period {
	case "30_days":
		periodCondition = "AND so.order_date >= CURRENT_DATE - INTERVAL '30 days'"
	case "90_days":
		periodCondition = "AND so.order_date >= CURRENT_DATE - INTERVAL '90 days'"
	case "1_year":
		periodCondition = "AND so.order_date >= CURRENT_DATE - INTERVAL '1 year'"
	default:
		periodCondition = ""
	}

	query := fmt.Sprintf(`
		SELECT 
			c.id, c.customer_number, c.company_name, c.first_name, c.last_name, c.email,
			COUNT(DISTINCT so.id) as total_orders,
			SUM(so.total_amount) as total_spent,
			AVG(so.total_amount) as average_order_value,
			MAX(so.order_date) as last_order_date,
			MIN(so.order_date) as first_order_date
		FROM customers c
		JOIN sales_orders so ON c.id = so.customer_id
		WHERE so.status IN ('delivered', 'shipped') %s
		GROUP BY c.id, c.customer_number, c.company_name, c.first_name, c.last_name, c.email
		ORDER BY total_spent DESC
		LIMIT $1
	`, periodCondition)

	rows, err := h.db.Query(query, limit)
	if err != nil {
		// Error:"Failed to fetch top customers", zap.Error(err))
		sdk.WriteError(w, http.StatusInternalServerError, "Failed to fetch top customers")
		return
	}
	defer rows.Close()

	var customers []TopCustomer
	for rows.Next() {
		var customer TopCustomer
		err := rows.Scan(
			&customer.ID, &customer.CustomerNumber, &customer.CompanyName,
			&customer.FirstName, &customer.LastName, &customer.Email,
			&customer.TotalOrders, &customer.TotalSpent, &customer.AverageOrderValue,
			&customer.LastOrderDate, &customer.FirstOrderDate,
		)
		if err != nil {
			continue
		}
		customers = append(customers, customer)
	}

	sdk.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"customers": customers,
		"period":    period,
		"count":     len(customers),
	})
}

// GetSalesPerformance retrieves sales performance metrics
func (h *SalesHandler) GetSalesPerformance(w http.ResponseWriter, r *http.Request) {
	startDate := r.URL.Query().Get("start_date")
	endDate := r.URL.Query().Get("end_date")
	salesRepID := r.URL.Query().Get("sales_rep_id")

	if startDate == "" || endDate == "" {
		sdk.WriteError(w, http.StatusBadRequest, "Start date and end date are required")
		return
	}

	query := `
		SELECT 
			sr.id as rep_id,
			sr.first_name || ' ' || sr.last_name as rep_name,
			COUNT(DISTINCT so.id) as total_orders,
			SUM(so.total_amount) as total_sales,
			AVG(so.total_amount) as average_order_value,
			COUNT(DISTINCT so.customer_id) as unique_customers,
			SUM(CASE WHEN so.status = 'delivered' THEN so.total_amount ELSE 0 END) as closed_sales,
			SUM(CASE WHEN so.status = 'cancelled' THEN so.total_amount ELSE 0 END) as lost_sales
		FROM sales_representatives sr
		LEFT JOIN sales_orders so ON sr.id = so.sales_rep_id
			AND so.order_date BETWEEN $1 AND $2
		WHERE sr.is_active = true
	`

	args := []interface{}{startDate, endDate}
	argIndex := 3

	if salesRepID != "" {
		query += fmt.Sprintf(" AND sr.id = $%d", argIndex)
		args = append(args, salesRepID)
		argIndex++
	}

	query += " GROUP BY sr.id, sr.first_name, sr.last_name ORDER BY total_sales DESC"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		// Error:"Failed to fetch sales performance", zap.Error(err))
		sdk.WriteError(w, http.StatusInternalServerError, "Failed to fetch sales performance")
		return
	}
	defer rows.Close()

	var performance []SalesPerformance
	for rows.Next() {
		var perf SalesPerformance
		err := rows.Scan(
			&perf.RepID, &perf.RepName, &perf.TotalOrders, &perf.TotalSales,
			&perf.AverageOrderValue, &perf.UniqueCustomers, &perf.ClosedSales, &perf.LostSales,
		)
		if err != nil {
			continue
		}

		// Calculate conversion rate
		if perf.TotalSales > 0 {
			perf.ConversionRate = (perf.ClosedSales / perf.TotalSales) * 100
		}

		performance = append(performance, perf)
	}

	sdk.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"performance": performance,
		"period":      fmt.Sprintf("%s to %s", startDate, endDate),
		"count":       len(performance),
	})
}

// GetProductSalesAnalysis retrieves product sales analysis
func (h *SalesHandler) GetProductSalesAnalysis(w http.ResponseWriter, r *http.Request) {
	startDate := r.URL.Query().Get("start_date")
	endDate := r.URL.Query().Get("end_date")
	limit := r.URL.Query().Get("limit")

	if limit == "" {
		limit = "20"
	}

	if startDate == "" || endDate == "" {
		sdk.WriteError(w, http.StatusBadRequest, "Start date and end date are required")
		return
	}

	query := `
		SELECT 
			p.id, p.name, p.sku, p.cost_price, p.selling_price,
			SUM(soi.quantity) as total_quantity_sold,
			SUM(soi.line_total) as total_revenue,
			COUNT(DISTINCT so.id) as order_count,
			AVG(soi.quantity) as average_quantity_per_order,
			AVG(soi.unit_price) as average_selling_price,
			SUM(soi.line_total - (soi.quantity * p.cost_price)) as total_profit
		FROM products p
		JOIN sales_order_items soi ON p.id = soi.product_id
		JOIN sales_orders so ON soi.order_id = so.id
		WHERE so.order_date BETWEEN $1 AND $2
		  AND so.status IN ('delivered', 'shipped')
		  AND p.is_active = true
		GROUP BY p.id, p.name, p.sku, p.cost_price, p.selling_price
		ORDER BY total_revenue DESC
		LIMIT $3
	`

	rows, err := h.db.Query(query, startDate, endDate, limit)
	if err != nil {
		// Error:"Failed to fetch product sales analysis", zap.Error(err))
		sdk.WriteError(w, http.StatusInternalServerError, "Failed to fetch product sales analysis")
		return
	}
	defer rows.Close()

	var analysis []ProductSalesAnalysis
	for rows.Next() {
		var item ProductSalesAnalysis
		err := rows.Scan(
			&item.ProductID, &item.ProductName, &item.SKU, &item.CostPrice, &item.SellingPrice,
			&item.TotalQuantitySold, &item.TotalRevenue, &item.OrderCount,
			&item.AverageQuantityPerOrder, &item.AverageSellingPrice, &item.TotalProfit,
		)
		if err != nil {
			continue
		}

		// Calculate profit margin
		if item.TotalRevenue > 0 {
			item.ProfitMargin = (item.TotalProfit / item.TotalRevenue) * 100
		}

		analysis = append(analysis, item)
	}

	sdk.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"analysis": analysis,
		"period":   fmt.Sprintf("%s to %s", startDate, endDate),
		"count":    len(analysis),
	})
}

// Additional types for enhanced features

type SalesOrderWithDetails struct {
	ID              int                         `json:"id"`
	OrderNumber     string                      `json:"order_number"`
	CustomerID      int                         `json:"customer_id"`
	SalesRepID      *int                        `json:"sales_rep_id"`
	OrderDate       time.Time                   `json:"order_date"`
	RequiredDate    *time.Time                  `json:"required_date"`
	ShippedDate     *time.Time                  `json:"shipped_date"`
	Status          string                      `json:"status"`
	PaymentTerms    string                      `json:"payment_terms"`
	ShippingMethod  string                      `json:"shipping_method"`
	ShippingAddress map[string]interface{}      `json:"shipping_address"`
	BillingAddress  map[string]interface{}      `json:"billing_address"`
	Notes           string                      `json:"notes"`
	Subtotal        float64                     `json:"subtotal"`
	TaxAmount       float64                     `json:"tax_amount"`
	ShippingAmount  float64                     `json:"shipping_amount"`
	DiscountAmount  float64                     `json:"discount_amount"`
	TotalAmount     float64                     `json:"total_amount"`
	CreatedAt       time.Time                   `json:"created_at"`
	UpdatedAt       time.Time                   `json:"updated_at"`
	Customer        *CustomerInfo               `json:"customer"`
	SalesRep        *SalesRepInfo               `json:"sales_rep"`
	Items           []SalesOrderItemWithDetails `json:"items"`
}

type SalesOrderItemWithDetails struct {
	ID              int       `json:"id"`
	OrderID         int       `json:"order_id"`
	ProductID       int       `json:"product_id"`
	Quantity        int       `json:"quantity"`
	UnitPrice       float64   `json:"unit_price"`
	DiscountPercent float64   `json:"discount_percent"`
	LineTotal       float64   `json:"line_total"`
	Notes           string    `json:"notes"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	ProductName     string    `json:"product_name"`
	SKU             string    `json:"sku"`
}

type CustomerInfo struct {
	ID             int    `json:"id"`
	CustomerNumber string `json:"customer_number"`
	CompanyName    string `json:"company_name"`
	FirstName      string `json:"first_name"`
	LastName       string `json:"last_name"`
	Email          string `json:"email"`
}

type SalesRepInfo struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// Helper functions

func (h *SalesHandler) calculateSalesForecast(historicalData []SalesDataPoint, groupBy string) []ForecastDataPoint {
	if len(historicalData) < 2 {
		return []ForecastDataPoint{}
	}

	// Simple linear regression
	n := len(historicalData)
	var sumX, sumY, sumXY, sumXX float64

	for i, data := range historicalData {
		x := float64(i)
		y := data.ActualSales
		sumX += x
		sumY += y
		sumXY += x * y
		sumXX += x * x
	}

	// Calculate slope and intercept
	slope := (float64(n)*sumXY - sumX*sumY) / (float64(n)*sumXX - sumX*sumX)
	intercept := (sumY - slope*sumX) / float64(n)

	// Generate forecast for next 3 periods
	var forecast []ForecastDataPoint
	for i := 0; i < 3; i++ {
		x := float64(n + i)
		predicted := slope*x + intercept

		forecast = append(forecast, ForecastDataPoint{
			Period:    fmt.Sprintf("Forecast %d", i+1),
			Predicted: predicted,
		})
	}

	return forecast
}

// Additional types for enhanced features

type PipelineStage struct {
	Status       string  `json:"status"`
	Count        int     `json:"count"`
	TotalValue   float64 `json:"total_value"`
	AverageValue float64 `json:"average_value"`
}

type SalesDataPoint struct {
	Period            time.Time `json:"period"`
	ActualSales       float64   `json:"actual_sales"`
	OrderCount        int       `json:"order_count"`
	AverageOrderValue float64   `json:"average_order_value"`
}

type ForecastDataPoint struct {
	Period    string  `json:"period"`
	Predicted float64 `json:"predicted"`
}

type TopCustomer struct {
	ID                int        `json:"id"`
	CustomerNumber    string     `json:"customer_number"`
	CompanyName       *string    `json:"company_name"`
	FirstName         *string    `json:"first_name"`
	LastName          *string    `json:"last_name"`
	Email             *string    `json:"email"`
	TotalOrders       int        `json:"total_orders"`
	TotalSpent        float64    `json:"total_spent"`
	AverageOrderValue float64    `json:"average_order_value"`
	LastOrderDate     *time.Time `json:"last_order_date"`
	FirstOrderDate    *time.Time `json:"first_order_date"`
}

type SalesPerformance struct {
	RepID             int     `json:"rep_id"`
	RepName           string  `json:"rep_name"`
	TotalOrders       int     `json:"total_orders"`
	TotalSales        float64 `json:"total_sales"`
	AverageOrderValue float64 `json:"average_order_value"`
	UniqueCustomers   int     `json:"unique_customers"`
	ClosedSales       float64 `json:"closed_sales"`
	LostSales         float64 `json:"lost_sales"`
	ConversionRate    float64 `json:"conversion_rate"`
}

type ProductSalesAnalysis struct {
	ProductID               int     `json:"product_id"`
	ProductName             string  `json:"product_name"`
	SKU                     string  `json:"sku"`
	CostPrice               float64 `json:"cost_price"`
	SellingPrice            float64 `json:"selling_price"`
	TotalQuantitySold       int     `json:"total_quantity_sold"`
	TotalRevenue            float64 `json:"total_revenue"`
	OrderCount              int     `json:"order_count"`
	AverageQuantityPerOrder float64 `json:"average_quantity_per_order"`
	AverageSellingPrice     float64 `json:"average_selling_price"`
	TotalProfit             float64 `json:"total_profit"`
	ProfitMargin            float64 `json:"profit_margin"`
}

// Helper functions for JSON responses

// Using SDK response functions
// sdk.WriteJSON is now sdk.WriteJSON
// sdk.WriteError is now sdk.WriteError
