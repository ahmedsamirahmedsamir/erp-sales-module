#!/bin/bash

# Check if sales module complies with plugin requirements

set -e

MODULE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ERRORS=0

echo "Checking sales module compliance..."
echo ""

# Check 1: Platform-specific plugin file exists
echo "✓ Checking for platform-specific plugin..."
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
case "$OS" in
    linux)
        PLUGIN_FILE="sales.so"
        ;;
    darwin)
        PLUGIN_FILE="sales.dylib"
        ;;
    windows)
        PLUGIN_FILE="sales.dll"
        ;;
esac

if [ -f "$MODULE_DIR/$PLUGIN_FILE" ]; then
    echo "  ✓ Plugin file exists: $PLUGIN_FILE"
    ls -lh "$MODULE_DIR/$PLUGIN_FILE"
else
    echo "  ✗ Plugin file not found: $PLUGIN_FILE"
    echo "    Run: ./build-plugin.sh"
    ERRORS=$((ERRORS + 1))
fi

# Check 2: Go version matches backend
echo ""
echo "✓ Checking Go version compatibility..."
BACKEND_GO_VERSION=$(cd ../erp/backend && go version | awk '{print $3}')
PLUGIN_INFO=$(file "$MODULE_DIR/$PLUGIN_FILE" 2>/dev/null || echo "")

if [ -n "$PLUGIN_INFO" ]; then
    echo "  ✓ Plugin file info:"
    echo "    $PLUGIN_INFO"
fi

echo "  Backend Go version: $BACKEND_GO_VERSION"
echo "  Plugin Go version:  $(go version | awk '{print $3}')"

# Check 3: Plugin exports Handler symbol
echo ""
echo "✓ Checking plugin exports..."
if [ -f "$MODULE_DIR/$PLUGIN_FILE" ]; then
    # Use go tool nm to check for exported symbols
    if command -v nm &> /dev/null; then
        SYMBOLS=$(nm -D "$MODULE_DIR/$PLUGIN_FILE" 2>/dev/null | grep -i handler || echo "")
        if [ -n "$SYMBOLS" ]; then
            echo "  ✓ Handler symbol found"
        else
            echo "  ✗ Handler symbol not found"
            ERRORS=$((ERRORS + 1))
        fi
    else
        echo "  ⚠ Cannot check symbols (nm not available)"
    fi
fi

# Check 4: Dependencies match
echo ""
echo "✓ Checking dependencies..."
if [ -f "$MODULE_DIR/handlers/go.mod" ]; then
    echo "  ✓ go.mod found"
    echo "  Dependencies:"
    grep "^\s" "$MODULE_DIR/handlers/go.mod" | head -5 || echo "    (none)"
else
    echo "  ⚠ No go.mod found in handlers directory"
fi

# Check 5: Plugin metadata
echo ""
echo "✓ Checking plugin metadata..."
if grep -q "var Metadata" "$MODULE_DIR/handlers/plugin.go"; then
    echo "  ✓ Metadata variable defined"
else
    echo "  ✗ Metadata variable not found"
    ERRORS=$((ERRORS + 1))
fi

# Summary
echo ""
echo "======================================"
if [ $ERRORS -eq 0 ]; then
    echo "✓ All compliance checks passed!"
    echo ""
    echo "Module is ready for deployment."
else
    echo "✗ Found $ERRORS compliance issue(s)"
    echo ""
    echo "Please fix the issues above before deploying."
fi
echo "======================================"

exit $ERRORS

