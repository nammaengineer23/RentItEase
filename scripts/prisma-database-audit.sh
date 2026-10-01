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
  ["20260710095240_improve_refresh_token_model"]="reviewed schema replacement"
  ["20260710130312_add_phone_role"]="reviewed schema replacement"
  ["20260711173917_property_image_order"]="reviewed password-field replacement"
  ["20260723113507_remove_device_token_model"]="reviewed legacy table removal"
  ["20260725053152_add_email_otp"]="reviewed legacy OTP table replacement"
  ["20260830040000_harden_social_marketing_workflow"]="reviewed social workflow field removal"
  ["20260929210000_harden_refresh_token_rotation"]="reviewed refresh-token data invalidation"
  ["20260929223000_harden_auth_otp_challenges"]="reviewed duplicate OTP cleanup"
)

declare -A legacy_migration_names=(
  ["20260906_make_user_phone_optional"]=1
)
