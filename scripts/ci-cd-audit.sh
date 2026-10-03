#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fail=0
check() {
  local description="$1"; shift
  if "$@"; then echo "PASS: $description"; else echo "FAIL: $description"; fail=1; fi
}

check "Railway migration runs before production start" grep -q '"preDeployCommand"[[:space:]]*:[[:space:]]*"npx prisma migrate deploy"' "$repo_root/backend/railway.json"
check "Railway production health check is configured" grep -q '"healthcheckPath"[[:space:]]*:[[:space:]]*"\/api\/v1\/health"' "$repo_root/backend/railway.json"
check "Release E2E remains main-push gated" grep -q 'branches: \[main\]' "$repo_root/.github/workflows/e2e-test.yml"
check "Web deployment requires successful main release E2E" grep -q 'github.event.workflow_run.conclusion == .success.' "$repo_root/.github/workflows/deploy_web.yml"
check "Manual web deployment requires explicit confirmation" grep -q 'DEPLOY-RENTITEASE' "$repo_root/.github/workflows/deploy_web.yml"
check "Release workflow supplies explicit production confirmation" grep -q 'confirm_production_deploy' "$repo_root/.github/workflows/release.yml"
check "Flutter Fast Check remains automatic" grep -q 'pull_request:' "$repo_root/.github/workflows/flutter_ci.yml"
if grep -q '^  push:' "$repo_root/.github/workflows/flutter_android_build.yml"; then
  echo "FAIL: Standalone Android release workflow is manual/milestone only"
  fail=1
else
  echo "PASS: Standalone Android release workflow is manual/milestone only"
fi
check "Admin CI is path scoped" grep -q "'admin_panel/\*\*'" "$repo_root/.github/workflows/admin_ci.yml"
check "Automatic E2E cleanup is workflow-run triggered" grep -q 'workflow_run:' "$repo_root/.github/workflows/e2e-data-cleanup.yml"
check "Workflow-run cleanup has a schedule" grep -q 'schedule:' "$repo_root/.github/workflows/cleanup-workflow-runs.yml"
check "Rollback procedure is documented" test -f "$repo_root/backend/docs/production-deployment-and-rollback.md"

secret_log_file="$(mktemp)"
if grep -RniE '(^|[[:space:]])(echo|printf)[[:space:]].*\$(\{\{[[:space:]]*secrets\.|[A-Z_]*(SECRET|PASSWORD|TOKEN|PRIVATE_KEY))' "$repo_root/.github/workflows" >"$secret_log_file" 2>/dev/null; then
  echo "FAIL: workflow appears to print a secret-bearing value."
  cat "$secret_log_file"
  fail=1
else
  echo "PASS: workflow secret-bearing values are not intentionally printed."
fi
rm -f "$secret_log_file"

if git -C "$repo_root" grep -nI -E '(^|[[:space:]])(JWT_ACCESS_SECRET|JWT_REFRESH_SECRET|RAZORPAY_KEY_SECRET|OPENAI_API_KEY|CLOUDFLARE_API_TOKEN)[[:space:]]*=[[:space:]]*[^$<\{[:space:]]' -- ':!*.example' ':!*.sample' ':!*.md' ':!.github/workflows/*' >/tmp/rentitease-secret-audit.txt 2>/dev/null; then
  echo "FAIL: possible hard-coded production secret assignment detected."
  cat /tmp/rentitease-secret-audit.txt
  fail=1
else
  echo "PASS: no obvious hard-coded production secret assignments detected."
fi
rm -f /tmp/rentitease-secret-audit.txt

if (( fail != 0 )); then exit 1; fi
echo "CI/CD audit passed."
