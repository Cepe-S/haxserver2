# DEPLOY-006B — GameLoop debug API + UI

| Campo | Valor |
|-------|-------|
| **Estado** | IMPLEMENTADO (runtime pendiente token) |
| **Sprint** | Debug vNext · Fase 2 |
| **Worker** | (asignar) |
| **PROB** | PROB-032 |
| **Padre** | [DEPLOY-006](DEPLOY-006-debug-sprint.md) |

---

## Objetivo

Alinear debug de **GameLoop / Balance / Match** entre API y `BalanceDebugPage` para diagnosticar transiciones sin entrar al juego.

## Análisis previo

| Problema | Evidencia |
|----------|-----------|
| UI ignora `?ruid=` | Siempre llama `/api/debug/gameloop` global |
| Stats vacías en UI | API devuelve `loopActivations`; UI espera `{ training, match }` |
| Mejor fuente por sala | `GET /api/rooms/:ruid/balance-debug` ya existe en core |

## PROBs en scope

| PROB | Objetivo |
|------|----------|
| **PROB-032** | UI ruid-aware; stats coherentes; proxy web si falta |

## Archivos permitidos

- `core/src/api/routes/debug.ts`
- `core/src/shared/gameloop/GameLoopController.ts`
- `core/src/api/routes/balance.ts`
- `web/backend/src/server.ts` (proxy `/api/rooms/:ruid/balance-debug-state` si hace falta)
- `web/frontend/src/pages/BalanceDebugPage.tsx`
- `SystemStatus.md` / `CHANGELOG.md` al cerrar

## Prohibido

- Cambiar lógica de transición de loops (solo observabilidad)
- Auth extra

## Especificación técnica

1. **`BalanceDebugPage`**: leer `ruid` de query string; si hay ruid → `GET /api/rooms/:ruid/balance-debug`; si no → fallback global gameloop.
2. **`GameLoopController.getStats()`**: normalizar respuesta para UI:
   ```ts
   { training: { activations, totalTime }, match: { activations, totalTime, matchesPlayed } }
   ```
   Derivar de `transitionHistory` + contadores existentes (mínimo diff).
3. Mostrar en UI: `isTransitioning`, historial transiciones, partido actual (stadium, time/score limits).
4. Proxy web para endpoints por-ruid que el frontend necesite y no estén proxyeados.

## Criterios de cierre

- [ ] Con sala running y `?ruid=pito`, panel muestra datos reales
- [ ] Sección Statistics muestra números no vacíos tras 1 transición manual
- [ ] POST transition sigue funcionando desde UI
- [ ] `npm run build` OK

## Handoff — Worker

- **Core:** `GameLoopController.getStats()` → `{ training, match }`
- **UI:** `BalanceDebugPage` lee `?ruid=` y usa `/api/rooms/:ruid/balance-debug`
- **Build:** OK

---

## Review — Coordinador

- **Veredicto:** PENDIENTE
