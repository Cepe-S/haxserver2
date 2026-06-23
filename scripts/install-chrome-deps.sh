#!/usr/bin/env bash
# Dependencias de sistema para Puppeteer/Chrome en Ubuntu/Debian (GCE).
set -euo pipefail

if ! command -v apt-get >/dev/null 2>&1; then
  echo "ERROR: apt-get no encontrado. Instalá manualmente las libs de Chrome."
  exit 1
fi

echo "==> Actualizando apt..."
sudo apt-get update

echo "==> Instalando librerías Chrome/Puppeteer..."
sudo apt-get install -y \
  ca-certificates fonts-liberation wget gnupg xdg-utils \
  libasound2t64 libasound2 \
  libatk-bridge2.0-0 libatk1.0-0 \
  libc6 libcairo2 libcups2 libdbus-1-3 libdrm2 libexpat1 libfontconfig1 libgbm1 \
  libgcc-s1 libgcc1 libglib2.0-0 libgtk-3-0 \
  libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 \
  libstdc++6 libu2f-udev libvulkan1 \
  libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
  libxext6 libxfixes3 libxi6 libxkbcommon0 libxrandr2 libxrender1 libxss1 libxtst6 \
  2>/dev/null || sudo apt-get install -y \
  ca-certificates fonts-liberation wget gnupg xdg-utils \
  libasound2 libatk-bridge2.0-0 libatk1.0-0 \
  libc6 libcairo2 libcups2 libdbus-1-3 libdrm2 libexpat1 libfontconfig1 libgbm1 \
  libgcc-s1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 \
  libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
  libxext6 libxfixes3 libxi6 libxkbcommon0 libxrandr2 libxrender1 libxss1 libxtst6

if ! ldconfig -p | grep -q libnspr4; then
  echo "ERROR: libnspr4 sigue sin estar disponible tras apt install"
  exit 1
fi

echo "==> libnspr4 OK"

# Chrome del sistema como fallback (arrastra todas las deps)
if ! command -v google-chrome-stable >/dev/null 2>&1; then
  echo "==> Instalando Google Chrome stable (fallback)..."
  sudo install -m 0755 -d /etc/apt/keyrings
  wget -q -O - https://dl.google.com/linux/linux_signing_key.pub \
    | sudo gpg --dearmor -o /etc/apt/keyrings/google-chrome.gpg
  echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" \
    | sudo tee /etc/apt/sources.list.d/google-chrome.list >/dev/null
  sudo apt-get update
  sudo apt-get install -y google-chrome-stable
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [ -d "$ROOT/core" ]; then
  echo "==> Puppeteer bundled Chrome..."
  (cd "$ROOT/core" && npx puppeteer browsers install chrome)
fi

echo "==> Verificando Chrome..."
CHROME="${PUPPETEER_EXECUTABLE_PATH:-}"
if [ -z "$CHROME" ] && command -v google-chrome-stable >/dev/null 2>&1; then
  CHROME="$(command -v google-chrome-stable)"
fi
if [ -z "$CHROME" ]; then
  CHROME=$(find /root/.cache/puppeteer -name chrome -type f 2>/dev/null | head -1)
fi
if [ -n "$CHROME" ] && [ -x "$CHROME" ]; then
  "$CHROME" --version || true
  MISSING=$(ldd "$CHROME" 2>/dev/null | grep "not found" || true)
  if [ -n "$MISSING" ]; then
    echo "WARN: librerías faltantes:"
    echo "$MISSING"
    exit 1
  fi
  echo "==> Chrome OK: $CHROME"
else
  echo "WARN: no se encontró ejecutable Chrome para verificar"
fi

echo "==> Listo. Reiniciá core: pm2 restart haxbotron-core"
