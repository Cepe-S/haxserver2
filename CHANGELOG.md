# Changelog — MikuServerPro

Historial de cambios y PROBs cerrados. **No editar `SystemStatus.md` con entradas de changelog** — van acá.

Formato PROB cerrado: `PROB-xxx` · fecha · descripción breve · archivos clave (opcional)

---

## PROBs resueltos (archivo)

| ID | Fecha | Descripción | Archivos |
|----|-------|-------------|----------|
| PROB-002 | 2026-06-21 | Kick por `\|,|` ejecuta `kickPlayer` | `PlayerJoinHandler.ts` |
| PROB-004 | 2026-06-21 | `gameLoopController.cleanup()` en `HaxballRoom.close()` | `HaxballRoom.ts` |
| PROB-005 | 2026-06-21 | `EventManager.resetInstance()` al cerrar sala | `EventManager.ts`, `HaxballRoom.ts` |
| PROB-006 | 2026-06-21 | `teams.json` / `matches.json` copiados a `dist/` en build | `core/scripts/copy-data.js` |
| PROB-009 | 2026-06-21 | Loops/eventos tras señal `trainingReady` en browser | `HaxballRoom.ts` |
| PROB-010 | 2026-06-21 | Geo IP con timeout 3s + fallback, no bloquea join | `GeoLocationService.ts` |
| PROB-013 | 2026-06-21 | Legacy haxbotron externo eliminado | — |
| PROB-014 | 2026-06-22 | Docs de agentes: SystemStatus solo activos + changelog separado | `SystemStatus.md`, `CHANGELOG.md`, `AGENTS.md` |
| PROB-001 | 2026-06-22 | Kick nick duplicado en sala (cache + lista Haxball) | `PlayerJoinHandler.ts`, `PlayerCacheManager.ts` |
| PROB-003 | 2026-06-22 | `@@unique([identityId, name])` + upsert + dedupe pre-push | `schema.prisma`, `PlayerIdentityManager.ts`, `dedupe-player-names.js` |
| PROB-007 | 2026-06-22 | Permisos por `identityId`; admin login sin auth Haxball | `PermissionManager.ts`, `AdminManager.ts` |
| PROB-012 | 2026-06-22 | Eliminado stub `saveMatchStatistics`; persistencia vía `endMatch()` | `MatchLoop.ts` |
| PROB-028 | 2026-06-24 | `EventBus.offEvent` no removía wrappers → listeners de loops acumulados; timeLimit/scoreLimit incorrectos por fase | `EventBus.ts`, `GameLoop.ts`, `GameEventHandlers.ts` |
| PROB-024 | 2026-06-26 | Stats partido solo en MatchLoop; `startMatch` tras `safeStartGame` (evento durante STARTING); guards `isMatchActive` en `endMatch` | `MatchLoop.ts`, `MatchStatsManager.ts` |
| PROB-022 | 2026-06-26 | `forceRefresh` backfill vía `PlayerIdentityManager` cuando jugador en sala falta en cache; grace 5s antes de warn | `PlayerCacheManager.ts`, `HaxballRoom.ts` |
| PROB-023 | 2026-06-26 | Rejoin sin leave: refrescar conexión activa en BD (haxballId/name) en lugar de cerrar+crear; leave handler cierra por conn/haxballId/identityId | `PlayerIdentityManager.ts`, `PlayerLeaveHandler.ts` |
| PROB-025 | 2026-06-26 | `initializePlayer` idempotente por `identityId` — actualiza haxballId/name en reconnect sin warn spam | `MatchStatsManager.ts` |
| PROB-030 | 2026-06-21 | Admin passwords panel aplicadas in-game vía `serverImageId`; auth web sin fallback `admin123` en prod; errores `!login` diferenciados | `EventManager.ts`, `serverImages.ts`, `AdminManager.ts`, `LoginCommand.ts`, `server.ts` |

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-06-21 | Unificación ESTADO_SISTEMAS + PROBLEMAS → SystemStatus. Entorno agentes + reglas Cursor. |
| 2026-06-21 | Limpieza docs obsoletos y código muerto (TestCommand, EventSystemTest). |
| 2026-06-21 | Eliminado legacy haxbotron. Estructura aplanada en raíz `haxserver2/`. |
| 2026-06-21 | Fase gameplay: PROB-002, 004, 005, 006, 009, 010 cerrados. |
| 2026-06-22 | `build` sin `db:setup` en cada arranque; `build:full` para schema sync. |
| 2026-06-22 | Panel: proxy Vite `/api`, login local, `.env` Prisma corrupto corregido. |
| 2026-06-22 | Puppeteer: fallback Chrome sistema Windows + `postinstall` browsers install. |
| 2026-06-22 | Changelog movido a este archivo; PROBs resueltos sacados de tabla activa. |
| 2026-06-22 | Plan cuentas jugador (!register/!login) **diferido** — ver docs/plans/DEFERRED-player-accounts.md. |
| 2026-06-23 | PM2 registrado en systemd vía `scripts/pm2-systemd-setup.sh`; deploy sobrevive cierre SSH y reboot. |
| 2026-06-24 | Deploy hardened: root obligatorio, validación secrets, verify-deploy, sync huérfanos, Execute recovery. |
| 2026-06-24 | **PROB-028:** fix crítico GameLoop — `EventBus.offEvent` no desregistraba listeners; TrainingLoop aplicaba 0/0 sobre partido activo. |
| 2026-06-26 | **DEPLOY-001 / PROB-024:** lifecycle stats en MatchLoop; fix `startMatch` omitido en primer partido; menos spam `Match was not started`. |
| 2026-06-26 | **DEPLOY-002 / PROB-022:** backfill identity en `PlayerCacheManager.forceRefresh` — jugadores en sala siempre en cache para `recordGoal`. |
| 2026-06-26 | **DEPLOY-003 / PROB-023, PROB-025:** rejoin refresh conexión activa; init stats idempotente por identityId. |
| 2026-06-21 | **DEPLOY-005 / PROB-030:** admin passwords por `serverImageId` al execute; auth web sin fallback `admin123` en prod. |
| 2026-06-23 | Chrome deps GCE: paquetes t64 mínimos verificados en install-chrome-deps.sh + npm run install:chrome-deps. |
