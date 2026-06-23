# Modelo de datos — notas operativas

Referencia rápida para agentes. Schema canónico: `database/prisma/schema.prisma`.

## Identidad de jugador

```
PlayerIdentity (1) ──< PlayerAuth (auth único)
                 ──< PlayerConnection (conn único)
                 ──< PlayerName (unique identityId + name)
                 ──< PlayerPermission (por ruid)
                 ──< PlayerStats (por ruid)
Connection (sesión en sala: ruid + playerId + haxballId)
```

- **On-line:** `PlayerCacheManager` mapea `haxballId → identityId` tras `PlayerJoinHandler`.
- **Permisos:** `PermissionManager` consulta `PlayerPermission` por `identityId` (cache en memoria). No crear identidades `temp_*`.
- **Nicks:** un registro por par `(identityId, name)`; historial de alias distintos sigue siendo varias filas.

## Estadísticas de partido

- **En memoria:** `MatchStatsManager` durante el partido.
- **Persistencia:** solo `MatchStatsManager.endMatch()` → upsert en `PlayerStats`.
- **No usar** stubs en `MatchLoop`; el flujo correcto es `handleGameStop` → `endMatch()`.

## Fuera de alcance (no añadir sin orden)

- Cuentas Minecraft / `!register` — ver `docs/plans/DEFERRED-player-accounts.md`
- FK `ruid` → `ServerImage`, TTL en `Connection`, hash de `AdminPassword`

## Migraciones

```bash
npm run db:setup   # dedupe player_names + prisma db push + seed
```

Script `database/scripts/dedupe-player-names.js` corre antes de `db push` si existe `@@unique([identityId, name])`.
