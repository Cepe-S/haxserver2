# Agent Debug Report — formato v1

Reporte **texto plano** para el loop de deploys. Los agentes leen solo las secciones relevantes.

## URLs

| Uso | URL |
|-----|-----|
| API (agentes) | `GET http://localhost:3000/api/debug/report` |
| Con sala | `GET /api/debug/report?ruid=pito&lines=50` |
| Panel humano | `http://localhost:5173/debug/report` |

## Formato

```
# MIKUSERVERPRO_AGENT_REPORT v1
@SECTION ALERTS          ← leer primero; [FAIL] [WARN] [OK]
@SECTION HEALTH          ← web/core/db
@SECTION SERVER_IMAGES   ← @RUNNING / @INACTIVE
@SECTION ROOM            ← loop, players, stats
@SECTION EVENT_LISTENERS ← count>1 en eventos críticos = WARN
@SECTION MATCH_LOG
@SECTION DB_SUMMARY
@SECTION ACTIVE_PROBS    ← filas PROB-xxx de SystemStatus.md
@SECTION LOG_ERRORS
@SECTION LOG_CORE_APP
@SECTION LOG_WEB_APP
@SECTION LOG_FILES
@SECTION FIX_ROUTING     ← mapa subsistema → path
@SECTION DEPLOY_LOOP     ← pasos del ciclo
```

## Loop de deploy (post-implementación)

```mermaid
flowchart TD
  A[Worker: fix + build] --> B{Servidor corre?}
  B -->|no| R[GET /api/debug/report]
  B -->|sí| C[GET /api/debug/report]
  C --> D{@SECTION ALERTS ok?}
  D -->|sí + criterios manifest| E[Coordinador APROBADO]
  D -->|no| F[Coordinador lee reporte]
  F --> G{small_fix vs rebuild?}
  G -->|small_fix| H[Derivar worker subsistema FIX_ROUTING]
  G -->|rebuild| I[Redefinir DEPLOY / split PRs]
  H --> A
  R --> F
```

### Clasificación de fix

| Tipo | Cuándo | Acción |
|------|--------|--------|
| **small_fix** | Error acotado, archivo claro, contrato estable | Worker parche en paths de `FIX_ROUTING` |
| **rebuild** | Duplicación masiva, contrato roto, diseño incorrecto | Coordinador nuevo manifest / scope reducido |

## Comandos agente

```powershell
# Tras deploy local
Invoke-RestMethod http://localhost:3000/api/health

# Reporte completo (pegar en contexto del agente)
Invoke-WebRequest http://localhost:3000/api/debug/report -OutFile report.txt
Get-Content report.txt | Select-String '\[FAIL\]|\[WARN\]|@SECTION'
```
