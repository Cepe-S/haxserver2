# Plan — Estadio dinámico por jugadores + votación !mapa

**Coordinador:** DEPLOY-007 · **Próximo PROB:** 036–040

---

## Objetivo

Elegir automáticamente el estadio acorde a la cantidad de jugadores en cancha (red+blue), avisar cuando el mapa no calza, y permitir **!mapa** para votar un cambio que **cierra el partido actual** (stats persistidas) y arranca uno nuevo en el tamaño correcto.

---

## Comportamiento (7 reglas del humano)

| # | Regla |
|---|--------|
| 1 | Contar jugadores activos en cancha (red+blue, excluye specs/AFK en team 0) |
| 2 | Elegir mejor estadio según metadata de capacidad |
| 3 | Cada estadio tiene `minPlayers` / `maxPlayers` — **defaults en código**, **editables por Server Image** en el panel |
| 4 | En join/leave/!afk/disconnect: si estadio ≠ ideal → chat sugiere `!mapa` |
| 5 | Con ≥ `thresholdPercent` (default 60%) de votantes → `stopGame` → `endMatch()` → nuevo partido en mapa elegido al **momento del cierre** |
| 6 | Durante votación entran/salen jugadores; si el count vuelve a ideal → **cancelar** votación |
| 7 | Al **iniciar** partido (`MatchLoop.onEnter` y post-voto): estadio = `pickStadium(count)` |

---

## Estado actual del código (referencia)

| Pieza | Hoy |
|-------|-----|
| Estadios | `StadiumManager` — futx2–7 + training, sin capacidad |
| Match estadio | Fijo `rules.defaultMapName` en `HaxballRoom.initializeGameLoops()` |
| Conteo | `GameLoop.getPlayerCount()` → `PlayerCacheManager.getActiveTeamCounts()` |
| Eventos count | `player.count.changed` (BalanceManager), `player.afk.set/unset` |
| Fin partido + stats | `MatchLoop.handleGameStop` → `matchStatsManager.endMatch()` |
| Reinicio partido | `startNewMatch()` — **no cambia estadio** |
| !map | String en help (SUPERADMIN) — **sin handler** registrado |

---

## Arquitectura propuesta

```
StadiumRegistry.DEFAULTS (min/max canónicos, exportados)
       ↓ mergeMapVoteConfig(image.rules.mapVote)
ResolvedStadiumList (defaults + overrides editables por imagen)
       ↓
StadiumSelector.pick(count, resolvedList) → stadiumName
       ↓
MapVoteManager (estado votación, !mapa, cancel si ideal)
       ↓
MatchLoop (onEnter, handleGameStop, startNewMatch, hook votación)
```

### Defaults canónicos (editables en panel; fuente única en `StadiumRegistry`)

Rangos pensados para **jugadores en cancha** (red+blue). Solapamiento permitido — el selector elige el mapa con **menor `maxPlayers`** que contenga el count.

| Estadio | min | max | Habilitado match | Notas |
|---------|-----|-----|------------------|-------|
| futx2 | 1 | 4 | sí | 2v2 |
| futx3 | 1 | 6 | sí | 3v3 |
| futx4 | 5 | 8 | sí | 4v4 |
| futx5 | 7 | 10 | sí | 5v5 |
| futx7 | 9 | 14 | sí | 7v7 |
| training | 0 | 99 | no | solo training loop |

Ejemplos con defaults: 4 jugadores → futx4 · 8 jugadores → futx5 · 12 jugadores → futx7.

### Config por Server Image (`rules.mapVote`)

Cada imagen **persiste su propia copia** de rangos (precargada desde defaults al crear/editar). El humano puede cambiar min/max por estadio sin tocar código.

```json
{
  "enabled": true,
  "thresholdPercent": 60,
  "stadiums": [
    { "name": "futx2", "enabled": true, "minPlayers": 1, "maxPlayers": 4 },
    { "name": "futx3", "enabled": true, "minPlayers": 1, "maxPlayers": 6 },
    { "name": "futx4", "enabled": true, "minPlayers": 5, "maxPlayers": 8 },
    { "name": "futx5", "enabled": true, "minPlayers": 7, "maxPlayers": 10 },
    { "name": "futx7", "enabled": true, "minPlayers": 9, "maxPlayers": 14 }
  ]
}
```

**Resolución en runtime:**

| Caso | Comportamiento |
|------|----------------|
| `mapVote` ausente | Usar `StadiumRegistry.getDefaultMatchStadiums()` tal cual |
| `stadiums` vacío / omitido | Idem — defaults completos |
| Entrada parcial (solo algunos mapas) | Merge: por `name`, override `enabled` / `minPlayers` / `maxPlayers`; resto desde defaults |
| Imagen legacy sin migrar | Al abrir panel → seed automático con defaults; al Execute core merge igual |

**Validación:** `minPlayers >= 1` (match), `maxPlayers >= minPlayers`, clamp `maxPlayers <= 30`. Panel no permite guardar rangos inválidos.

---

## Sub-deploys

| ID | PROB | Foco |
|----|------|------|
| [007A](../deploys/DEPLOY-007A-stadium-registry.md) | PROB-036 | Registry + metadata estadios |
| [007B](../deploys/DEPLOY-007B-stadium-selector.md) | PROB-037 | Selector “mejor mapa para N jugadores” |
| [007C](../deploys/DEPLOY-007C-map-vote.md) | PROB-038 | MapVoteManager + !mapa + eventos |
| [007D](../deploys/DEPLOY-007D-matchloop-stadium.md) | PROB-039 | Integración MatchLoop (inicio/fin/voto) |
| [007E](../deploys/DEPLOY-007E-map-vote-config.md) | PROB-040 | Panel: min/max **editables** + seed defaults + persistencia |

### Orden de derivación

```
007A → 007B → 007C ─┐
                      ├→ 007D (integración) → review coordinador
007A → 007E (paralelo con 007B/007C si no tocan MatchLoop)
```

**GameLoop:** no duplicar listeners; votación solo activa en loop `match`.

---

## Verificación runtime (coordinador)

1. `npm run build`
2. Execute sala con `minimumPlayers: 1`
3. Entrar 4 jugadores → partido en futx4 (o el que calce)
4. Uno hace !afk → chat avisa !mapa
5. 60%+ escribe !mapa → partido termina, stats en BD, nuevo partido en mapa correcto
6. Caso cancelación: durante voto entra jugador hasta calzar → voto cancelado, partido sigue
7. `GET /api/debug/report?ruid=...` — sin `[FAIL]` en loop

---

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| `startNewMatch()` no cambia mapa | 007D debe aplicar selector también en restart normal |
| Doble `endMatch` | Flag `isMapVoteRestart` / guard en `handleGameStop` |
| Voto con specs | Solo cuentan red+blue presentes al votar; recalcular quorum en cada voto |
| Race game.stop natural vs voto | Serializar con mutex en MatchLoop |

---

## Fuera de scope

- Cambiar estadio en **TrainingLoop** (solo match)
- !map admin legacy (PROB-008) — no mezclar con !mapa
- Seguridad / auth extra
