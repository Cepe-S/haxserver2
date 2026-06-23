# Sprint — Remediación BD e identidad

**Estado:** completado (2026-06-22)  
**Orden obligatorio** (cada fase depende de la anterior):

| Fase | PROB | Entregable |
|------|------|------------|
| 1 | PROB-003 | `@@unique([identityId, name])` + upsert nombres + dedupe script |
| 2 | PROB-001 | Kick nick duplicado en sala |
| 3 | PROB-012 | Quitar stub roto en `MatchLoop` que bloqueaba `endMatch()` |
| 4 | PROB-007 | Permisos por `identityId` (cache); admin sin auth obligatorio |
| — | — | `docs/database/DATA-MODEL.md` — notas de diseño (sin duplicar SystemStatus) |

**Fuera de este sprint** (sin complejidad extra): cuentas Minecraft, FK `ruid`, TTL Connection, hash AdminPassword, Webhook DateTime.

**Al cerrar cada PROB:** quitar de `SystemStatus.md` → fila en `CHANGELOG.md`.
