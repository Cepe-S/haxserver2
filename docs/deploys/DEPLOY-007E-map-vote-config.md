# DEPLOY-007E — Config map vote + panel (rangos editables)

| Campo | Valor |
|-------|-------|
| **Estado** | PENDIENTE |
| **PROB** | PROB-040 |
| **Padre** | [DEPLOY-007](DEPLOY-007-dynamic-stadium.md) |
| **Depende** | 007A (defaults + tipos) |

---

## Objetivo

Panel y persistencia para **editar min/max por estadio** con defaults canónicos precargados. Threshold % y toggle del sistema.

## PROBs en scope

| PROB | Objetivo |
|------|----------|
| **PROB-040** | `rules.mapVote` completo + UI tabla editable + seed en imágenes legacy |

## Archivos permitidos

- `web/backend/src/types/ServerConfig.ts`
- `web/frontend/src/components/ServerImageConfigForm.tsx`
- `core/src/haxball/HaxballRoom.ts` (pasar `rules.mapVote` resuelto)
- `core/src/shared/strings/index.ts`
- `docs/plans/dynamic-stadium-vNext.md`

## Prohibido

- MatchLoop (007D), MapVoteManager internals (007C)

## Especificación técnica

### Schema config (persistido en JSON de imagen)

```typescript
mapVote?: {
  enabled: boolean;           // default true
  thresholdPercent: number;   // default 60, clamp 1–100
  stadiums: Array<{
    name: string;             // futx2 | futx3 | futx4 | futx5 | futx7
    enabled: boolean;         // default true
    minPlayers: number;       // default desde DEFAULT_MATCH_STADIUMS
    maxPlayers: number;       // default desde DEFAULT_MATCH_STADIUMS
  }>;
};
```

**Importante:** `stadiums` se guarda **completo** al guardar imagen (no solo deltas), siempre con los 5 mapas match y sus rangos actuales — facilita lectura humana del JSON y evita merge ambiguo en panel.

### Panel — sección "Mapa dinámico (!mapa)"

| Control | Comportamiento |
|---------|----------------|
| Toggle | Activar votación !mapa |
| Input % | Umbral de votos (default 60) |
| Tabla por estadio | Columnas: Nombre · Habilitado · Min · Max |
| Valores iniciales | Seed desde `DEFAULT_MATCH_STADIUMS` (007A) |
| Botón "Restaurar defaults" | Resetea toda la tabla a defaults canónicos |
| Validación inline | min ≥ 1, max ≥ min; error si inválido — bloquear save |

### Imágenes existentes (legacy)

Al cargar config sin `mapVote` o sin `stadiums`:

1. UI muestra defaults canónicos (no campos vacíos)
2. Al **guardar**, persiste bloque `mapVote` completo
3. Core en Execute: si JSON viejo sin `mapVote`, `resolveStadiumDefinitions(undefined)` → defaults (sin romper salas)

### Core

- `HaxballRoom` / `MapVoteManager` / `StadiumSelector` reciben lista ya mergeada vía `resolveStadiumDefinitions(config.rules.mapVote)`

### Help / strings

- `!mapa` en !help básico
- Mensajes: mismatch, progreso, cancelado, mapa cambiado

## Criterios de cierre

- [ ] Tabla min/max editable y persiste en server image
- [ ] Restaurar defaults funciona
- [ ] Imagen legacy sin `mapVote` sigue funcionando con defaults en runtime
- [ ] `npm run build` OK

## Handoff — Worker

*(Completar al terminar)*

---

## Review — Coordinador

- **Veredicto:** PENDIENTE
