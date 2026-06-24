# Beta en Google Cloud VM (Linux)

Checklist para **2–3 días de prueba**. Stack: Node 20, PM2 + systemd, SQLite, Puppeteer/Chrome headless.

## VM recomendada (GCE)

- **SO:** Ubuntu 22.04 o 24.04 LTS  
- **Tipo:** `e2-standard-2` (2 vCPU, 8 GB)  
- **Disco:** 20 GB  
- **Firewall:** regla entrante **TCP 5173** (panel). No exponer 3001/3000 al público.

## Primer deploy (VM nueva)

```bash
# Node 20 (si la imagen GCE no lo trae)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

# Siempre como root — PM2 queda en pm2-root.service (sobrevive SSH + reboot)
sudo -i
cd ~
git clone https://github.com/Cepe-S/haxserver2.git
cd haxserver2

cp .env.example .env
nano .env   # JWT_SECRET (16+ chars) y ADMIN_PASSWORD (no admin123)

chmod +x deploy-linux.sh scripts/*.sh
./deploy-linux.sh
```

`deploy-linux.sh` hace en orden:

1. Chrome deps (`libnspr4`, t64, puppeteer chrome, `ldd` verify)  
2. Valida Node 18+, secrets en `.env`  
3. `npm run build:prod`  
4. PM2 start/reload + `pm2 save`  
5. `scripts/pm2-systemd-setup.sh` → unit `pm2-root`  
6. `scripts/verify-deploy.sh` → health + systemd (falla si algo crítico mal)

## Config obligatoria (`.env` en raíz)

```env
NODE_ENV=production
JWT_SECRET=<random 32+ chars>
ADMIN_PASSWORD=<password fuerte>
HAXBALL_HEADLESS=true
CORE_HOST=0.0.0.0
WEB_HOST=0.0.0.0
```

El deploy **aborta** si `JWT_SECRET` o `ADMIN_PASSWORD` siguen en defaults.

## Verificación post-deploy

```bash
systemctl status pm2-root    # enabled + active
pm2 status                     # 3 online
npm run deploy:verify

curl -s http://localhost:3001/health
curl -s http://localhost:3000/api/health
```

Panel: `http://<IP_VM>:5173` → login → Server Images → **Execute** con token `thr1.…`.

**Prueba SSH:** cerrar sesión, reconectar, `pm2 status` debe seguir online.

## Actualizar código

```bash
sudo -i
cd ~/haxserver2
git pull
./deploy-linux.sh
```

Solo deps Chrome (sin rebuild): `npm run install:chrome-deps`

## Puertos

| Puerto | Servicio | Exponer |
|--------|----------|---------|
| 5173 | Panel (Vite preview + proxy `/api`) | Sí |
| 3000 | Web API | No |
| 3001 | Core + Haxball | No |

## Logs

Ver **`docs/LOGGING.md`**.

```bash
tail -f logs/errors.log
npm run pm2:logs
```

## Problemas frecuentes

| Síntoma | Causa | Fix |
|---------|-------|-----|
| Execute 409 "already running" | BD huérfana tras caída PM2 | Auto-sync cada 60s; o `curl -X POST localhost:3000/api/server-images/sync-states -H 'Content-Type: application/json' -d '{}'` |
| Stack murió ~06:19 sin tocar VM | PM2 en sesión SSH + apt-daily | `./deploy-linux.sh` (systemd) |
| `libnspr4.so` | Deps Chrome | Incluido en deploy |
| `haxbotron-core doesn't exist` | PM2 sin procesos | `sudo -i && cd ~/haxserver2 && ./deploy-linux.sh` |
| Login 404 | URL incorrecta | Usar `:5173` |

## Incidente conocido (23-Jun)

PM2 corría en `session-1` SSH. `apt-daily-upgrade` cerró la sesión → systemd mató PM2 + Chrome. **Fix:** `pm2-root.service` vía deploy (no depender de SSH).
