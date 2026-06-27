# DEPLOY-003 — Stats identity stability

| Campo | Valor |
|-------|-------|
| **Estado** | APROBADO |
| **Sprint** | Sprint 3 — Stats prep |
| **Worker** | (asignar tras DEPLOY-002) |
| **Coordinador** | Auto |
| **Creado** | 2026-06-26 |
| **Depende de** | DEPLOY-002 APROBADO |

---

## Objetivo

Estabilizar identidad y init de stats para que goles/asistencias se atribuyan siempre al jugador correcto.

## PROBs en scope

| PROB | Severidad | Objetivo |
|------|-----------|----------|
| PROB-023 | 🟠 | Rejoin sin leave — identity/connection consistente |
| PROB-025 | 🟡 | Doble `initializePlayer` — idempotente sin warn spam |

## Archivos permitidos

- `core/src/shared/player/PlayerIdentityManager.ts`
- `core/src/shared/events/handlers/PlayerJoinHandler.ts`
- `core/src/shared/events/handlers/PlayerLeaveHandler.ts`
- `core/src/shared/stats/MatchStatsManager.ts`
- `SystemStatus.md`
- `CHANGELOG.md`

## Prohibido

- gameLoop, EventBus, web/, schema Prisma (salvo orden explícita), features tops, commits

## Criterios de cierre

- [x] PROB-023 cerrado o progreso documentado
- [x] PROB-025 cerrado (init idempotente)
- [x] `npm run build` OK (core)
- [x] Handoff completo

## Contexto

Stats dependen de `identityId` estable. PROB-023: 4× `joined without proper leave`. PROB-025: 54× `Player already initialized` — `initializePlayer` debe ser no-op silencioso o actualizar haxballId si reconnect mismo identity.

---

## Handoff — Worker

- **Agente / turno:** deploy worker subagent (DEPLOY-003)
- **PROBs tocados:** PROB-023, PROB-025
- **Archivos modificados:**
  - `core/src/shared/player/PlayerIdentityManager.ts`
  - `core/src/shared/stats/MatchStatsManager.ts`
  - `core/src/shared/events/handlers/PlayerLeaveHandler.ts`
  - `SystemStatus.md`
  - `CHANGELOG.md`
- **Qué cambió (1–3 oraciones):** `createGameConnection` reutiliza la fila activa en rejoin (actualiza haxballId/name/geo) en lugar de warn+close+create. `initializePlayer` es idempotente por `identityId` — preserva stats y actualiza haxballId/name silenciosamente. `PlayerLeaveHandler` cierra conexiones por conn, haxballId o identityId del cache.
- **Build:** OK (`core`: `tsc && copy-data`)
- **Gate:** SKIP (bash gate no ejecutado en Windows worker)
- **Riesgos / no tocado:** Validación en beta GCE pendiente; gameLoop/EventBus/web sin cambios; gate script no corrido en Windows.
- **Listo para review coordinador:** sí

---

## Review — Coordinador

- **Veredicto:** APROBADO
- **Notas:** Scope respetado. Rejoin refresh e init idempotente son fixes mínimos alineados con stats tops. `PlayerLeaveHandler` justificado para PROB-023. Gate pendiente en Linux antes de deploy VM.
- **Siguiente deploy:** DEPLOY-004 — Stats tops Fase 2 (`StatEvent`, `!goleadores`, seed script)
