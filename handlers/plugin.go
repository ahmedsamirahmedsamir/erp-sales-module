package main

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/jmoiron/sqlx"
	sdk "github.com/linearbits/erp-backend/pkg/module-sdk"
	"go.uber.org/zap"
)

// SalesPlugin implements the ModulePlugin interface
type SalesPlugin struct {
	db      *sqlx.DB
	logger  *zap.Logger
	handler *SalesHandler
}

// NewSalesPlugin creates a new plugin instance
func NewSalesPlugin() sdk.ModulePlugin {
	return &SalesPlugin{}
}

// Initialize initializes the plugin
func (p *SalesPlugin) Initialize(db *sqlx.DB, logger *zap.Logger) error {
	p.db = db
	p.logger = logger
	p.handler = NewSalesHandler(db, logger)
	p.logger.Info("Sales module initialized")
	return nil
}

// GetModuleCode returns the module code
func (p *SalesPlugin) GetModuleCode() string {
	return "sales"
}

// GetModuleVersion returns the module version
func (p *SalesPlugin) GetModuleVersion() string {
	return "1.0.0"
}

// Cleanup performs cleanup
func (p *SalesPlugin) Cleanup() error {
	p.logger.Info("Cleaning up sales module")
	return nil
}

// GetHandler returns a handler function for a given route and method
func (p *SalesPlugin) GetHandler(route string, method string) (http.HandlerFunc, error) {
	route = strings.TrimPrefix(route, "/")
	method = strings.ToUpper(method)

	handlers := map[string]http.HandlerFunc{
		"GET /orders":               p.handler.GetSalesOrders,
		"POST /orders":              p.handler.CreateSalesOrder,
		"GET /orders/{id}":          p.handler.GetSalesOrder,
		"PUT /orders/{id}":          p.handler.UpdateSalesOrder,
		"GET /quotes":               p.handler.GetSalesQuotes,
		"POST /quotes":              p.handler.CreateSalesQuote,
		"POST /quotes/{id}/convert": p.handler.ConvertQuoteToOrder,
		"GET /reports/sales":        p.handler.GetSalesReport,
		"GET /pipeline":             p.handler.GetSalesPipeline,
	}

	key := method + " " + route
	if handler, ok := handlers[key]; ok {
		return handler, nil
	}

	// Try pattern matching
	for pattern, handler := range handlers {
		if matchRoute(pattern, key) {
			return handler, nil
		}
	}

	return nil, fmt.Errorf("handler not found for route: %s %s", method, route)
}

func matchRoute(pattern, actual string) bool {
	pp := strings.Split(pattern, " ")
	ap := strings.Split(actual, " ")

	if len(pp) != 2 || len(ap) != 2 || pp[0] != ap[0] {
		return false
	}

	pPath := strings.Split(pp[1], "/")
	aPath := strings.Split(ap[1], "/")

	if len(pPath) != len(aPath) {
		return false
	}

	for i := range pPath {
		if pPath[i] != aPath[i] && !(strings.HasPrefix(pPath[i], "{") && strings.HasSuffix(pPath[i], "}")) {
			return false
		}
	}

	return true
}

// Handler is the exported symbol
var Handler = NewSalesPlugin
