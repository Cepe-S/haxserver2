# DEPLOY-006D — Events + MatchStats debug

| Campo | Valor |
|-------|-------|
| **Estado** | IMPLEMENTADO (runtime pendiente token) |
| **Sprint** | Debug vNext · Fase 3 |
| **Worker** | (asignar) |
| **PROB** | PROB-034 |
| **Padre** | [DEPLOY-006](DEPLOY-006-debug-sprint.md) |

---

## Objetivo

Exponer debug de **EventBus**, **match actions** y **MatchStatsManager** en API + UI (pestañas en Debug Hub o Balance Debug).

## Análisis previo

| Pieza | Estado |
|-------|--------|
| `GET /api/rooms/:ruid/events` | ✅ core — sin proxy web ni UI |
| `logMatchDebugAction` | TODO — solo `logger.debug` |
| `MatchStatsManager.getMappingState()` | Sin endpoint |
| `GET /api/debug/status` | Bug: `haxballRoom.playerCache` puede no existir |

## PROBs en scope

| PROB | Objetivo |
|------|----------|
| **PROB-034** | Ring buffer match debug; endpoints stats/events; UI |

## Archivos permitidos

- `core/src/shared/events/handlers/GameEventHandlers.ts`
- `core/src/shared/stats/MatchStatsManager.ts`
- `core/src/api/routes/debug.ts`
- `core/src/haxball/HaxballRoom.ts` (getters expuestos si hace falta)
- `web/backend/src/server.ts` (proxy `/api/rooms/:ruid/events`)
- `web/frontend/src/pages/DebugHubPage.tsx` OR `BalanceDebugPage.tsx` (pestaña Events/Stats — **solo uno**, coordinar con 006A/006B)
- `SystemStatus.md` / `CHANGELOG.md` al cerrar

## Prohibido

- Duplicar stats pipeline / listeners EventBus
- Auth extra

## Especificación técnica

1. **Match debug ring buffer** (últimos 100 eventos):
   - `{ timestamp, action, playerName, details }`
   - `GET /api/debug/match-log` o incluir en gameloop debug payload
2. **`GET /api/rooms/:ruid/stats-debug`**: mapping haxballId→identityId, `isMatchActive`, players initialized
3. **Proxy web** para `/api/rooms/:ruid/events`
4. **UI**: sección "Event listeners" (count por evento) + "Match log" + "Stats mapping"
5. Fix `debug/status`: usar `PlayerCacheManager.getInstance()` en lugar de `haxballRoom.playerCache`

## Criterios de cierre

- [ ] Tras un goal en sala, match log muestra `TEAM_GOAL` en API/UI
- [ ] Event listener counts visibles (detectar duplicados post PROB-028)
- [ ] `npm run build` OK

## Handoff — Worker

- **Core:** `MatchDebugLog` ring buffer; `GET /api/debug/match-log`; `GET /api/rooms/:ruid/stats-debug`; fix `/api/debug/status` (PlayerCacheManager)
- **Web:** proxy events/stats-debug/match-log en `server.ts` + `routes/debug.ts`
- **UI:** Debug Hub — event listeners, stats mapping, match log por ruid

---

## Review — Coordinador

- **Veredicto:** PENDIENTE
