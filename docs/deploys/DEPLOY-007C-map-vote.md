# DEPLOY-007C — Map vote + !mapa

| Campo | Valor |
|-------|-------|
| **Estado** | PENDIENTE |
| **PROB** | PROB-038 |
| **Padre** | [DEPLOY-007](DEPLOY-007-dynamic-stadium.md) |
| **Depende** | 007B |

---

## Objetivo

Votación `!mapa` para cambiar tamaño de cancha: notificar mismatch, acumular votos, cancelar si vuelve lo ideal, emitir evento cuando quorum alcanzado.

## PROBs en scope

| PROB | Objetivo |
|------|----------|
| **PROB-038** | MapVoteManager + MapaCommand + hooks join/leave/afk |

## Archivos permitidos

- `core/src/shared/stadiums/MapVoteManager.ts` (nuevo)
- `core/src/chat-manager/commands/handlers/MapaCommand.ts` (nuevo)
- `core/src/chat-manager/commands/CommandRegistry.ts`
- `core/src/shared/events/handlers/MapVoteEventHandler.ts` (nuevo) o extensión mínima en handler existente de player count
- `core/src/shared/strings/index.ts` (strings !mapa)
- `core/src/haxball/HaxballRoom.ts` (wire manager + pasar `resolveStadiumDefinitions(mapVote)`, solo registro)

## Prohibido

- Lógica de `endMatch` / `startNewMatch` (007D)
- Panel web (007E)

## Especificación técnica

### Estado votación

```typescript
interface MapVoteState {
  active: boolean;
  votes: Set<number>;        // haxball player ids
  startedAt: number;
  reason: 'too_small' | 'too_large';
}
```

### Flujo

1. **Mismatch detectado** (solo MatchLoop activo):
   - Chat: *"El estadio no es ideal para {count} jugadores. Usá !mapa para votar cambio de mapa."*
   - No auto-iniciar voto hasta primer !mapa O iniciar voto pasivo (decisión worker: **voto inicia con primer !mapa** para evitar spam)

2. **!mapa** (PermissionLevel.PLAYER):
   - Si no hay mismatch → mensaje "El mapa ya es el adecuado"
   - Si hay mismatch → registrar voto del jugador (solo red+blue)
   - Mostrar progreso: `{votes}/{required} votos`
   - `required = ceil(eligibleCount * thresholdPercent / 100)` — `thresholdPercent` desde `rules.mapVote` (default 60)

3. **Quorum alcanzado** → emitir `map.vote.passed` con payload `{ playerCountAtClose }`

4. **Cancelación** — en cada `player.count.changed` / afk / leave:
   - Recalcular count + `isIdeal(currentStadium)`
   - Si ideal → `clearVote()` + chat "Votación cancelada — el mapa ya es el correcto"

5. **Durante voto** entra/sale gente → recalcular `required` y `eligibleCount`; si votes > eligible, limpiar votos inválidos

### Eventos a escuchar

- `player.count.changed`
- `player.afk.set` / `player.afk.unset`
- `haxball.player.leave` (si no cubierto por count.changed)

### Cooldown !mapa

- 5s por jugador (evitar spam)

## Criterios de cierre

- [ ] !mapa registrado y responde en chat
- [ ] Mismatch notifica una vez por “episodio” (debounce 30s)
- [ ] Quorum emite `map.vote.passed`
- [ ] Cancelación cuando count ideal
- [ ] `npm run build` OK

## Handoff — Worker

*(Completar al terminar)*

---

## Review — Coordinador

- **Veredicto:** PENDIENTE
