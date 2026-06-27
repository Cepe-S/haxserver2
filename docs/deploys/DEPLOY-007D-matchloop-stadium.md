# DEPLOY-007D — MatchLoop + selector + cierre por voto

| Campo | Valor |
|-------|-------|
| **Estado** | PENDIENTE |
| **PROB** | PROB-039 |
| **Padre** | [DEPLOY-007](DEPLOY-007-dynamic-stadium.md) |
| **Depende** | 007B, 007C |

---

## Objetivo

Integrar selector y votación en el ciclo de partido: estadio correcto al entrar, reiniciar con mapa nuevo tras voto, persistir stats como fin normal.

## PROBs en scope

| PROB | Objetivo |
|------|----------|
| **PROB-039** | MatchLoop usa selector; handler `map.vote.passed` cierra y reinicia |

## Archivos permitidos

- `core/src/shared/gameloop/MatchLoop.ts`
- `core/src/shared/gameloop/GameLoop.ts` (solo si hace falta exponer stadium actual)
- `core/src/shared/stadiums/StadiumSelector.ts`
- `core/src/shared/stadiums/MapVoteManager.ts`
- `core/src/haxball/HaxballRoom.ts` (pasar selector/config a MatchLoop)
- `core/src/shared/stats/MatchStatsManager.ts` (solo si hace falta guard — preferir flujo existente)

## Prohibido

- Refactor GameLoopController
- Duplicar listeners game.stop

## Especificación técnica

### onEnter (regla 7)

```typescript
const count = this.getPlayerCount().total;
this.config.stadiumName = this.stadiumSelector.pick(count);
await this.safeChangeStadium(this.config.stadiumName);
```

### map.vote.passed (regla 5)

1. Set flag `isMapVoteRestart = true`
2. `await haxballRoom.stopGame()` → dispara `handleGameStop`
3. En `handleGameStop`:
   - Si `isMapVoteRestart`: `endMatch()` como siempre
   - `count = getPlayerCount().total`
   - `newStadium = selector.pick(count)`
   - `safeChangeStadium(newStadium)` + opcional nuevo `selectRandomMatch()`
   - `startNewMatch()` **extendido** para incluir cambio de estadio cuando flag activo
   - Clear flag + clear MapVoteManager

### startNewMatch (fix existente)

Hoy **no** cambia estadio. Agregar:

- Tras partido normal (score/time): re-evaluar `pick(count)` — por si cambió gente entre partidos
- Solo cambiar estadio si `pick !== current`

### Guards

- No llamar `endMatch` dos veces (PROB-024 pattern)
- No transicionar a training durante map vote restart
- `isMapVoteRestart` evita que `handleGameStop` haga doble `startNewMatch`

## Criterios de cierre

- [ ] Partido nuevo arranca con estadio acorde a count
- [ ] Voto 60%+ → stats en BD + nuevo partido en mapa correcto
- [ ] Sin regresión PROB-024/028 (listeners únicos)
- [ ] `npm run build` OK
- [ ] Verificación runtime documentada en handoff

## Handoff — Worker

*(Completar al terminar)*

---

## Review — Coordinador

- **Veredicto:** PENDIENTE
