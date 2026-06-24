#!/usr/bin/env bash
# Deploy MikuServerPro en Linux (GCE / Ubuntu).
# Requiere root. Registra PM2 en systemd (sobrevive SSH logout + reboot).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "============================================"
echo "  MikuServerPro — deploy Linux"
echo "============================================"

# --- Root obligatorio (PM2 en /root, unit pm2-root) ---
if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: Ejecutar como root:"
  echo "  sudo -i"
  echo "  cd $ROOT && ./deploy-linux.sh"
  exit 1
fi

chmod +x "$ROOT/scripts/"*.sh 2>/dev/null || true
export PM2_USER="$(id -un)"
export PM2_HOME="$HOME"
export DEPLOY_NO_PM2_RESTART=1

# --- Chrome/Puppeteer ---
if command -v apt-get >/dev/null 2>&1; then
  bash "$ROOT/scripts/install-chrome-deps.sh"
fi

# --- Node / PM2 ---
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js 18+ requerido."
  echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
  echo "  apt-get install -y nodejs"
  exit 1
fi

NODE_MAJOR="$(node -p "process.version.slice(1).split('.')[0]")"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "ERROR: Node $(node -v) — se requiere >= 18"
  exit 1
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "==> Instalando PM2 global..."
  npm install -g pm2
fi

# --- Config ---
if [ ! -f .env ]; then
  if [ -f .env.production ]; then
    cp .env.production .env
    echo "==> Creado .env desde .env.production"
  else
    cp .env.example .env
    echo "==> Creado .env desde .env.example"
  fi
  echo "==> EDITAR .env (JWT_SECRET, ADMIN_PASSWORD) y volver a correr deploy"
  exit 1
fi

if ! grep -q '^NODE_ENV=' .env 2>/dev/null; then
  echo 'NODE_ENV=production' >> .env
fi

if [ ! -f web/frontend/.env ]; then
  cp web/frontend/.env.example web/frontend/.env
fi

# --- Validar secrets (no defaults de beta) ---
env_val() {
  grep "^$1=" .env 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"'"'" | tr -d ' ' || true
}

JWT_SECRET="$(env_val JWT_SECRET)"
ADMIN_PASSWORD="$(env_val ADMIN_PASSWORD)"

if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your-super-secret-jwt-key-here" ] || [ "${#JWT_SECRET}" -lt 16 ]; then
  echo "ERROR: Configurar JWT_SECRET en .env (mínimo 16 caracteres, no el default)"
  exit 1
fi

if [ -z "$ADMIN_PASSWORD" ] || [ "$ADMIN_PASSWORD" = "admin123" ]; then
  echo "ERROR: Configurar ADMIN_PASSWORD en .env (no usar admin123)"
  exit 1
fi

echo "==> Config .env OK"

# --- Build ---
echo "==> npm install + build:prod..."
npm install
npm run build:prod

# --- Artefactos ---
test -f core/dist/app.js || { echo "ERROR: falta core/dist/app.js"; exit 1; }
test -f web/backend/dist/server.js || { echo "ERROR: falta web/backend/dist/server.js"; exit 1; }
test -f web/frontend/dist/index.html || { echo "ERROR: falta frontend build"; exit 1; }

mkdir -p logs

# --- PM2 + systemd ---
echo "==> PM2 (user=$PM2_USER, service=pm2-${PM2_USER})..."
if pm2 describe haxbotron-core >/dev/null 2>&1; then
  pm2 reload ecosystem.config.js --update-env
else
  pm2 delete ecosystem.config.js 2>/dev/null || true
  pm2 start ecosystem.config.js
fi
pm2 save
bash "$ROOT/scripts/pm2-systemd-setup.sh"

# --- Verificación (falla deploy si algo crítico mal) ---
echo "==> Verificación post-deploy..."
bash "$ROOT/scripts/verify-deploy.sh"

EXTERNAL_IP=""
EXTERNAL_IP="$(curl -sf -H Metadata-Flavor:Google \
  http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip \
  2>/dev/null || true)"
if [ -z "$EXTERNAL_IP" ]; then
  EXTERNAL_IP="$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'localhost')"
fi

echo ""
echo "============================================"
echo "  Deploy OK"
echo "  Panel:  http://${EXTERNAL_IP}:5173"
echo "  PM2:    systemctl status pm2-${PM2_USER}"
echo "  Logs:   tail -f logs/errors.log"
echo "  Health: curl localhost:3001/health"
echo ""
echo "  Firewall GCE: TCP 5173 (panel)"
echo "  Execute sala: panel → Server Images → token thr1.…"
echo "============================================"
