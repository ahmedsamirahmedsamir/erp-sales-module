package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"reflect"
	"strings"

	"github.com/jmoiron/sqlx"
	"go.uber.org/zap"
)

// SalesHandlerWrapper wraps the SalesHandler to implement the ModuleHandler interface
type SalesHandlerWrapper struct {
	db     *sqlx.DB
	logger *zap.Logger
	*SalesHandler
}

// NewSalesHandlerWrapper creates a new wrapper around SalesHandler
func NewSalesHandlerWrapper(db *sqlx.DB, logger *zap.Logger) *SalesHandlerWrapper {
	return &SalesHandlerWrapper{
		db:           db,
		logger:       logger,
		SalesHandler: NewSalesHandler(db),
	}
}

// ModuleHandler interface implementation

// GetHandler returns an HTTP handler function for a given route
func (w *SalesHandlerWrapper) GetHandler(route string, method string) (http.HandlerFunc, error) {
	// Map route patterns to handler methods
	route = strings.TrimPrefix(route, "/")
	parts := strings.Split(route, "/")

	var handlerName string

	// Handle special routes first
	if len(parts) >= 2 && parts[1] == "items" {
		// Route like /orders/{id}/items
		switch method {
		case "GET":
			handlerName = "GetSalesOrderItems"
		case "POST":
			handlerName = "CreateSalesOrderItem"
		case "PUT":
			handlerName = "UpdateSalesOrderItem"
		case "DELETE":
			handlerName = "DeleteSalesOrderItem"
		}
	} else if len(parts) >= 2 && parts[1] == "convert" {
		// Route like /quotes/{id}/convert
		handlerName = "ConvertQuoteToOrder"
	} else {
		// Standard CRUD routes
		resourceName := parts[0]

		switch method {
		case "GET":
			if strings.Contains(route, "{") {
				// Single resource GET
				handlerName = fmt.Sprintf("Get%s", capitalize(resourceName))
			} else {
				// List GET
				handlerName = fmt.Sprintf("Get%ss", capitalize(resourceName))
			}
		case "POST":
			handlerName = fmt.Sprintf("Create%s", capitalize(resourceName))
		case "PUT":
			handlerName = fmt.Sprintf("Update%s", capitalize(resourceName))
		case "DELETE":
			handlerName = fmt.Sprintf("Delete%s", capitalize(resourceName))
		}
	}

	// Use reflection to get the method
	v := reflect.ValueOf(w.SalesHandler)
	methodRef := v.MethodByName(handlerName)

	if !methodRef.IsValid() {
		return nil, fmt.Errorf("handler method %s not found", handlerName)
	}

	// Convert to http.HandlerFunc
	handler, ok := methodRef.Interface().(func(http.ResponseWriter, *http.Request))
	if !ok {
		return nil, fmt.Errorf("handler method %s does not match http.HandlerFunc signature", handlerName)
	}

	return handler, nil
}

// GetModuleCode returns the module code
func (w *SalesHandlerWrapper) GetModuleCode() string {
	return "sales"
}

// GetModuleVersion returns the module version
func (w *SalesHandlerWrapper) GetModuleVersion() string {
	return "1.0.0"
}

// Initialize initializes the module handler
func (w *SalesHandlerWrapper) Initialize() error {
	w.logger.Info("Initializing sales module handler")
	return nil
}

// Cleanup performs cleanup when module is unloaded
func (w *SalesHandlerWrapper) Cleanup() error {
	w.logger.Info("Cleaning up sales module handler")
	return nil
}

// Helper function to capitalize first letter
func capitalize(s string) string {
	if len(s) == 0 {
		return s
	}
	return strings.ToUpper(s[:1]) + s[1:]
}

// SalesOrderItemHandler placeholder methods

func (h *SalesHandler) GetSalesOrderItems(w http.ResponseWriter, r *http.Request) {
	orderID := r.URL.Query().Get("order_id")
	if orderID == "" {
		WriteErrorResponse(w, http.StatusBadRequest, "order_id is required")
		return
	}

	query := `
		SELECT soi.*, p.name as product_name, p.sku
		FROM sales_order_items soi
		JOIN products p ON soi.product_id = p.id
		WHERE soi.order_id = $1
		ORDER BY soi.id
	`

	rows, err := h.db.Query(query, orderID)
	if err != nil {
		WriteErrorResponse(w, http.StatusInternalServerError, "Failed to fetch order items")
		return
	}
	defer rows.Close()

	var items []SalesOrderItemWithDetails
	for rows.Next() {
		var item SalesOrderItemWithDetails
		err := rows.Scan(
			&item.ID, &item.OrderID, &item.ProductID, &item.Quantity,
			&item.UnitPrice, &item.DiscountPercent, &item.LineTotal,
			&item.Notes, &item.CreatedAt, &item.UpdatedAt,
			&item.ProductName, &item.SKU,
		)
		if err != nil {
			continue
		}
		items = append(items, item)
	}

	WriteJSONResponse(w, http.StatusOK, map[string]interface{}{
		"items": items,
		"count": len(items),
	})
}

func (h *SalesHandler) CreateSalesOrderItem(w http.ResponseWriter, r *http.Request) {
	var item SalesOrderItem
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		WriteErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	query := `
		INSERT INTO sales_order_items (order_id, product_id, quantity, unit_price, discount_percent, line_total, notes)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at, updated_at
	`

	var id int
	var createdAt, updatedAt sql.NullTime

	err := h.db.QueryRow(query, item.ProductID, item.Quantity, item.UnitPrice,
		item.DiscountPercent, item.LineTotal, item.Notes).Scan(&id, &createdAt, &updatedAt)

	if err != nil {
		WriteErrorResponse(w, http.StatusInternalServerError, "Failed to create order item")
		return
	}

	WriteJSONResponse(w, http.StatusCreated, map[string]interface{}{
		"id":         id,
		"created_at": createdAt,
		"updated_at": updatedAt,
		"message":    "Order item created successfully",
	})
}

func (h *SalesHandler) UpdateSalesOrderItem(w http.ResponseWriter, r *http.Request) {
	WriteErrorResponse(w, http.StatusNotImplemented, "Update order item not implemented")
}

func (h *SalesHandler) DeleteSalesOrderItem(w http.ResponseWriter, r *http.Request) {
	WriteErrorResponse(w, http.StatusNotImplemented, "Delete order item not implemented")
}

// Helper functions delegate to the main handler
func WriteJSONResponse(w http.ResponseWriter, status int, data interface{}) {
	writeJSONResponse(w, status, data)
}

func WriteErrorResponse(w http.ResponseWriter, status int, message string) {
	writeErrorResponse(w, status, message)
}
