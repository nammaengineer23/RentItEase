#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-}"
if [[ -z "$ROOT" || ! -d "$ROOT" ]]; then
  echo "Usage: $0 <artifact-directory>"
  exit 1
fi

fail=0
for name in JWT_ACCESS_SECRET JWT_REFRESH_SECRET RAZORPAY_KEY_SECRET RAZORPAY_WEBHOOK_SECRET OPENAI_API_KEY FIREBASE_PRIVATE_KEY FIREBASE_CLIENT_EMAIL CLOUDFLARE_API_TOKEN ANDROID_KEY_PASSWORD ANDROID_STORE_PASSWORD ANDROID_KEYSTORE_BASE64 E2E_ADMIN_PASSWORD E2E_OWNER_PASSWORD E2E_TENANT_PASSWORD; do
  value="${!name:-}"
  if [[ -n "$value" ]] && grep -R -a -F -l -- "$value" "$ROOT" >/dev/null 2>&1; then
    echo "Artifact contains a protected secret value: $name"
    fail=1
  fi
done

if find "$ROOT" -type f \( -name '*.jks' -o -name 'key.properties' -o -name '.env' -o -name '.env.*' \) -print -quit | grep -q .; then
  echo "Artifact contains a signing key or environment file."
  fail=1
fi

if (( fail != 0 )); then exit 1; fi
echo "Artifact secret scan passed."
