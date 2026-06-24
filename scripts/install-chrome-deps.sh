#!/usr/bin/env bash
# Dependencias de sistema para Puppeteer/Chrome (Ubuntu GCE).
# Paquetes mínimos t64 verificados en Ubuntu Resolute (southamerica-west1).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if ! command -v apt-get >/dev/null 2>&1; then
  echo "ERROR: apt-get no encontrado."
  exit 1
fi

echo "==> [chrome-deps] Actualizando apt..."
sudo apt-get update

# Mínimo que arregla libnspr4.so en Puppeteer Chrome (GCE Resolute)
CHROME_LIBS_T64=(
  libasound2t64
  libnspr4
  libnss3
  libatk-bridge2.0-0t64
  libatk1.0-0t64
  libcups2t64
  libglib2.0-0t64
  libgtk-3-0t64
  libgbm1
  libdrm2
  libxss1
  libxrandr2
)

CHROME_LIBS_LEGACY=(
  libasound2
  libnspr4
  libnss3
  libatk-bridge2.0-0
  libatk1.0-0
  libcups2
  libglib2.0-0
  libgtk-3-0
  libgbm1
  libdrm2
  libxss1
  libxrandr2
)

# Extras recomendados por Puppeteer (no bloquean si ya está el mínimo)
CHROME_LIBS_EXTRA=(
  ca-certificates fonts-liberation wget gnupg xdg-utils
  libc6 libcairo2 libdbus-1-3 libexpat1 libfontconfig1 libgcc-s1
  libpango-1.0-0 libpangocairo-1.0-0 libstdc++6
  libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxdamage1 libxfixes3
  libxi6 libxkbcommon0 libxrender1 libxtst6
)

install_packages() {
  if apt-cache show libasound2t64 >/dev/null 2>&1; then
    echo "==> [chrome-deps] Ubuntu t64 (Resolute+)"
    sudo apt-get install -y "${CHROME_LIBS_T64[@]}" "${CHROME_LIBS_EXTRA[@]}"
  else
    echo "==> [chrome-deps] Ubuntu/Debian legacy"
    sudo apt-get install -y "${CHROME_LIBS_LEGACY[@]}" "${CHROME_LIBS_EXTRA[@]}"
  fi
}

install_packages

if ! ldconfig -p | grep -q libnspr4; then
  echo "ERROR: libnspr4 no disponible tras apt install"
  exit 1
fi
echo "==> [chrome-deps] libnspr4 OK"

if [ -d "$ROOT/core" ]; then
  echo "==> [chrome-deps] Puppeteer Chrome..."
  (cd "$ROOT/core" && npx puppeteer browsers install chrome)
fi

CHROME=""
if [ -n "${PUPPETEER_EXECUTABLE_PATH:-}" ] && [ -x "${PUPPETEER_EXECUTABLE_PATH}" ]; then
  CHROME="${PUPPETEER_EXECUTABLE_PATH}"
elif command -v google-chrome-stable >/dev/null 2>&1; then
  CHROME="$(command -v google-chrome-stable)"
else
  CHROME="$(find "${HOME}/.cache/puppeteer" -name chrome -type f 2>/dev/null | head -1 || true)"
fi

if [ -n "$CHROME" ] && [ -x "$CHROME" ]; then
  echo "==> [chrome-deps] Verificando $CHROME"
  "$CHROME" --version || true
  MISSING="$(ldd "$CHROME" 2>/dev/null | grep 'not found' || true)"
  if [ -n "$MISSING" ]; then
    echo "ERROR: librerías faltantes para Chrome:"
    echo "$MISSING"
    exit 1
  fi
  echo "==> [chrome-deps] Chrome OK"
else
  echo "WARN: no se encontró ejecutable Chrome para verificar"
fi

if [ -z "${DEPLOY_NO_PM2_RESTART:-}" ] && command -v pm2 >/dev/null 2>&1 && pm2 describe haxbotron-core >/dev/null 2>&1; then
  echo "==> [chrome-deps] Reiniciando haxbotron-core..."
  pm2 restart haxbotron-core
fi

echo "==> [chrome-deps] Listo"
