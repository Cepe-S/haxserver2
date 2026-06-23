# SystemStatus — MikuServerPro

**Última actualización:** 2026-06-22  
**Codebase activo:** `haxserver2/` (MikuServerPro — único proyecto en el repo)  
**Changelog / PROBs cerrados:** `[CHANGELOG.md](./CHANGELOG.md)`  
**Próximo ID libre:** `PROB-021`

---

## ⚠️ REGLAS OBLIGATORIAS PARA AGENTES

Leer **antes** de codear. Actualizar en el **mismo turno**:


| Acción                                | Dónde                                                                                                                                     |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Arreglar un bug (PROB-xxx)            | **Quitar** fila de [Problemas activos](#problemas-activos); actualizar filas del subsistema (A–N); **registrar** cierre en `CHANGELOG.md` |
| Progreso parcial (PROB sigue abierto) | Actualizar fila del PROB y subsistema en este archivo                                                                                     |
| Nuevo problema                        | Crear `PROB-021+` en tabla activa                                                                                                         |
| Cambiar prioridad / sprint            | Sección [Priorización](#priorización)                                                                                                     |
| Cualquier cambio de código verificado | Entrada en `CHANGELOG.md` (historial)                                                                                                     |


**Prohibido:** PROBs resueltos en la tabla activa · changelog en este archivo · cerrar turno con código cambiado sin actualizar docs.

**Alcance:** solo fixes y estabilidad; sin features ni seguridad extra salvo orden humana.

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

## Resumen ejecutivo


| Grupo                   | Sistemas | ✅   | ⚠️  | ❌   | 🔧  |
| ----------------------- | -------- | --- | --- | --- | --- |
| A — Infraestructura     | 7        | 5   | 1   | 0   | 1   |
| B — Base de datos       | 8        | 6   | 2   | 0   | 0   |
| C — Motor Haxball       | 6        | 4   | 2   | 0   | 0   |
| D — Eventos / lifecycle | 5        | 4   | 1   | 0   | 0   |
| E — Identidad jugadores | 7        | 5   | 1   | 1   | 0   |
| F — Moderación          | 5        | 3   | 2   | 0   | 0   |
| G — Chat / comandos     | 7        | 5   | 1   | 1   | 0   |
| H — Gameplay in-game    | 10       | 8   | 2   | 0   | 0   |
| I — Admin in-game       | 4        | 3   | 1   | 0   | 0   |
| J — Logging / webhooks  | 5        | 5   | 0   | 0   | 0   |
| K — API Core            | 8        | 8   | 0   | 0   | 0   |
| L — Web Backend         | 10       | 9   | 1   | 0   | 0   |
| M — Frontend / Panel    | 13       | 10  | 2   | 1   | 0   |
| N — Build / deploy      | 6        | 4   | 1   | 0   | 1   |


**Build:** ✅ `npm run build` OK · **8 PROBs activos**

---

## Problemas activos


| ID       | Sev | Descripción breve                                          | Archivos clave                                       |
| -------- | --- | ---------------------------------------------------------- | ---------------------------------------------------- |
| PROB-008 | 🟠  | UI partidos solo lectura (Edit sin handler)                | `MatchesManager.tsx`                                 |
| PROB-011 | 🟠  | Balance PRO rating=1000 fijo                               | `BalanceManager.ts`                                  |
| PROB-015 | 🟡  | `npm start` rebuild lento (mejorado: `build` sin db:setup) | `package.json`                                       |
| PROB-016 | 🟡  | Auth web permisiva en varios endpoints                     | `web/backend/server.ts`                              |
| PROB-017 | 🟡  | Token Haxball manual cada execute                          | `serverImages.ts`                                    |
| PROB-018 | 🟡  | PM2 solo Linux                                             | `ecosystem.config.js`                                |
| PROB-019 | 🟡  | Cleanup Chrome agresivo al startup                         | `core/app.ts`                                        |
| PROB-020 | 🟡  | SQLite compartido core+web                                 | `DatabaseManager.ts`                                 |


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
| PM2 producción       | `ecosystem.config.js`       | 🔧     | PROB-018                      |
| Graceful shutdown    | `core/app.ts`               | ✅      | Loops + EventManager en close |


---

## B — Base de datos


| Sistema               | Ubicación               | Estado | Notas                     |
| --------------------- | ----------------------- | ------ | ------------------------- |
| Prisma + SQLite       | `database/prisma/`      | ✅      |                           |
| DatabaseManager       | `database/src/`         | ✅      | PROB-020                  |
| Setup / seed          | `database/src/setup.ts` | ✅      | `npm run db:setup` manual |
| ServerImage model     | schema                  | ✅      |                           |
| PlayerIdentity / Name | schema                  | ✅      | unique identityId+name    |
| PlayerSanction        | schema                  | ✅      |                           |
| PlayerPermission      | schema                  | ✅      | lookup por identityId     |
| Concurrencia SQLite   | core + web              | ⚠️     | PROB-020                  |


---

## C — Motor Haxball


| Sistema                | Ubicación                     | Estado | Notas                      |
| ---------------------- | ----------------------------- | ------ | -------------------------- |
| HaxballRoom lifecycle  | `core/haxball/HaxballRoom.ts` | ✅      | Init post trainingReady    |
| Creación sala + token  | `createRoom()`                | ⚠️     | PROB-017; Chrome/Puppeteer |
| Estadios embebidos     | `StadiumManager`              | ✅      |                            |
| Browser event adapter  | `setupHaxballEvents`          | ✅      |                            |
| Cleanup Chrome startup | `app.ts`                      | ⚠️     | PROB-019                   |
| Geolocalización join   | `GeoLocationService`          | ✅      | Timeout 3s                 |


---

## D — Eventos / lifecycle


| Sistema                    | Ubicación                | Estado | Notas                    |
| -------------------------- | ------------------------ | ------ | ------------------------ |
| EventBus                   | `events/EventBus.ts`     | ✅      |                          |
| EventManager               | `events/EventManager.ts` | ✅      | resetInstance en close   |
| Handlers Haxball (~20)     | `events/handlers/`       | ✅      |                          |
| Server Images execute/stop | `routes/serverImages.ts` | ✅      | 1 sala max               |
| Auto-sync web startup      | `serverImages.ts`        | ⚠️     | Fallo silencioso posible |


---

## E — Identidad jugadores


| Sistema               | Ubicación                         | Estado | Notas              |
| --------------------- | --------------------------------- | ------ | ------------------ |
| PlayerIdentityManager | `player/PlayerIdentityManager.ts` | ✅      | upsert PlayerName         |
| PlayerJoinHandler     | `handlers/PlayerJoinHandler.ts`   | ✅      | kick `|,|` + nick dup     |
| PlayerLeaveHandler    | `handlers/PlayerLeaveHandler.ts`  | ✅      |                    |
| PlayerCacheManager    | `player/PlayerCacheManager.ts`    | ✅      | `isNicknameTaken`         |
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
| Comandos jugador         | handlers                      | ✅      | !help !list !afk… |
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
| MatchLoop              | `gameloop/MatchLoop.ts`          | ✅      | endMatch en gameStop |
| BalanceManager JT/PRO  | `balance/BalanceManager.ts`      | ⚠️     | PROB-011         |
| PowershotManager       | `powershot/PowershotManager.ts`  | ✅      |                  |
| StadiumManager         | `stadiums/StadiumManager.ts`     | ✅      |                  |
| MatchManager equipos   | `teams/MatchManager.ts`          | ✅      | JSON en dist     |
| TeamsManager camisetas | `teams/TeamsManager.ts`          | ✅      |                  |
| MatchStatsManager      | `stats/MatchStatsManager.ts`     | ✅      | upsert PlayerStats   |
| BallTracker            | `stats/BallTracker.ts`           | ✅      |                  |


---

## I — Admin in-game


| Sistema           | Ubicación                       | Estado | Notas    |
| ----------------- | ------------------------------- | ------ | -------- |
| AdminManager      | `admin/AdminManager.ts`         | ✅      | login por identityId |
| PermissionManager | `commands/PermissionManager.ts` | ✅      | sin identidades temp |
| AdminPasswords BD | schema + EventManager           | ✅      |          |
| Panel contraseñas | `AdminPasswordsManager.tsx`     | ✅      |          |


---

## J — Logging / webhooks


| Sistema           | Ubicación                         | Estado | Notas |
| ----------------- | --------------------------------- | ------ | ----- |
| Logger Winston    | `logger/Logger.ts`                | ✅      |       |
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
| POST /api/auth/login       | ✅      |                |
| Proxy core                 | ✅      |                |
| Server Images              | ✅      | PROB-017 token |
| Sanctions, teams, webhooks | ✅      |                |
| Debug DB                   | ✅      |                |
| JWT middleware             | ⚠️     | PROB-016       |


---

## M — Frontend / Panel


| Página                  | Estado | Notas               |
| ----------------------- | ------ | ------------------- |
| Login                   | ✅      |                     |
| **Server Images**       | ✅      | Flujo principal     |
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
| npm start (dev)     | ⚠️     | PROB-015         |
| npm run start:prod  | ✅      | Windows OK       |
| pm2:start           | 🔧     | PROB-018         |
| JSON assets en dist | ✅      |                  |


---

## Matriz operativa rápida


| Objetivo                 | Estado | PROB                    |
| ------------------------ | ------ | ----------------------- |
| Prender sala             | ⚠️     | PROB-017 + Chrome/token |
| Join sin nick duplicado  | ✅      | —                       |
| Ban/mute                 | ✅      | —                       |
| Balance equipos          | ⚠️     | PROB-011                |
| Partido camisetas reales | ✅      | PROB-008 solo panel     |
| Admin sin auth Haxball   | ✅      | —                       |
| Reiniciar sala estable   | ⚠️     | Smoke test pendiente    |


---

## Priorización

### Sprint 1 — Paridad sala legacy (cerrado 2026-06-22)

PROB-001, PROB-003, PROB-007, PROB-012 → ver `CHANGELOG.md`

### Sprint 2 — Panel y datos juego (en curso)

PROB-008, PROB-011

### Backlog

PROB-015, PROB-016, PROB-017, PROB-018, PROB-019, PROB-020

### Diferido (no implementar ahora)

**Cuentas jugador `!register` / `!login`** — nick inestable en Haxball público. Plan guardado: `[docs/plans/DEFERRED-player-accounts.md](docs/plans/DEFERRED-player-accounts.md)`. Retomar solo en server privado o política de nicks fijos.

---

## Documentación del proyecto


| Archivo                                | Uso                                             |
| -------------------------------------- | ----------------------------------------------- |
| **SystemStatus.md**                    | Estado actual + PROBs **activos** + subsistemas |
| **CHANGELOG.md**                       | Historial + PROBs **cerrados**                  |
| AGENTS.md                              | Reglas de trabajo para agentes                  |
| README.md                              | Inicio rápido                                   |
| DEPLOYMENT.md                          | Build y producción                              |
| docs/COMANDOS_SISTEMA.md               | Comandos in-game                                |
| docs/plans/DEFERRED-player-accounts.md | Plan diferido — auth estilo Minecraft           |
| HUMAN_TODO_LIST_NOT_FOR_IA.md          | Solo humano                                     |


