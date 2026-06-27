# DEPLOY-002 — PlayerCache desync

| Campo | Valor |
|-------|-------|
| **Estado** | APROBADO |
| **Sprint** | Sprint 3 — Estabilidad runtime beta GCE |
| **Worker** | (asignar al derivar) |
| **Coordinador** | Auto |
| **Creado** | 2026-06-26 |

---

## Objetivo

Eliminar o reducir drásticamente `Player X in room but not in cache` (646× en beta). **Crítico para stats:** sin cache, `MatchStatsManager.recordGoal` no resuelve identity.

## PROBs en scope

| PROB | Severidad | Objetivo del worker |
|------|-----------|---------------------|
| PROB-022 | 🔴 | Sincronizar PlayerCache con jugadores reales en sala Haxball al join y en polling |

## Archivos permitidos

- `core/src/shared/player/PlayerCacheManager.ts`
- `core/src/shared/events/handlers/PlayerJoinHandler.ts`
- `core/src/haxball/HaxballRoom.ts` (solo polling identidad / sync cache)
- `core/src/shared/player/PlayerIdentityManager.ts` (solo si necesario para join path)
- `SystemStatus.md`
- `CHANGELOG.md`

## Prohibido en este deploy

- `web/`, `database/` schema changes, gameLoop, stats, commits, deploy VM
- Features (!register, etc.)

## Criterios de cierre

- [x] Fix mínimo con causa raíz documentada en handoff
- [x] `npm run build` OK (core)
- [x] Handoff completo
- [x] PROB-022 cerrado o progreso parcial en SystemStatus

## Contexto técnico (coordinador)

646× warn en `core-app.log`: jugador visible en sala Haxball pero ausente en PlayerCache cuando identidad/polling corre.

Archivos clave listados en SystemStatus PROB-022. No tocar EventBus/gameLoop salvo que sea la causa directa (poco probable).

---

## Handoff — Worker

- **Agente / turno:** Worker subagent · DEPLOY-002 · 2026-06-26
- **PROBs tocados:** PROB-022 (cerrado)
- **Archivos modificados:** `core/src/shared/player/PlayerCacheManager.ts`, `core/src/haxball/HaxballRoom.ts`, `SystemStatus.md`, `CHANGELOG.md`
- **Qué cambió (1–3 oraciones):** Causa raíz: `BalanceManager.onPlayerJoin` llama `forceRefresh()` antes de que `PlayerJoinHandler` termine `identifyPlayer` + `updatePlayer`, dejando jugadores en sala sin entrada en cache. Fix: `forceRefresh` ahora hace backfill vía `PlayerIdentityManager.identifyPlayer` + `updatePlayer` para jugadores faltantes; warn solo tras grace de 5s si el backfill falla. `HaxballRoom` registra `ruid` en cache al init.
- **Build:** OK (core `npm run build`) — monorepo completo falla por TS preexistente en `web/backend/serverImages.ts` (fuera de scope)
- **Gate:** no ejecutado (bash no disponible en Windows host; core build verificado manualmente)
- **Riesgos / no tocado:** validación en beta GCE pendiente; posible doble `identifyPlayer` concurrente con join handler (mitigado por guard en `PlayerIdentityManager`); `web/` sin tocar
- **Listo para review coordinador:** sí

---

## Review — Coordinador

- **Veredicto:** APROBADO
- **Notas:** Causa raíz race join/refresh bien identificada. Backfill idempotente + grace 5s es fix mínimo sin tocar gameLoop. Scope respetado (2 archivos core + docs).
- **Siguiente deploy:** DEPLOY-003 — PROB-023, PROB-025
