#!/usr/bin/env bash
set -euo pipefail

echo "=== RentItEase security/configuration audit ==="

fail=0

if grep -RniE 'RAZORPAY_KEY_SECRET\s*=\s*[^$<\{[:space:]]|JWT_(ACCESS|REFRESH)_SECRET\s*=\s*[^$<\{[:space:]]|FIREBASE_PRIVATE_KEY\s*=\s*[^$<\{[:space:]]' backend --exclude-dir=node_modules --exclude='*.example' --exclude='*.sample' --exclude-dir=dist; then
  echo "Potential hard-coded secret found."
  fail=1
fi

if grep -RniE 'origin:\s*\*|enableCors\(\s*\{\s*origin:\s*\*' backend/src --exclude-dir=node_modules; then
  echo "Potential wildcard CORS configuration found."
  fail=1
fi

echo "Production secrets must be supplied by Railway/GitHub Secrets, never committed."
echo "Configured CORS origins should be explicit production domains."

if [[ "$fail" -ne 0 ]]; then
  exit 1
fi

echo "Security/configuration audit passed."
