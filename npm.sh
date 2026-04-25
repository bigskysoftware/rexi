#!/bin/bash
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: ./npm.sh <version>"
  echo "Example: ./npm.sh 0.0.1"
  exit 1
fi

VERSION="$1"

echo "Releasing @bigskysoftware/rexi-js v${VERSION}..."

# Generate package.json
cat > package.json <<EOF
{
  "name": "@bigskysoftware/rexi-js",
  "version": "${VERSION}",
  "description": "rexi.js - A Fluent Little Fetch Wrapper for fixi.js",
  "main": "rexi.js",
  "files": [
    "rexi.js",
    "README.md"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/bigskysoftware/rexi.git"
  },
  "author": "1cg",
  "license": "BSD-0",
  "keywords": [
    "rexi",
    "fixi",
    "fetch",
    "http",
    "api",
    "wrapper"
  ],
  "bugs": {
    "url": "https://github.com/bigskysoftware/rexi/issues"
  }
}
EOF

echo "Generated package.json for v${VERSION}"

# Publish to npm
npm publish --access public

# Clean up
rm package.json

echo "Published @bigskysoftware/rexi-js@${VERSION} to npm"
