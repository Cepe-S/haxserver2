# Beta en Google Cloud VM (Linux)

Checklist para **2–3 días de prueba**. Stack: Node 20, PM2, SQLite, Puppeteer/Chrome headless.

## Antes de subir

| Item | Estado |
|------|--------|
| Sprint 1 BD/identidad (PROB-001, 003, 007, 012) | ✅ Cerrado |
| PROB-008 panel partidos | ⚠️ Solo lectura — no bloquea juego |
| PROB-011 balance PRO | ⚠️ Rating fijo 1000 — modo JT OK |
| PROB-016 auth web | ⚠️ Beta privada: cambiar `ADMIN_PASSWORD` y `JWT_SECRET` |
| PROB-017 token Haxball | Manual: pegar `thr1.…` al Execute en panel |
| PROB-020 SQLite compartido | OK para beta corta; no escalar carga |

## VM recomendada (GCE)

- **SO:** Ubuntu 22.04 o 24.04 LTS  
- **Tipo:** `e2-standard-2` (2 vCPU, 8 GB) — Puppeteer + sala consume RAM  
- **Disco:** 20 GB  
- **Firewall:** regla entrante **TCP 5173** (panel). No exponer 3001 al público salvo debug.

## Deploy en la VM

```bash
git clone <repo> haxserver2 && cd haxserver2
chmod +x deploy-linux.sh
./deploy-linux.sh
```

El script instala deps de Chrome, `npm run build:prod`, levanta PM2 (core :3001, web :3000, UI :5173).

### Config obligatoria

Editar `.env` en la raíz del repo:

```env
NODE_ENV=production
JWT_SECRET=<random 32+ chars>
ADMIN_PASSWORD=<password fuerte>
HAXBALL_HEADLESS=true
CORE_HOST=0.0.0.0
WEB_HOST=0.0.0.0
```

Reiniciar tras cambios: `npm run pm2:restart`

### Persistir tras reboot

```bash
pm2 startup    # copiar y ejecutar el comando que imprime
pm2 save
```

## Verificación post-deploy

```bash
pm2 status
curl -s http://localhost:3001/health | jq .
curl -s http://localhost:3000/api/health | jq .
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/   # 200
```

Desde tu PC: `http://<IP_EXTERNA_VM>:5173` → login con `ADMIN_PASSWORD`.

## Flujo operativo beta

1. Panel → **Server Images** → **Execute** con token Haxball (`thr1.…` desde haxball.com/headless).
2. Esperar link de sala en panel.
3. Entrar a la sala; probar join, balance, partido, admin `!login` con contraseña del Server Image.

## Puertos

| Puerto | Servicio | Exponer |
|--------|----------|---------|
| 5173 | Panel (Vite preview + proxy `/api`) | Sí |
| 3000 | Web API | No (proxy interno desde 5173) |
| 3001 | Core + Haxball | No |

## Logs y emergencia

Ver **`docs/LOGGING.md`** — todos los errores en `logs/errors.log` (JSON + stack).

```bash
tail -f logs/errors.log          # errores unificados core+web
npm run pm2:logs
grep '"level":"error"' logs/errors.log | tail -30
npm run pm2:restart
npm run pm2:delete && ./deploy-linux.sh   # redeploy limpio
```

## Problemas frecuentes

| Síntoma | Causa | Fix |
|---------|-------|-----|
| Execute sala falla | Chrome/Puppeteer | `./deploy-linux.sh` reinstala deps; `cd core && npx puppeteer browsers install chrome` |
| Login 404 | URL incorrecta | Usar `:5173`, no `:3000` |
| EPERM prisma | node bloqueando DLL | `pm2 stop all` → `npm run db:setup` |
| Sala no arranca | Token inválido/expirado | Nuevo token en Execute |
| OOM / VM lenta | RAM insuficiente | Subir a e2-standard-4 o 1 sala max (ya limitado) |

## Actualizar código durante la beta

```bash
git pull
npm run build:prod
npm run pm2:restart
```

## Fuera de alcance (beta)

- Cuentas `!register/!login` (diferido)
- HTTPS / dominio (usar IP + firewall restringido a IPs de testers)
- PostgreSQL (SQLite suficiente para beta)
