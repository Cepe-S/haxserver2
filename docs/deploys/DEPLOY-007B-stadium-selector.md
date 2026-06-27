# DEPLOY-007B — Stadium selector

| Campo | Valor |
|-------|-------|
| **Estado** | PENDIENTE |
| **PROB** | PROB-037 |
| **Padre** | [DEPLOY-007](DEPLOY-007-dynamic-stadium.md) |
| **Depende** | 007A |

---

## Objetivo

Dado `playerCount` y lista **resuelta** (`resolveStadiumDefinitions`), devolver el mejor estadio y detectar mismatch. Los rangos min/max vienen de la imagen (editables) o defaults del registry.

## PROBs en scope

| PROB | Objetivo |
|------|----------|
| **PROB-037** | `StadiumSelector` — pick, isIdeal, getMismatchReason |

## Archivos permitidos

- `core/src/shared/stadiums/StadiumSelector.ts` (nuevo)
- `core/src/shared/stadiums/StadiumRegistry.ts`

## Prohibido

- MatchLoop, MapVote, panel

## Especificación técnica

```typescript
class StadiumSelector {
  constructor(definitions: StadiumDefinition[]); // ya resueltas (post-merge)

  pick(playerCount: number): string;
  isIdeal(playerCount: number, stadiumName: string): boolean;
  getMismatchReason(playerCount: number, current: string): 'ok' | 'too_small' | 'too_large';
}
```

### Algoritmo `pick`

1. Filtrar `enabled && matchEligible`
2. Donde `minPlayers <= count <= maxPlayers` → menor `maxPlayers` (mapa más ajustado)
3. Si ninguno encaja: count bajo → estadio con menor `minPlayers`; count alto → mayor `maxPlayers`
4. Tie-break: orden futx2 → futx3 → futx4 → futx5 → futx7

### Tabla esperada con **defaults** (documentar en handoff)

| Jugadores | Estadio |
|-----------|---------|
| 1–4 | futx2 o futx3 (menor max → futx2 si ambos calzan; con defaults futx2 gana en 1–4) |
| 5–6 | futx3 |
| 7–8 | futx4 o futx5 (7–8 → futx4 max 8) |
| 9–10 | futx5 |
| 11–14 | futx7 |
| 15+ | futx7 (fallback mayor max) |

### Instanciación (007D / HaxballRoom)

```typescript
const defs = resolveStadiumDefinitions(config.rules?.mapVote);
const selector = new StadiumSelector(defs);
```

Si el admin cambió rangos en panel, la misma lógica usa esos valores — **sin recompilar**.

## Criterios de cierre

- [ ] Handoff incluye tabla count→stadium con defaults y un ejemplo con override (ej. futx4 max=10)
- [ ] `npm run build` OK

## Handoff — Worker

*(Completar al terminar)*

---

## Review — Coordinador

- **Veredicto:** PENDIENTE
