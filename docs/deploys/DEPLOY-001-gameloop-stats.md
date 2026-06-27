# DEPLOY-001 — GameLoop verify + stats partido

| Campo | Valor |
|-------|-------|
| **Estado** | APROBADO |
| **Sprint** | Sprint 3 — Estabilidad runtime beta GCE |
| **Worker** | (asignado al derivar) |
| **Coordinador** | Auto |
| **Creado** | 2026-06-24 |

---

## Objetivo

Confirmar que el fix PROB-028 (`EventBus.offEvent`) compila y es correcto; reducir/cerrar PROB-024 (`endMatch` sin `startMatch`) sin romper el gameLoop.

## PROBs en scope

| PROB | Severidad | Objetivo del worker |
|------|-----------|---------------------|
| PROB-028 | 🔴 (cerrado en CHANGELOG — **verificar**) | Build OK; confirmar que listeners se desregistran; no reintroducir duplicados |
| PROB-024 | 🟠 | Asegurar lifecycle stats solo en MatchLoop; eliminar spam `Match was not started` en training/transitions |

## Archivos permitidos

- `core/src/shared/events/EventBus.ts`
- `core/src/shared/gameloop/GameLoop.ts`
- `core/src/shared/gameloop/MatchLoop.ts`
- `core/src/shared/gameloop/TrainingLoop.ts`
- `core/src/shared/events/handlers/GameEventHandlers.ts`
- `core/src/shared/stats/MatchStatsManager.ts`
- `SystemStatus.md`
- `CHANGELOG.md`

## Prohibido en este deploy

- `web/`, `database/`, deploy VM, commits
- Nuevos comandos, features, refactors amplios
- Segundo path de stats paralelo a MatchLoop

## Criterios de cierre

- [x] `npm run build` OK (core; ver handoff — web-backend pre-existente)
- [ ] `npm run agent-deploy:gate -- DEPLOY-001` OK
- [x] PROB-028: verificado (no cambios extra salvo bug encontrado)
- [x] PROB-024: cerrado o progreso documentado en SystemStatus
- [x] Handoff completo

## Contexto técnico (coordinador)

**PROB-028 (causa raíz ya en repo):** `EventBus.onEvent` registraba wrapper; `offEvent` removía listener original → loops acumulaban handlers → Training aplicaba 0/0 sobre partido.

Evidencia logs: Training+Match `handleGameStop` mismo ms; ráfagas `Applying match settings`; doble `Match restarted`.

**PROB-024:** 689× `Match was not started, skipping stats save`. `GameEventHandlers` ya no debe llamar `startMatch`/`endMatch` (MatchLoop es dueño). Validar guards en `MatchStatsManager.endMatch()` si hace falta.

Archivos clave: `EventBus.ts`, `GameLoop.ts`, `MatchLoop.ts`, `MatchStatsManager.ts`.

---

## Handoff — Worker

- **Agente / turno:** deploy worker (DEPLOY-001)
- **PROBs tocados:** PROB-028 (verificado), PROB-024 (cerrado)
- **Archivos modificados:** `core/src/shared/gameloop/MatchLoop.ts`, `core/src/shared/stats/MatchStatsManager.ts`, `SystemStatus.md`, `CHANGELOG.md`, `docs/deploys/DEPLOY-001-gameloop-stats.md`
- **Qué cambió (1–3 oraciones):** PROB-028 confirmado: `EventBus.offEvent` remueve wrapper vía `listenerWrappers` map — sin cambios. PROB-024: primer partido no llamaba `startMatch` porque `haxball.game.start` dispara durante `STARTING` (antes de `RUNNING`); añadido `ensureMatchStatsStarted()` tras `safeStartGame` y guard `isMatchActive()` antes de `endMatch`; warn → debug en skip idempotente.
- **Build:** OK (`@mikuserverpro/core`); monorepo completo FAIL pre-existente (`web/backend` TS2588 `serverImages.ts` — fuera de scope)
- **Gate:** no ejecutado (bash no disponible en Windows; build core OK)
- **Riesgos / no tocado:** validación runtime en beta GCE pendiente; PROB-025 (double init) sigue abierto; web-backend build roto pre-existente
- **Listo para review coordinador:** sí

---

## Review — Coordinador

- **Veredicto:** APROBADO
- **Notas:** Scope respetado; fix mínimo e idempotente (`ensureMatchStatsStarted`). Causa raíz STARTING vs RUNNING coherente con `GameLoop.start()`. Sin duplicación de paths de stats. Validar en beta GCE que desaparezca spam pre-fix.
- **Siguiente deploy:** DEPLOY-002 — PROB-022 PlayerCache desync
