# Sales Module Plugin Development

This document explains how to build and deploy the sales module as a dynamically loadable Go plugin.

## Overview

The sales module can be compiled as a Go plugin (`.so` file) that can be loaded dynamically at runtime without recompiling the main ERP backend. This enables:

- Hot reloading of modules without restarting the main server
- Independent module deployment
- Version management for modules
- Module isolation

## Building the Plugin

### Prerequisites

- Go 1.12+ (required for plugin support)
- Go dependencies installed in the handlers directory

### Build Steps

1. **Install dependencies** (if not already done):
```bash
cd erp-sales-module/handlers
go mod init sales-plugin  # Create go.mod if needed
go get github.com/go-chi/chi/v5
go get github.com/jmoiron/sqlx
go get go.uber.org/zap
```

2. **Build the plugin**:
```bash
./build-plugin.sh
```

Or manually:
```bash
cd erp-sales-module/handlers
go build -buildmode=plugin -o ../sales.so plugin.go sales_handler.go sales_handler_wrapper.go
```

This creates `sales.so` in the module root directory.

## How It Works

### Plugin Interface

The plugin implements the `PluginHandler` interface from `erp-backend/internal/modules`:

```go
type PluginHandler interface {
    GetHandler(route string, method string) (http.HandlerFunc, error)
    GetModuleCode() string
    GetModuleVersion() string
    Initialize(db *sqlx.DB, logger *zap.Logger) error
    Cleanup() error
}
```

### Export Symbol

The plugin exports a `Handler` symbol that returns a factory function:

```go
var Handler = func() interface{} {
    return NewSalesPluginHandler()
}
```

### Loading Process

1. The ERP backend scans for `.so` files in module directories
2. When found, it loads the plugin using Go's `plugin` package
3. It looks up the `Handler` symbol
4. It calls the factory function to create a handler instance
5. It initializes the handler with database and logger
6. It registers routes using the handler's `GetHandler` method

## Plugin Rules and Compliance

⚠️ **Critical Requirements**: All modules MUST follow these rules:

### 1. Platform-Specific Extensions
- **Linux**: `.so` files
- **macOS**: `.dylib` files  
- **Windows**: `.dll` files

The build script automatically detects the platform and creates the correct file.

### 2. Go Version Matching
Plugins **MUST** be built with the same Go version as the main ERP backend:
```bash
# Check backend Go version
cd erp/backend && go version

# Build plugin with matching version
cd erp-sales-module && ./build-plugin.sh
```

### 3. Shared Dependencies
Common dependencies must match versions:
- `github.com/go-chi/chi/v5`
- `github.com/jmoiron/sqlx`
- `go.uber.org/zap`

### 4. Plugin Cannot Be Unloaded
Once loaded, plugins remain in memory for the lifetime of the application (Go limitation).

### 5. CGO Restrictions
Plugins using CGO may have compatibility issues.

## Checking Compliance

Run the compliance checker before deploying:
```bash
./check-compliance.sh
```

This validates:
- Platform-specific plugin file exists
- Go version compatibility
- Handler symbol exports
- Dependency versions
- Metadata exports

## Alternative Approaches

If plugins don't work well for your use case, consider:

1. **Microservices**: Deploy modules as separate HTTP services
2. **WebAssembly**: Compile modules to WASM for portable dynamic loading
3. **Scripting**: Use Lua, Python, or JavaScript for dynamic functionality
4. **Conditional compilation**: Use build tags for static module inclusion

## Troubleshooting

### "plugin: not a Go plugin"

- Ensure the plugin was built with `-buildmode=plugin`
- Check that the build succeeded without errors
- Verify you're loading the correct file

### "plugin was built with a different version of package X"

- Rebuild both the plugin and main application with the same Go version
- Ensure dependency versions match

### "no such file or directory"

- Check that the `.so` file exists in the expected location
- Verify file permissions

## Testing

After building the plugin, restart the ERP backend:

```bash
cd erp/backend
go run cmd/api/main.go
```

The backend should detect and load the plugin automatically. Check the logs for:
```
Successfully loaded plugin for module (module=sales)
```

## Deployment

1. Build the plugin in your CI/CD pipeline
2. Copy the `.so` file to the server alongside the module's `module.yml`
3. Restart the ERP backend
4. The plugin will be loaded automatically

