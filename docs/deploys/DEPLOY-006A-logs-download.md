# DEPLOY-006A — Logs download + Debug Hub

| Campo | Valor |
|-------|-------|
| **Estado** | IMPLEMENTADO (runtime pendiente token) |
| **Sprint** | Debug vNext · Fase 1 |
| **Worker** | (asignar) |
| **PROB** | PROB-031 |
| **Padre** | [DEPLOY-006](DEPLOY-006-debug-sprint.md) |

---

## Objetivo

Un **solo botón** en el panel descarga un `.zip` con todos los archivos de log del monorepo (`logs/`). Página **Debug Hub** como punto de entrada a herramientas de debug.

## Análisis previo

- Logs en `logs/` vía `getLogsDirectory()` (`database/src/logPaths.ts`)
- Archivos típicos: `errors.log`, `core-app.log`, `web-app.log`, `core-*.log`, `web-*.log`, `ui-*.log` (PM2)
- **No existe** endpoint ni UI de descarga hoy

## PROBs en scope

| PROB | Objetivo |
|------|----------|
| **PROB-031** | API list + download zip; Debug Hub con botón principal |

## Archivos permitidos

- `database/src/logPaths.ts` (helper `listLogFiles()` si hace falta)
- `database/src/index.ts` (re-export)
- `web/backend/src/routes/debug.ts` (expandir — o `routes/logs.ts` nuevo)
- `web/backend/src/server.ts` (registrar ruta si archivo nuevo)
- `web/frontend/src/pages/DebugHubPage.tsx` (nuevo)
- `web/frontend/src/App.tsx`
- `web/frontend/src/components/Navigation.tsx`
- `web/frontend/src/pages/DashboardPage.tsx` (link opcional)
- `SystemStatus.md` / `CHANGELOG.md` al cerrar PROB-031

## Prohibido

- Auth/JWT en endpoints debug
- Tocar gameLoop, EventBus, stats pipeline

## Especificación técnica

### API Web (`:3000`)

| Método | Ruta | Comportamiento |
|--------|------|----------------|
| GET | `/api/debug/logs/list` | `{ files: [{ name, sizeBytes, modifiedAt }] }` |
| GET | `/api/debug/logs/download` | `Content-Type: application/zip`, `Content-Disposition: attachment; filename="mikuserverpro-logs-{timestamp}.zip"` |

Implementación sugerida: `archiver` o `adm-zip` (añadir dep mínima en `web/backend`) o zip nativo si ya hay lib. Leer solo archivos **dentro** de `getLogsDirectory()` (sin path traversal).

### UI — `DebugHubPage` (`/debug`)

- Botón prominente: **⬇ Descargar todos los logs**
- Lista de archivos con tamaño/fecha (opcional)
- Links a: Balance Debug, Database Debug, Server Images
- Entrada en `Navigation`: **Debug**

## Criterios de cierre

- [ ] GET list + GET download funcionan
- [ ] Botón descarga zip con múltiples archivos cuando existen logs
- [ ] `/debug` accesible desde nav
- [ ] `npm run build` OK
- [ ] Handoff completo

## Handoff — Worker

- **Build:** OK (`npm run build`)
- **API:** `GET /api/debug/logs/list` y `GET /api/debug/logs/download` (zip con `archiver`)
- **UI:** `/debug` — Debug Hub con nav, lista de logs, botón descarga
- **Pendiente coordinador:** verificar zip en browser con sala activa

---

## Review — Coordinador

- **Veredicto:** PENDIENTE
