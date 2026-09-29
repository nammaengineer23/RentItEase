#!/usr/bin/env bash
set -euo pipefail

echo "=== RentItEase security/configuration audit ==="

fail=0

secret_matches="$(git grep -nE 'RAZORPAY_KEY_SECRET[[:space:]]*=[[:space:]]*[^$<\{[:space:]]|JWT_(ACCESS|REFRESH)_SECRET[[:space:]]*=[[:space:]]*[^$<\{[:space:]]|FIREBASE_PRIVATE_KEY[[:space:]]*=[[:space:]]*[^$<\{[:space:]]' -- \
  ':!**/*.spec.ts' ':!**/test/**' ':!repomix-output.xml' ':!*.example' ':!*.sample' || true)"
if [[ -n "$secret_matches" ]]; then
  printf '%s\n' "$secret_matches"
  echo "Potential hard-coded production secret found."
  fail=1
fi

private_key_matches="$(git grep -nE -- '-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----' -- \
  ':!**/*.spec.ts' ':!**/test/**' ':!repomix-output.xml' ':!*.example' ':!*.sample' || true)"
if [[ -n "$private_key_matches" ]]; then
  printf '%s\n' "$private_key_matches"
  echo "Potential private-key material found."
  fail=1
fi

cors_matches="$(git grep -nE 'origin:[[:space:]]*\*|enableCors\([[:space:]]*\{[[:space:]]*origin:[[:space:]]*\*' -- backend/src || true)"
if [[ -n "$cors_matches" ]]; then
  printf '%s\n' "$cors_matches"
  echo "Potential wildcard CORS configuration found."
  fail=1
fi

tracked_sensitive="$(git ls-files | grep -E '(^|/)\.(env|env\..*)$|\.dump$|\.pem$|\.key
if [[ -n "$tracked_sensitive" ]]; then
  printf '%s\n' "$tracked_sensitive"
  echo "Tracked sensitive/backup files found."
  fail=1
fi

echo "Production secrets must be supplied by Railway/GitHub Secrets, never committed."
echo "Configured CORS origins should be explicit production domains."
echo "Database backups must live in approved private backup storage, not Git."

if [[ "$fail" -ne 0 ]]; then
  exit 1
fi

echo "Security/configuration audit passed."
 | grep -v '^backend/prisma/migrations/' || true)"
if [[ -n "$tracked_sensitive" ]]; then
  printf '%s\n' "$tracked_sensitive"
  echo "Tracked sensitive/backup files found."
  fail=1
fi

echo "Production secrets must be supplied by Railway/GitHub Secrets, never committed."
echo "Configured CORS origins should be explicit production domains."
echo "Database backups must live in approved private backup storage, not Git."

if [[ "$fail" -ne 0 ]]; then
  exit 1
fi

echo "Security/configuration audit passed."
