# Plan — Stats tops vNext (`!goleadores` / `!asistidores`)

**Estado:** PREP — deploys de agentes antes de implementación  
**Objetivo humano:** tops diarios, semanales y mensuales visibles en chat Haxball  
**Comando target:** `!goleadores {dia|semana|mes|global}` · `!asistidores {…}` (mismo patrón)

---

## Fase 0 — Estabilizar pipeline de stats (deploys agentes)

| Deploy | PROB | Por qué bloquea stats |
|--------|------|------------------------|
| DEPLOY-001 | PROB-028, PROB-024 | ✅ APROBADO — gameLoop + lifecycle partido |
| **DEPLOY-002** | PROB-022 | Cache sin identity → `recordGoal` falla (646× warn) |
| **DEPLOY-003** | PROB-023, PROB-025 | Identity/rejoin incorrecta; doble init en partido |
| DEPLOY-004 | validación beta | Confirmar `STATS SAVED` en logs GCE post-fix |

**No implementar Fase 1 hasta DEPLOY-002 + DEPLOY-003 APROBADOS.**

---

## Fase 1 — Análisis código existente (2026-06-26)

### Qué hay hoy

| Pieza | Ubicación | Estado |
|-------|-----------|--------|
| Tracking in-match | `MatchStatsManager.ts` | ✅ Map in-memory por `identityId`; upsert a BD en `endMatch` |
| Goleador/asistente | `BallTracker.ts` + `GameEventHandlers.handleTeamGoal` | ✅ Stack de toques → `recordGoal`/`recordAssist` |
| Init jugador en partido | `PlayerJoinHandler` → `initializePlayer` | ⚠️ PROB-025 doble init |
| Resolución haxballId→identity | `PlayerCacheManager` | ⚠️ PROB-022 desync |
| Modelo BD acumulado | `PlayerStats` (goals, assists, totals…) | ✅ Lifetime por `ruid+playerId` |
| Modelo BD por período | — | ❌ **No existe** |
| Comando `!goleadores` | `strings/index.ts` solo | ❌ No registrado en `PlayerChatHandler` |
| Comando `!asistidores` | strings legacy | ❌ No implementado |
| Comando `!stats` | strings + TODO en `ChatManager` | ❌ No implementado |
| API tops | `players.ts` stats agregados | ⚠️ Solo lifetime, sin período |
| Script debug seed | — | ❌ Crear en Fase 2 |

### ¿Reutilizar o empezar de cero?

**Recomendación: EXTENDER, no rehacer.**

| Reutilizar | Motivo |
|------------|--------|
| `MatchStatsManager` | Pipeline partido→BD ya funciona tras PROB-024 |
| `BallTracker` | Lógica goleador/asistente probada en legacy |
| `PlayerStats` | Totales lifetime + rating futuro |
| `PlayerIdentity` + cache | Tops deben ser por identity, no nick |
| Patrón comandos (`AboutCommand`, `ListCommand`) | Registro en `PlayerChatHandler` |

| Agregar (nuevo) | Motivo |
|-----------------|--------|
| Tabla **`StatEvent`** (o `PlayerStatEvent`) | `{ identityId, ruid, type: goal\|assist, recordedAt }` — única forma fiable de tops por período |
| **`LeaderboardService`** | Queries día/semana/mes con Prisma + groupBy/count |
| **`GoleadoresCommand`** / **`AsistidoresCommand`** | Chat in-game |
| **`scripts/debugging_scripts/seed-stats-tops.ts`** | Poblar identities + events para QA |

**No conviene empezar de cero** porque:
- El 80% del pipeline ingest (gol → cache → identity → persist) ya está cableado
- Rehacer implicaría duplicar `BallTracker`, `MatchLoop` integration y riesgo gameLoop
- `PlayerStats` acumulado sigue útil para `!stats` lifetime

**Limitación actual:** `PlayerStats` solo tiene contadores incrementales sin timestamp → **imposible** calcular top diario/semanal/mensual sin nueva tabla de eventos (o snapshots por partido con `playedAt`).

### Diseño propuesto Fase 2 (post-prep)

```prisma
model StatEvent {
  id         String   @id @default(cuid())
  ruid       String
  identityId String
  type       String   // goal | assist
  recordedAt DateTime @default(now())

  identity   PlayerIdentity @relation(...)

  @@index([ruid, type, recordedAt])
  @@index([identityId, recordedAt])
}
```

En `MatchStatsManager.savePlayerStats`: además del upsert a `PlayerStats`, insertar N filas `StatEvent` por gol/asistencia del partido (o insertar en tiempo real en `recordGoal` — preferir **al persistir partido** para atomicidad).

Comando:
```
!goleadores          → top global (PlayerStats o all-time events)
!goleadores dia      → StatEvent últimas 24h
!goleadores semana   → 7 días
!goleadores mes      → 30 días
```

---

## Fase 2 — Implementación (después de prep)

1. Schema `StatEvent` + migrate
2. `LeaderboardService` + tests query
3. `GoleadoresCommand` / `AsistidoresCommand`
4. `scripts/debugging_scripts/seed-stats-tops.ts`
5. PROB-029 cierre + doc COMANDOS_SISTEMA.md

---

## Fase 3 — Validación

- Script seed → `!goleadores dia` muestra top esperado
- Partido real beta → eventos en BD + top actualizado
- Sin regresión gameLoop (prioridad máxima)

---

## Referencias

- `SystemStatus.md` Sprint 3 + PROB-029
- `docs/deploys/README.md`
- `docs/COMANDOS_SISTEMA.md` (strings legacy)
