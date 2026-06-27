# DEPLOY-006C — Database debug fix

| Campo | Valor |
|-------|-------|
| **Estado** | IMPLEMENTADO (runtime pendiente token) |
| **Sprint** | Debug vNext · Fase 1 |
| **Worker** | (asignar) |
| **PROB** | PROB-033 |
| **Padre** | [DEPLOY-006](DEPLOY-006-debug-sprint.md) |

---

## Objetivo

Reparar **`DatabaseDebug`** — hoy falla porque core no implementa `GET /api/debug/database`.

## Análisis previo

- Frontend: `DatabaseDebug.tsx` → `/api/debug/database`
- Web proxy: `web/backend/src/routes/debug.ts` → core (404)
- Core tiene `/api/debug/tables` y `/api/debug/db/players` pero no dump completo

## PROBs en scope

| PROB | Objetivo |
|------|----------|
| **PROB-033** | Implementar endpoint; UI carga tablas |

## Archivos permitidos

- `core/src/api/routes/debug.ts` (o `players.ts` si encaja mejor)
- `core/src/app.ts` (solo si registro de ruta nuevo)
- `web/backend/src/routes/debug.ts`
- `web/frontend/src/pages/DatabaseDebug.tsx` (solo fix de contrato si cambia shape)
- `SystemStatus.md` / `CHANGELOG.md` al cerrar

## Prohibido

- Exponer secrets (passwords en claro en UI — **enmascarar** campo `password` en `admin_passwords` al serializar)
- Auth extra

## Especificación técnica

### `GET /api/debug/database` (core)

Respuesta esperada por UI actual:

```json
{
  "summary": { "playerIdentities": 42, ... },
  "tables": { "playerIdentities": [...], "statEvents": [...] },
  "timestamp": "..."
}
```

Implementación sugerida:
- Iterar modelos Prisma relevantes (o tablas SQLite via prisma)
- Limitar **50 filas por tabla** (UI ya trunca)
- Enmascarar: `adminPassword.password` → `"***"` en JSON

Web backend: mantener proxy existente; verificar status code.

## Criterios de cierre

- [ ] `DatabaseDebug` carga sin error con stack corriendo
- [ ] Tab `stat_events` visible si hay datos
- [ ] Passwords admin enmascaradas
- [ ] `npm run build` OK

## Handoff — Worker

- **Core:** `GET /api/debug/database` con summary + tablas (50 filas), passwords enmascaradas
- **Web proxy:** `routes/debug.ts` → core
- **Smoke API:** OK (`Invoke-RestMethod .../api/debug/database`)

---

## Review — Coordinador

- **Veredicto:** PENDIENTE
