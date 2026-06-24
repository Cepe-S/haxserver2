#!/usr/bin/env bash
# Registra PM2 en systemd para que el stack sobreviva cierre de SSH y reboot.
# Uso: bash scripts/pm2-systemd-setup.sh
# Env: PM2_USER (default: whoami), PM2_HOME (default: $HOME)
set -euo pipefail

PM2_USER="${PM2_USER:-$(id -un)}"
PM2_HOME="${PM2_HOME:-$HOME}"
SERVICE_NAME="pm2-${PM2_USER}"

echo "==> [pm2-systemd] user=$PM2_USER home=$PM2_HOME service=$SERVICE_NAME"

if ! command -v pm2 >/dev/null 2>&1; then
  echo "ERROR: pm2 no está en PATH"
  exit 1
fi

if ! command -v systemctl >/dev/null 2>&1; then
  echo "WARN: systemctl no disponible — solo pm2 save (sin auto-start tras reboot)"
  pm2 save
  exit 0
fi

mkdir -p "$PM2_HOME/.pm2"

run_startup_command() {
  local cmd="$1"
  if [ "$(id -u)" -eq 0 ]; then
    eval "$(echo "$cmd" | sed 's/^sudo //')"
  else
    eval "$cmd"
  fi
}

if systemctl is-enabled "$SERVICE_NAME" >/dev/null 2>&1; then
  echo "==> [pm2-systemd] $SERVICE_NAME ya está enabled"
  pm2 save
  echo "==> [pm2-systemd] OK (dump actualizado; sin restart extra de systemd)"
  exit 0
fi

echo "==> [pm2-systemd] Configurando systemd..."
OUTPUT=$(pm2 startup systemd -u "$PM2_USER" --hp "$PM2_HOME" 2>&1) || true
echo "$OUTPUT"

if echo "$OUTPUT" | grep -qi "already configured\|already setup"; then
  echo "==> [pm2-systemd] PM2 ya registrado en systemd"
elif STARTUP_CMD=$(echo "$OUTPUT" | grep -E '^sudo env PATH=|^env PATH=' | tail -1); then
  echo "==> [pm2-systemd] Ejecutando comando de registro..."
  run_startup_command "$STARTUP_CMD"
else
  echo "ERROR: no se pudo parsear 'pm2 startup'. Ejecutá manualmente:"
  echo "  pm2 startup systemd -u $PM2_USER --hp $PM2_HOME"
  exit 1
fi

pm2 save

if systemctl is-enabled "$SERVICE_NAME" >/dev/null 2>&1; then
  echo "==> [pm2-systemd] OK — $SERVICE_NAME enabled (sobrevive SSH logout + reboot)"
  systemctl status "$SERVICE_NAME" --no-pager 2>/dev/null | head -6 || true
else
  echo "ERROR: $SERVICE_NAME no quedó enabled"
  exit 1
fi
