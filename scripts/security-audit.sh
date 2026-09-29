#!/usr/bin/env bash
set -euo pipefail

echo "=== RentItEase security/configuration audit ==="

fail=0

if grep -RniE 'RAZORPAY_KEY_SECRET\s*=\s*[^$<\{[:space:]]|JWT_(ACCESS|REFRESH)_SECRET\s*=\s*[^$<\{[:space:]]|FIREBASE_PRIVATE_KEY\s*=\s*[^$<\{[:space:]]' . \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build \
  --exclude='*.example' --exclude='*.sample' --exclude='package-lock.json' --exclude='*.dump' \
  --exclude='*.min.js' --exclude='*.spec.ts' --exclude='*_test.ts'; then
  echo "Potential hard-coded secret found."
  fail=1
fi

if grep -RniE '-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----' . \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build \
  --exclude='*.example' --exclude='*.sample' --exclude='*.dump' --exclude-dir=test; then
  echo "Potential private-key material found."
  fail=1
fi

if grep -RniE 'origin:\s*\*|enableCors\(\s*\{\s*origin:\s*\*' backend/src --exclude-dir=node_modules; then
  echo "Potential wildcard CORS configuration found."
  fail=1
fi

tracked_dumps="$(git ls-files | grep -E '(^|/)\.(env|env\..*)$|\.dump$|\.sql$|\.pem$|\.key$' || true)"
if [[ -n "$tracked_dumps" ]]; then
  echo "Tracked sensitive/backup files found:"
  printf '%s\n' "$tracked_dumps"
  fail=1
fi

echo "Production secrets must be supplied by Railway/GitHub Secrets, never committed."
echo "Configured CORS origins should be explicit production domains."
echo "Database backups must live in approved private backup storage, not Git."

if [[ "$fail" -ne 0 ]]; then
  exit 1
fi

echo "Security/configuration audit passed."
