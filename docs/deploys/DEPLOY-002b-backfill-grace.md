# DEPLOY-002b — Backfill spam fix (regresión PROB-022)

| Campo | Valor |
|-------|-------|
| **Estado** | APROBADO |
| **Depende de** | DEPLOY-002 APROBADO |
| **Bloquea** | DEPLOY-004 |

---

## Síntoma

Spam en consola:
`Missing required fields: conn or name` → `backfillPlayer` → `forceRefresh` → `BalanceManager`

Jugador `Btw#2`: `hasConn: false` desde `getCurrentPlayers()`. Join handler eventualmente OK.

## Fix requerido

1. `backfillPlayer`: **skip silencioso** si falta `conn` o `name` (no llamar `identifyPlayer`, no log error).
2. Mantener grace 5s existente para warns.
3. Opcional: skip backfill si `pendingBackfill` o join en curso (PlayerJoinHandler processing).
4. No tocar BalanceManager salvo necesidad mínima.

## Archivos permitidos

- `core/src/shared/player/PlayerCacheManager.ts`
- `SystemStatus.md` (nota si aplica)
- `CHANGELOG.md` (entrada historial opcional — regresión fix)

## Verificar

- `npm run build` core + monorepo
- Handoff completo

## Handoff — Worker

- **Agente / turno:** worker subagent — DEPLOY-002b
- **PROBs tocados:** PROB-022 (regresión backfill spam)
- **Archivos modificados:** `core/src/shared/player/PlayerCacheManager.ts`
- **Qué cambió (1–3 oraciones):** `backfillPlayer` ahora retorna `false` en silencio (solo `logger.debug`) si `conn` o `name` están vacíos/ausentes, sin llamar a `identifyPlayer`. Se mantienen el guard `pendingBackfill`, grace 5s en `forceRefresh` y el warn post-grace sin cambios.
- **Build:** OK (`npm run build` — 4/4 packages, core recompilado)
- **Gate:** FAIL (bash/WSL no disponible en Windows; build + handoff verificados manualmente)
- **Riesgos / no tocado:** BalanceManager sin cambios; join handler sigue siendo la vía principal de identidad; jugadores sin conn/name en `getCurrentPlayers()` esperan al siguiente refresh o join.
- **Listo para review coordinador:** sí
