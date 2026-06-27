#!/usr/bin/env bash
# Pre-handoff gate for agent deploys — exit 1 on failure.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DEPLOY_ID="${1:-}"
MANIFEST=""

if [ -n "$DEPLOY_ID" ]; then
  # DEPLOY-001 or DEPLOY-001-gameloop-stats
  if [ -f "docs/deploys/${DEPLOY_ID}.md" ]; then
    MANIFEST="docs/deploys/${DEPLOY_ID}.md"
  else
    found="$(find docs/deploys -maxdepth 1 -name "${DEPLOY_ID}*.md" ! -name '_TEMPLATE.md' 2>/dev/null | head -1 || true)"
    if [ -n "$found" ]; then
      MANIFEST="$found"
    fi
  fi
fi

echo "==> [agent-deploy-gate] MikuServerPro pre-handoff"
[ -n "$MANIFEST" ] && echo "    Manifest: $MANIFEST" || echo "    Manifest: (none — build only)"

FAIL=0
fail() { echo "ERROR: $*"; FAIL=1; }
ok() { echo "  OK: $*"; }

# 1. Build
echo "==> Build..."
if npm run build; then
  ok "npm run build"
else
  fail "npm run build failed"
fi

# 2. Handoff section exists if manifest given
if [ -n "$MANIFEST" ]; then
  if grep -q "## Handoff — Worker" "$MANIFEST"; then
    ok "Handoff section present in manifest"
  else
    fail "Missing '## Handoff — Worker' in $MANIFEST"
  fi

  if grep -q "Listo para review.*sí" "$MANIFEST" 2>/dev/null; then
    ok "Worker marked ready for review"
  else
    echo "WARN: Handoff not marked 'Listo para review: sí' — complete before coordinator review"
  fi

  # 3. Scope check — warn on files outside allowed list (heuristic)
  if grep -q "## Archivos permitidos" "$MANIFEST"; then
    echo "==> Scope hint (manual review required):"
    echo "    Changed files:"
    git diff --name-only HEAD 2>/dev/null | sed 's/^/      /' || true
    git diff --name-only --cached HEAD 2>/dev/null | sed 's/^/      (staged) /' || true
  fi
fi

# 4. Obvious anti-patterns in diff
if git diff HEAD 2>/dev/null | grep -E '^\+.*console\.(log|debug)\(' >/dev/null 2>&1; then
  echo "WARN: console.log/debug added — verify intentional"
fi

echo ""
if [ "$FAIL" -ne 0 ]; then
  echo "==> [agent-deploy-gate] FAILED"
  exit 1
fi
echo "==> [agent-deploy-gate] PASSED"
exit 0
