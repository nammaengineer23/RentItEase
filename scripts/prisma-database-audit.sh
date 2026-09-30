#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATIONS_DIR="$ROOT/backend/prisma/migrations"
SCHEMA="$ROOT/backend/prisma/schema.prisma"

fail=0
mapfile -t migrations < <(find "$MIGRATIONS_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort)

if [[ ${#migrations[@]} -eq 0 ]]; then
  echo "ERROR: no Prisma migrations found"
  exit 1
fi

prev=""
for migration in "${migrations[@]}"; do
  if [[ ! "$migration" =~ ^[0-9]{14}_[a-z0-9_]+$ ]]; then
    echo "ERROR: invalid migration directory name: $migration"
    fail=1
  fi
  if [[ -n "$prev" && ( "$migration" == "$prev" || "$migration" < "$prev" ) ]]; then
    echo "ERROR: migration ordering is not strictly increasing: $prev -> $migration"
    fail=1
  fi
  if [[ ! -f "$MIGRATIONS_DIR/$migration/migration.sql" ]]; then
    echo "ERROR: missing migration.sql: $migration"
    fail=1
  fi
  prev="$migration"
done

declare -A destructive_allowlist=(
  ["20260929210000_harden_refresh_token_rotation"]="DELETE FROM \"RefreshToken\""
  ["20260929223000_harden_auth_otp_challenges"]="DELETE FROM \"AuthOtpChallenge\""
)

while IFS= read -r sql_file; do
  migration="$(basename "$(dirname "$sql_file")")"
  while IFS= read -r statement; do
    [[ -z "$statement" ]] && continue
    if [[ "$statement" =~ (DROP[[:space:]]+(TABLE|COLUMN|SCHEMA)|TRUNCATE[[:space:]]|DELETE[[:space:]]+FROM) ]]; then
      allowed="${destructive_allowlist[$migration]:-}"
      if [[ -z "$allowed" || "$statement" != *"$allowed"* ]]; then
        echo "ERROR: unapproved destructive SQL in $migration: $statement"
        fail=1
      else
        echo "INFO: reviewed destructive data migration in $migration: $statement"
      fi
    fi
  done < <(tr -d '\r\n' < "$sql_file" | sed 's/;/;\n/g')
done < <(find "$MIGRATIONS_DIR" -name migration.sql -type f | sort)

required_patterns=(
  'bookingId[[:space:]]+String[[:space:]]+@unique'
  'razorpayOrderId[[:space:]]+String[[:space:]]+@unique'
  'razorpayPaymentId[[:space:]]+String\?[[:space:]]+@unique'
  '@@unique\(\[userId, propertyId\]\)'
  'token[[:space:]]+String[[:space:]]+@unique'
  'jti[[:space:]]+String[[:space:]]+@unique'
  '@@unique\(\[target, purpose\]\)'
  'paymentId[[:space:]]+String\?[[:space:]]+@unique'
  'activePropertyKey[[:space:]]+String\?[[:space:]]+@unique'
  'paymentOrderCreationKey[[:space:]]+String\?[[:space:]]+@unique'
  'orderCreationToken[[:space:]]+String\?[[:space:]]+@unique'
)

for pattern in "${required_patterns[@]}"; do
  if ! grep -Eq "$pattern" "$SCHEMA"; then
    echo "ERROR: required schema invariant missing: $pattern"
    fail=1
  fi
done

if (( fail != 0 )); then
  echo "Prisma/database audit FAILED"
  exit 1
fi

echo "Prisma/database audit PASSED"
echo "Migration count: ${#migrations[@]}"
echo "First migration: ${migrations[0]}"
echo "Last migration: ${migrations[${#migrations[@]}-1]}"
