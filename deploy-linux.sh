#!/usr/bin/env bash
# Deploy MikuServerPro en Linux (GCE / Ubuntu). Beta 2–3 días.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "==> MikuServerPro — deploy Linux"

# --- Dependencias del sistema (Chrome/Puppeteer) ---
if command -v apt-get >/dev/null 2>&1; then
  bash "$ROOT/scripts/install-chrome-deps.sh"
fi

# --- Node / PM2 ---
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js 18+ requerido. Instalar: https://nodejs.org/"
  exit 1
fi

NODE_MAJOR=$(node -p "process.version.slice(1).split('.')[0]")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "ERROR: Node $(node -v) — se requiere >= 18"
  exit 1
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "==> Instalando PM2 global..."
  sudo npm install -g pm2
fi

# --- Config ---
if [ ! -f .env ]; then
  if [ -f .env.production ]; then
    cp .env.production .env
    echo "==> Creado .env desde .env.production — CAMBIAR JWT_SECRET y ADMIN_PASSWORD"
  else
    cp .env.example .env
    echo "==> Creado .env desde .env.example"
  fi
fi

if ! grep -q '^NODE_ENV=' .env 2>/dev/null; then
  echo 'NODE_ENV=production' >> .env
fi

if [ ! -f web/frontend/.env ]; then
  cp web/frontend/.env.example web/frontend/.env
fi

# --- Build (incluye db:setup + frontend) ---
echo "==> npm install + build:prod..."
npm install
npm run build:prod

# --- Verificar artefactos ---
test -f core/dist/app.js || { echo "ERROR: falta core/dist/app.js"; exit 1; }
test -f web/backend/dist/server.js || { echo "ERROR: falta web/backend/dist/server.js"; exit 1; }
test -f web/frontend/dist/index.html || { echo "ERROR: falta frontend build"; exit 1; }

mkdir -p logs

# --- PM2 ---
echo "==> Iniciando PM2..."
pm2 delete ecosystem.config.js 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo ""
echo "============================================"
echo "  Deploy OK"
echo "  Panel:  http://$(curl -s -H Metadata-Flavor:Google http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip 2>/dev/null || hostname -I | awk '{print $1}'):5173"
echo "  Health: curl localhost:3001/health && curl localhost:3000/api/health"
echo ""
echo "  Abrir firewall GCE: TCP 5173 (panel)"
echo "  pm2 status | pm2 logs"
echo "  pm2 startup  (persistir tras reboot)"
echo "============================================"
