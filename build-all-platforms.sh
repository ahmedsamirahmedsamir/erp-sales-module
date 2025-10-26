#!/bin/bash

# Build the sales module plugin for all supported platforms
# This creates platform-specific binaries for deployment

set -e

MODULE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$MODULE_DIR/build"
HANDLERS_DIR="$MODULE_DIR/handlers"

echo "Building sales module plugin for all platforms..."
echo "Build directory: $BUILD_DIR"

# Create build directory
mkdir -p "$BUILD_DIR"

# Detect current Go version
GO_VERSION=$(go version | awk '{print $3}')
echo "Building with Go version: $GO_VERSION"

# Build for current platform
./build-plugin.sh

# Copy to build directory with platform suffix
CURRENT_OS=$(uname -s | tr '[:upper:]' '[:lower:]')
case "$CURRENT_OS" in
    linux)
        cp "$MODULE_DIR/sales.so" "$BUILD_DIR/sales-linux.so"
        ;;
    darwin)
        cp "$MODULE_DIR/sales.dylib" "$BUILD_DIR/sales-darwin.dylib"
        ;;
    windows)
        cp "$MODULE_DIR/sales.dll" "$BUILD_DIR/sales-windows.dll"
        ;;
esac

echo ""
echo "✓ Build complete!"
echo ""
echo "Plugins built:"
ls -lh "$BUILD_DIR"/

echo ""
echo "To build for other platforms, use cross-compilation:"
echo "  GOOS=linux GOARCH=amd64 go build -buildmode=plugin -o build/sales-linux.so handlers/*.go"
echo "  GOOS=darwin GOARCH=amd64 go build -buildmode=plugin -o build/sales-darwin.dylib handlers/*.go"
echo "  GOOS=windows GOARCH=amd64 go build -buildmode=plugin -o build/sales-windows.dll handlers/*.go"

