#!/bin/bash

# Build script for cross-compiling the Deno binary for Raspberry Pi
# This compiles the application to a self-contained binary

echo "Building someone-comes-home binary..."

# Create bin directory if it doesn't exist
mkdir -p bin

# Compile for the current platform (development)
echo "Compiling for current platform..."
deno compile \
  --output ./bin/someone-comes-home \
  ./src/app.ts

echo "✅ Binary compiled successfully to ./bin/someone-comes-home"

# Make the binary executable
chmod +x ./bin/someone-comes-home

echo "🚀 Build complete! You can now run: ./bin/someone-comes-home"