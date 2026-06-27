# SystemStatus — MikuServerPro

**Última actualización:** 2026-06-26  
**Codebase activo:** `haxserver2/` (MikuServerPro — único proyecto en el repo)  
**Changelog / PROBs cerrados:** `[CHANGELOG.md](./CHANGELOG.md)`  
**Próximo ID libre:** `PROB-031`  
**Fuente análisis:** logs beta GCE exportados (`Desktop/_`, sesión 2026-06-23 → 2026-06-24, sala `main-beta-1`)

---

## ⚠️ REGLAS OBLIGATORIAS PARA AGENTES

Leer **antes** de codear. Actualizar en el **mismo turno**:


| Acción                                | Dónde                                                                                                                                     |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Arreglar un bug (PROB-xxx)            | **Quitar** fila de [Problemas activos](#problemas-activos); actualizar filas del subsistema (A–N); **registrar** cierre en `CHANGELOG.md` |
| Progreso parcial (PROB sigue abierto) | Actualizar fila del PROB y subsistema en este archivo                                                                                     |
| Nuevo problema                        | Crear `PROB-031+` en tabla activa                                                                                                         |
| Cambiar prioridad / sprint            | Sección [Priorización](#priorización)                                                                                                     |
| Cualquier cambio de código verificado | Entrada en `CHANGELOG.md` (historial)                                                                                                     |


**Prohibido:** PROBs resueltos en la tabla activa · changelog en este archivo · cerrar turno con código cambiado sin actualizar docs.

**Alcance:** solo fixes y estabilidad; sin features ni seguridad extra salvo orden humana.

**Deploy agentes:** DEPLOY-004 ✅ stats tops · **DEPLOY-005** ✅ admin passwords (PROB-030 cerrado). Plan: [`docs/plans/stats-tops-vNext.md`](docs/plans/stats-tops-vNext.md)

---

## Leyenda


| Símbolo | Significado                              |
| ------- | ---------------------------------------- |
| ✅       | Operativo en flujo principal             |
| ⚠️      | Parcial — bugs o gaps conocidos          |
| ❌       | Roto / no implementado                   |
| 🔧      | Solo en modo dev / plataforma específica |


**Severidad:** 🔴 crítico · 🟠 alto · 🟡 medio

---

## Resumen ejecutivo — beta GCE


| Grupo                   | Sistemas | ✅   | ⚠️  | ❌   | 🔧  |
| ----------------------- | -------- | --- | --- | --- | --- |
| A — Infraestructura     | 7        | 5   | 2   | 0   | 0   |
| B — Base de datos       | 8        | 6   | 2   | 0   | 0   |
| C — Motor Haxball       | 6        | 4   | 2   | 0   | 0   |
| D — Eventos / lifecycle | 5        | 3   | 2   | 0   | 0   |
| E — Identidad jugadores | 7        | 3   | 3   | 1   | 0   |
| F — Moderación          | 5        | 3   | 2   | 0   | 0   |
| G — Chat / comandos     | 7        | 5   | 1   | 1   | 0   |
| H — Gameplay in-game    | 10       | 6   | 4   | 0   | 0   |
| I — Admin in-game       | 4        | 4   | 0   | 0   | 0   |
| J — Logging / webhooks  | 5        | 5   | 0   | 0   | 0   |
| K — API Core            | 8        | 8   | 0   | 0   | 0   |
| L — Web Backend         | 10       | 8   | 2   | 0   | 0   |
| M — Frontend / Panel    | 13       | 10  | 2   | 1   | 0   |
| N — Build / deploy      | 6        | 5   | 0   | 0   | 1   |


**Build:** ✅ `npm run build` OK (core) · **13 PROBs activos**

**Estado operativo beta:** sala `main-beta-1` **corrió** tras instalar Chrome deps (~01:28 UTC 23-Jun). Errores post-arranque son de **runtime** (cache, stats, sync), no de deploy inicial.

---

## Análisis logs beta GCE (2026-06-23 / 24)

Archivos: `errors.log` (27 errors), `core-app.log`, `web-app.log`, PM2 stdout.

### Errores únicos en `errors.log`


| Ventana | Error | Count | Estado |
| ------- | ----- | ----- | ------ |
| 01:06–01:10 | `POST /api/server-images/sync-states` → 415 `application/x-www-form-urlencoded` | 2 | **PROB-021** activo |
| 01:16–01:27 | Chrome `libnspr4.so` missing → Execute falla | 10 | Mitigado en VM manual; script en deploy |
| 06:19 | `Target closed` + `unhandledRejection` al shutdown PM2 | 3 | **PROB-026** (+ incidente infra) |
| 24-Jun 01:11–01:12 | sync-states 415 otra vez | 2 | **PROB-021** (VM aún sin fix deploy) |


### Warnings runtime (sala activa, sin errors nuevos post-redploy)


| Mensaje | Count approx | PROB |
| ------- | ------------ | ---- |
| `Player X in room but not in cache - needs identity` | **646** (pre-fix) | cerrado **PROB-022** — validar en beta |
| `Match was not started, skipping stats save` | **689** (pre-fix) | cerrado **PROB-024** — validar en beta |
| `Player already initialized` | **54** (pre-fix) | cerrado **PROB-025** — validar en beta |
| `Player joined without proper leave` | **4** (pre-fix) | cerrado **PROB-023** — validar en beta |
| `Team imbalance detected - auto-fixing` | **34** | observar (balance auto) |

### GameLoop — límites time/score (PROB-028, cerrado)

**Causa raíz:** `EventBus.onEvent` registraba un **wrapper** pero `offEvent` intentaba remover el listener **original** → `GameLoop.stop()` nunca desregistraba handlers. Cada transición training↔match **acumulaba** listeners.

**Evidencia en logs (`core-app.log`, sala `main-beta-1`):**

| Patrón | Ejemplo timestamp | Significado |
| ------ | ----------------- | ----------- |
| Training + Match `handleGameStop` mismo ms | `01:45:20.476` | Loop inactivo sigue reaccionando |
| 5–6× `Applying match settings` / 100ms | `17:36:54` | Múltiples MatchLoop handlers |
| Doble `Match restarted` | `03:29:18.101` + `.152` | `startNewMatch` concurrente |
| Match `Restarting…` tras transición a training | `02:03:26` | MatchLoop stale post-transición |

**Efecto en sala:** TrainingLoop (0/0) y MatchLoop (10/5) compiten por `setTimeLimit`/`setScoreLimit` → partidos sin límite de tiempo/goles o training con límites de partido.

**Fix:** mapa listener→wrapper en `EventBus.ts`; guard `state===RUNNING` en `GameLoop`; stats solo en `MatchLoop` (no duplicar en `GameEventHandlers`).


### Incidentes infra (documentados, no PROB de código)


| Incidente | Causa | Mitigación |
| --------- | ----- | ---------- |
| Stack murió 06:19 | PM2 en sesión SSH; `apt-daily` cerró session-1 | `deploy-linux.sh` + `pm2-root.service` (repo `aa465fd`, pendiente deploy VM) |
| Execute 409 tras caída | BD `running` sin sala en core | sync huérfanos + Execute recovery (repo `aa465fd`, pendiente deploy VM) |

---

## Problemas activos


| ID       | Sev | Descripción breve | Evidencia logs | Archivos clave |
| -------- | --- | ----------------- | -------------- | -------------- |
| PROB-008 | 🟠  | UI partidos solo lectura (Edit sin handler) | — | `MatchesManager.tsx` |
| PROB-011 | 🟠  | Balance PRO rating=1000 fijo | imbalance auto-fix x34 | `BalanceManager.ts` |
| PROB-015 | 🟡  | `npm start` rebuild lento | — | `package.json` |
| PROB-016 | 🟡  | Auth web permisiva en varios endpoints | — | `web/backend/server.ts` |
| PROB-017 | 🟡  | Token Haxball manual cada execute | — | `serverImages.ts` |
| PROB-018 | 🟡  | PM2 solo Linux (Windows sin PM2) | — | `ecosystem.config.js` |
| PROB-019 | 🟡  | Cleanup Chrome agresivo al startup | — | `core/app.ts` |
| PROB-020 | 🟡  | SQLite compartido core+web | — | `DatabaseManager.ts` |
| **PROB-021** | 🟠  | **sync-states rechaza POST form-urlencoded (415)** — auto-sync falla silencioso | 4× `FST_ERR_CTP_INVALID_MEDIA_TYPE` | `serverImages.ts`, `web/backend/server.ts` |
| **PROB-026** | 🟡  | **Powershot `setDiscProperties` race al cerrar Chrome** → unhandledRejection | 06:19 shutdown | `PowershotManager.ts`, `HaxballRoom.ts`, `app.ts` |
| **PROB-027** | 🟠  | **Server Image huérfana tras kill PM2** — panel Execute 409 | incidente 06:19 | `serverImages.ts` |


**Fix en repo sin deploy VM:** PROB-026 (parcial), PROB-027 (sync interval + Execute recovery), infra PM2 systemd — commit `aa465fd`.

**Human TODO cruzado:** PROB-008.

---

## A — Infraestructura


| Sistema              | Ubicación                   | Estado | Notas                         |
| -------------------- | --------------------------- | ------ | ----------------------------- |
| Monorepo Turborepo   | `package.json`              | ✅      |                               |
| Core Fastify :3001   | `core/src/app.ts`           | ✅      |                               |
| Web Backend :3000    | `web/backend/src/server.ts` | ✅      | PROB-016                      |
| Frontend React :5173 | `web/frontend/`             | ✅      | Proxy `/api`                  |
| Config AppConfig     | `core/.../AppConfig.ts`     | ⚠️     | Web usa env directo           |
| PM2 producción GCE   | `deploy-linux.sh`, `ecosystem.config.js` | ⚠️ | systemd en repo; VM beta usó sesión SSH (incidente) |
| Graceful shutdown    | `core/app.ts`               | ⚠️     | PROB-026 race; guard reentrada en repo |
| Chrome deps GCE      | `scripts/install-chrome-deps.sh` | ✅ | libnspr4 OK tras script manual |


---

## B — Base de datos


| Sistema               | Ubicación               | Estado | Notas                     |
| --------------------- | ----------------------- | ------ | ------------------------- |
| Prisma + SQLite       | `database/prisma/`      | ✅      |                           |
| DatabaseManager       | `database/src/`         | ✅      | PROB-020                  |
| Setup / seed          | `database/src/setup.ts` | ✅      | `npm run db:setup` manual |
| ServerImage model     | schema                  | ⚠️     | PROB-027 estado huérfano  |
| PlayerIdentity / Name | schema                  | ✅      | rejoin refresh conexión activa (PROB-023 cerrado) |
| StatEvent (tops período) | schema               | ✅      | DEPLOY-004 — eventos gol/asistencia con timestamp |
| PlayerSanction        | schema                  | ✅      |                           |
| PlayerPermission      | schema                  | ✅      | lookup por identityId     |
| Concurrencia SQLite   | core + web              | ⚠️     | PROB-020                  |


---

## C — Motor Haxball


| Sistema                | Ubicación                     | Estado | Notas                      |
| ---------------------- | ----------------------------- | ------ | -------------------------- |
| HaxballRoom lifecycle  | `core/haxball/HaxballRoom.ts` | ✅      | Sala main-beta-1 OK beta   |
| Creación sala + token  | `createRoom()`                | ⚠️     | PROB-017; Chrome deps OK post-fix |
| Estadios embebidos     | `StadiumManager`              | ✅      |                            |
| Browser event adapter  | `setupHaxballEvents`          | ✅      |                            |
| Cleanup Chrome startup | `app.ts`                      | ⚠️     | PROB-019                   |
| Geolocalización join   | `GeoLocationService`          | ✅      | Timeout 3s                 |


---

## D — Eventos / lifecycle


| Sistema                    | Ubicación                | Estado | Notas                    |
| -------------------------- | ------------------------ | ------ | ------------------------ |
| EventBus                   | `events/EventBus.ts`     | ✅      | offEvent corregido (PROB-028 cerrado) |
| EventManager               | `events/EventManager.ts` | ✅      | resetInstance en close   |
| Handlers Haxball (~20)     | `events/handlers/`       | ✅      | stats lifecycle en MatchLoop |
| Server Images execute/stop | `routes/serverImages.ts` | ⚠️     | PROB-021, PROB-027       |
| Auto-sync estados          | `serverImages.ts`        | ⚠️     | PROB-021 415; fix sync directo en repo |


---

## E — Identidad jugadores


| Sistema               | Ubicación                         | Estado | Notas              |
| --------------------- | --------------------------------- | ------ | ------------------ |
| PlayerIdentityManager | `player/PlayerIdentityManager.ts` | ✅      | rejoin refresh conexión activa (PROB-023 cerrado) |
| PlayerJoinHandler     | `handlers/PlayerJoinHandler.ts`   | ✅      | kick nick dup OK   |
| PlayerLeaveHandler    | `handlers/PlayerLeaveHandler.ts`  | ✅      | leave por conn/haxballId/identityId |
| PlayerCacheManager    | `player/PlayerCacheManager.ts`    | ✅      | backfill identity en `forceRefresh` (PROB-022 cerrado) |
| Anti nick duplicado   | `PlayerJoinHandler`               | ✅      |                    |
| Anti doble join       | —                                 | ❌      | No portado         |
| Historial nombres BD  | `PlayerName`                      | ✅      |                    |


---

## F — Moderación


| Sistema               | Ubicación                      | Estado | Notas                 |
| --------------------- | ------------------------------ | ------ | --------------------- |
| SanctionManager       | `sanctions/SanctionManager.ts` | ✅      |                       |
| Comandos ban/mute     | `commands/handlers/`           | ✅      |                       |
| Ban al join           | `PlayerJoinHandler`            | ✅      |                       |
| Panel sanciones web   | `SanctionsManager.tsx`         | ⚠️     | Requiere sala running |
| Mute / anti-spam chat | `PlayerChatHandler`            | ⚠️     |                       |


---

## G — Chat / comandos


| Sistema                  | Ubicación                     | Estado | Notas             |
| ------------------------ | ----------------------------- | ------ | ----------------- |
| ChatManager              | `chat-manager/ChatManager.ts` | ✅      |                   |
| CommandExecutor          | `commands/CommandExecutor.ts` | ✅      | ~18 comandos      |
| Comandos jugador         | handlers                      | ✅      | !help !list !afk !goleadores !asistidores… |
| Comandos admin/sanciones | handlers                      | ✅      | !login !ban…      |
| Comando !map             | —                             | ❌      | No registrado     |
| Powershot admin cmds     | `PowershotCommand.ts`         | ✅      |                   |
| Strings ES               | `shared/strings/`             | ✅      |                   |


---

## H — Gameplay in-game


| Sistema                | Ubicación                        | Estado | Notas            |
| ---------------------- | -------------------------------- | ------ | ---------------- |
| GameLoopController     | `gameloop/GameLoopController.ts` | ✅      | Cleanup en close |
| TrainingLoop           | `gameloop/TrainingLoop.ts`       | ✅      |                  |
| MatchLoop              | `gameloop/MatchLoop.ts`          | ✅      | stats lifecycle MatchLoop |
| BalanceManager JT/PRO  | `balance/BalanceManager.ts`      | ⚠️     | PROB-011         |
| PowershotManager       | `powershot/PowershotManager.ts`  | ⚠️     | PROB-026         |
| StadiumManager         | `stadiums/StadiumManager.ts`     | ✅      |                  |
| MatchManager equipos   | `teams/MatchManager.ts`          | ✅      | JSON en dist     |
| TeamsManager camisetas | `teams/TeamsManager.ts`          | ✅      |                  |
| MatchStatsManager      | `stats/MatchStatsManager.ts`     | ✅      | upsert PlayerStats + StatEvent al endMatch (DEPLOY-004) |
| BallTracker            | `stats/BallTracker.ts`           | ✅      |                  |


---

## I — Admin in-game


| Sistema           | Ubicación                       | Estado | Notas    |
| ----------------- | ------------------------------- | ------ | -------- |
| AdminManager      | `admin/AdminManager.ts`         | ✅      | login por identityId |
| PermissionManager | `commands/PermissionManager.ts` | ✅      | sin identidades temp |
| AdminPasswords BD | schema + EventManager           | ✅      | carga por `serverImageId` (DEPLOY-005) |
| Panel contraseñas | `AdminPasswordsManager.tsx`     | ✅      |          |


---

## J — Logging / webhooks


| Sistema           | Ubicación                         | Estado | Notas |
| ----------------- | --------------------------------- | ------ | ----- |
| Logger Winston    | `logger/Logger.ts`                | ✅      | JSON + stack OK beta |
| LoggerConfig      | `logger/LoggerConfig.ts`          | ✅      |       |
| WebhookManager    | `notifications/WebhookManager.ts` | ✅      |       |
| API webhooks core | `core/app.ts`                     | ✅      |       |
| Panel webhooks    | `GlobalConfigPage.tsx`            | ✅      |       |


---

## K — API Core (:3001)


| Endpoint / módulo        | Estado | Notas            |
| ------------------------ | ------ | ---------------- |
| GET /health              | ✅      |                  |
| /api/rooms               | ✅      | Token requerido  |
| /api/rooms/:ruid/players | ⚠️     | Rating hardcoded |
| /api/balance, debug      | ✅      |                  |
| /api/stadiums            | ✅      | Sin !map in-game |
| /api/teams, /api/matches | ✅      |                  |
| /api/powershot           | ✅      |                  |


---

## L — Web Backend (:3000)


| Módulo                     | Estado | Notas          |
| -------------------------- | ------ | -------------- |
| POST /api/auth/login       | ✅      | fallback `admin123` solo en dev |
| Proxy core                 | ✅      |                |
| Server Images              | ⚠️     | PROB-017, 021, 027 |
| Sanctions, teams, webhooks | ✅      |                |
| Debug DB                   | ✅      |                |
| JWT middleware             | ⚠️     | PROB-016       |


---

## M — Frontend / Panel


| Página                  | Estado | Notas               |
| ----------------------- | ------ | ------------------- |
| Login                   | ✅      |                     |
| **Server Images**       | ✅      | Execute OK en beta  |
| ServerImageConfigForm   | ✅      |                     |
| SanctionsManager        | ✅      |                     |
| PlayersPage             | ⚠️     | Datos API parciales |
| TeamsManager / Editor   | ✅      |                     |
| MatchesManager          | ⚠️     | PROB-008            |
| GlobalConfig / webhooks | ✅      |                     |
| BalanceDebugPage        | ✅      |                     |
| DatabaseDebug           | ✅      |                     |
| Dashboard / Navigation  | ✅      |                     |


---

## N — Build / deploy


| Item                | Estado | Notas            |
| ------------------- | ------ | ---------------- |
| npm run build       | ✅      | Sin db:setup     |
| npm run build:full  | ✅      | Incluye db:setup |
| deploy-linux.sh     | ✅      | root + systemd + verify (repo `aa465fd`) |
| npm run deploy:verify | ✅    | `scripts/verify-deploy.sh` |
| npm start (dev)     | ⚠️     | PROB-015         |
| npm run start:prod  | ✅      | Windows OK       |
| pm2:start + systemd | 🔧     | PROB-018 Linux; GCE requiere `pm2-root` |
| JSON assets en dist | ✅      |                  |


---

## Matriz operativa rápida


| Objetivo                 | Estado | PROB                    |
| ------------------------ | ------ | ----------------------- |
| Prender sala             | ✅      | OK post Chrome deps     |
| Join sin nick duplicado  | ✅      | —                       |
| Identidad jugador en cache | ✅      | PROB-022 cerrado — validar beta |
| Persistir stats partido  | ✅      | PROB-025 cerrado — validar en beta |
| Ban/mute                 | ✅      | —                       |
| Balance equipos          | ⚠️     | PROB-011                |
| Partido camisetas reales | ✅      | PROB-008 solo panel     |
| Admin sin auth Haxball   | ✅      | —                       |
| Panel sync estados       | ⚠️     | PROB-021                |
| Reiniciar tras apt-daily | ⚠️     | deploy systemd pendiente VM |


---

## Priorización

### Sprint 1 — Paridad sala legacy (cerrado 2026-06-22)

PROB-001, PROB-003, PROB-007, PROB-012 → ver `CHANGELOG.md`

### Sprint 2 — Panel y datos juego (en curso)

PROB-008, PROB-011

### Sprint 3 — Estabilidad runtime beta GCE (en curso)

**Stats prep (obligatorio antes de tops vNext):** DEPLOY-002 ✅ → **DEPLOY-003** (pendiente review) → implementación Fase 2 en [`docs/plans/stats-tops-vNext.md`](docs/plans/stats-tops-vNext.md)

**Orden agentes:**

1. **PROB-021** 🟠 — sync-states 415
2. **PROB-026** 🟡 — Powershot shutdown race
3. **PROB-027** 🟠 — orphan Server Image

### Backlog

PROB-015, PROB-016, PROB-017, PROB-018, PROB-019, PROB-020

### Diferido (no implementar ahora)

**Cuentas jugador `!register` / `!login`** — nick inestable en Haxball público. Plan: `[docs/plans/DEFERRED-player-accounts.md](docs/plans/DEFERRED-player-accounts.md)`.

**Webhooks sociales / replays Discord** — solo strings legacy; no implementado. Ver strings `onStop.feedSocialDiscordWebhook`.

**Stats tops vNext (`!goleadores` / `!asistidores` día·semana·mes)** — ✅ DEPLOY-004 implementado. Validar en beta con seed `scripts/debugging_scripts/seed-stats-tops.ts`. Plan: [`docs/plans/stats-tops-vNext.md`](docs/plans/stats-tops-vNext.md).

---

## Documentación del proyecto


| Archivo                                | Uso                                             |
| -------------------------------------- | ----------------------------------------------- |
| **SystemStatus.md**                    | Estado actual + PROBs **activos** + subsistemas |
| **CHANGELOG.md**                       | Historial + PROBs **cerrados**                  |
| AGENTS.md                              | Reglas de trabajo para agentes                  |
| README.md                              | Inicio rápido                                   |
| DEPLOYMENT.md                          | Build y producción                              |
| docs/BETA-GCE.md                       | Checklist VM + incidentes                       |
| docs/LOGGING.md                        | Formato logs + comandos                         |
| docs/COMANDOS_SISTEMA.md               | Comandos in-game                                |
| docs/plans/DEFERRED-player-accounts.md | Plan diferido — auth estilo Minecraft           |
| HUMAN_TODO_LIST_NOT_FOR_IA.md          | Solo humano                                     |

