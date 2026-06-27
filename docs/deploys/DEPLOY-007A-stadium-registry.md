# DEPLOY-007A — Stadium registry + defaults

| Campo | Valor |
|-------|-------|
| **Estado** | PENDIENTE |
| **PROB** | PROB-036 |
| **Padre** | [DEPLOY-007](DEPLOY-007-dynamic-stadium.md) |

---

## Objetivo

Fuente única de **defaults canónicos** (`minPlayers`, `maxPlayers`, `enabled`) y helper de **merge** con config editable por Server Image.

## PROBs en scope

| PROB | Objetivo |
|------|----------|
| **PROB-036** | Registry + `DEFAULT_MATCH_STADIUMS` + `resolveStadiumDefinitions(mapVote)` |

## Archivos permitidos

- `core/src/shared/stadiums/StadiumManager.ts`
- `core/src/shared/stadiums/StadiumRegistry.ts` (nuevo)
- `core/src/shared/stadiums/index.ts` (nuevo, re-export)
- `web/backend/src/types/ServerConfig.ts` (solo tipos compartidos de `MapVoteStadiumConfig` si hace falta)
- `SystemStatus.md` / `CHANGELOG.md` al cerrar

## Prohibido

- MatchLoop, votación, UI panel (007E)

## Especificación técnica

### `StadiumDefinition`

```typescript
interface StadiumDefinition {
  name: string;
  minPlayers: number;     // inclusive, red+blue total
  maxPlayers: number;     // inclusive
  enabled: boolean;       // participa en selector/voto
  matchEligible: boolean; // false = training/ready (no en mapVote.stadiums)
}
```

### Defaults exportados (`DEFAULT_MATCH_STADIUMS`)

Constante **única** usada por core y panel (007E importa o duplica vía API `/api/stadiums/defaults` — preferir export compartido en types):

| name | min | max | enabled |
|------|-----|-----|---------|
| futx2 | 1 | 4 | true |
| futx3 | 1 | 6 | true |
| futx4 | 5 | 8 | true |
| futx5 | 7 | 10 | true |
| futx7 | 9 | 14 | true |

`training`: `matchEligible: false` — fuera de lista match, sin entrada en `mapVote.stadiums`.

### API registry

- `getDefaultMatchStadiums(): StadiumDefinition[]` — copia fresh (no mutar constante)
- `get(name)`, `getAllLoaded(): string[]` (desde .hbs existentes)
- **`resolveStadiumDefinitions(mapVote?: MapVoteConfig): StadiumDefinition[]`**
  - Sin config → defaults
  - Con `stadiums[]` → merge por `name`: override `enabled`, `minPlayers`, `maxPlayers`
  - Ignorar entradas con `enabled: false` en selector
  - Validar y clamp en merge (log warn si imagen trae rangos inválidos)

### `StadiumManager`

- `getAvailableStadiums()` → nombres .hbs cargados
- No hardcodear rangos fuera del registry

## Criterios de cierre

- [ ] `DEFAULT_MATCH_STADIUMS` con tabla exacta de arriba
- [ ] `resolveStadiumDefinitions` merge probado en handoff (caso legacy + override parcial)
- [ ] `npm run build` OK

## Handoff — Worker

*(Completar al terminar)*

---

## Review — Coordinador

- **Veredicto:** PENDIENTE
