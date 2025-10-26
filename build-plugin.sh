#!/bin/bash

# Build the sales module as a Go plugin (platform-specific)
# This allows the module to be loaded dynamically at runtime

set -e

MODULE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$MODULE_DIR"

# Detect platform
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$OS" in
    linux)
        PLUGIN_NAME="sales.so"
        ;;
    darwin)
        PLUGIN_NAME="sales.dylib"
        ;;
    windows)
        PLUGIN_NAME="sales.dll"
        ;;
    *)
        echo "Unknown OS: $OS"
        exit 1
        ;;
esac

echo "Building sales module plugin for $OS/$ARCH..."
echo "Output: $PLUGIN_NAME"

# Get Go version
GO_VERSION=$(go version | awk '{print $3}')
echo "Go version: $GO_VERSION"

# Build the plugin
cd "$MODULE_DIR/handlers"
go build -buildmode=plugin -ldflags "-X main.Platform=$OS -X main.Arch=$ARCH -X main.GoVersion=$GO_VERSION" -o "$OUTPUT_DIR/$PLUGIN_NAME" plugin.go sales_handler.go sales_handler_wrapper.go

if [ $? -eq 0 ]; then
    echo "✓ Plugin built successfully: $OUTPUT_DIR/$PLUGIN_NAME"
    ls -lh "$OUTPUT_DIR/$PLUGIN_NAME"
    
    # Display file info
    file "$OUTPUT_DIR/$PLUGIN_NAME"
else
    echo "✗ Failed to build plugin"
    exit 1
fi

