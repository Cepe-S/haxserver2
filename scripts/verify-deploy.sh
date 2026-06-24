#!/usr/bin/env bash
# Verificación post-deploy — falla con exit 1 si algo crítico no está OK.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CORE_PORT="${CORE_PORT:-3001}"
WEB_PORT="${WEB_PORT:-3000}"
UI_PORT="${UI_PORT:-5173}"
PM2_USER="${PM2_USER:-$(id -un)}"
PM2_SVC="pm2-${PM2_USER}"
MAX_WAIT="${VERIFY_MAX_WAIT:-60}"

if [ -f .env ]; then
  # shellcheck disable=SC1091
  set -a
  source .env 2>/dev/null || true
  set +a
  CORE_PORT="${CORE_PORT:-3001}"
  WEB_PORT="${WEB_PORT:-3000}"
fi

FAIL=0
warn() { echo "WARN: $*"; }
fail() { echo "ERROR: $*"; FAIL=1; }
ok() { echo "  OK: $*"; }

wait_http() {
  local url="$1"
  local label="$2"
  local i=0
  while [ "$i" -lt "$MAX_WAIT" ]; do
    if curl -sf "$url" >/dev/null 2>&1; then
      ok "$label"
      return 0
    fi
    sleep 2
    i=$((i + 2))
  done
  fail "$label no respondió en ${MAX_WAIT}s ($url)"
  return 1
}

echo "==> [verify-deploy] Comprobando stack..."

if ! command -v pm2 >/dev/null 2>&1; then
  fail "pm2 no instalado"
else
  for app in haxbotron-core haxbotron-web haxbotron-ui; do
    if pm2 describe "$app" >/dev/null 2>&1; then
      status="$(pm2 jlist 2>/dev/null | node -e "
        const apps=JSON.parse(require('fs').readFileSync(0,'utf8'));
        const a=apps.find(x=>x.name==='$app');
        process.stdout.write(a?.pm2_env?.status||'missing');
      " 2>/dev/null || echo "unknown")"
      if [ "$status" = "online" ]; then
        ok "PM2 $app online"
      else
        fail "PM2 $app status=$status"
      fi
    else
      fail "PM2 $app no registrado"
    fi
  done
fi

if command -v systemctl >/dev/null 2>&1; then
  if systemctl is-enabled "$PM2_SVC" >/dev/null 2>&1; then
    ok "systemd $PM2_SVC enabled"
  else
    fail "systemd $PM2_SVC no enabled (stack morirá al cerrar SSH)"
  fi
  if systemctl is-active "$PM2_SVC" >/dev/null 2>&1; then
    ok "systemd $PM2_SVC active"
  else
    fail "systemd $PM2_SVC no active"
  fi
else
  warn "systemctl no disponible — no se verificó persistencia"
fi

wait_http "http://127.0.0.1:${CORE_PORT}/health" "Core :${CORE_PORT}/health" || true
wait_http "http://127.0.0.1:${WEB_PORT}/api/health" "Web :${WEB_PORT}/api/health" || true

ui_code="$(curl -sf -o /dev/null -w '%{http_code}' "http://127.0.0.1:${UI_PORT}/" 2>/dev/null || echo "000")"
if [ "$ui_code" = "200" ]; then
  ok "Panel :${UI_PORT} HTTP 200"
else
  fail "Panel :${UI_PORT} HTTP $ui_code"
fi

if curl -sf "http://127.0.0.1:${WEB_PORT}/api/health" >/dev/null 2>&1; then
  sync_result="$(curl -sf -X POST "http://127.0.0.1:${WEB_PORT}/api/server-images/sync-states" \
    -H "Content-Type: application/json" -d '{}' 2>/dev/null || echo '{}')"
  ok "sync-states: $sync_result"
fi

CHROME="$(find "${HOME}/.cache/puppeteer" -name chrome -type f 2>/dev/null | head -1 || true)"
if [ -n "$CHROME" ] && [ -x "$CHROME" ]; then
  MISSING="$(ldd "$CHROME" 2>/dev/null | grep 'not found' || true)"
  if [ -z "$MISSING" ]; then
    ok "Puppeteer Chrome sin libs faltantes"
  else
    fail "Chrome missing libs: $MISSING"
  fi
else
  warn "Chrome Puppeteer no encontrado para ldd (Execute puede fallar)"
fi

echo ""
if [ "$FAIL" -ne 0 ]; then
  echo "==> [verify-deploy] FALLÓ — revisar errores arriba"
  exit 1
fi
echo "==> [verify-deploy] Todo OK"
