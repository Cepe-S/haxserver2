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
| 2026-06-23 | Chrome deps GCE: paquetes t64 mínimos verificados en install-chrome-deps.sh + npm run install:chrome-deps. |
