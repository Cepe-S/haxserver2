# Logging — beta operativa

Todos los errores van a **consola (PM2)** y a **archivos JSON** en `logs/`.

## Archivos

| Archivo | Contenido |
|---------|-----------|
| `logs/errors.log` | Solo `error` — core + web unificados |
| `logs/core-app.log` | Todo el core (JSON) |
| `logs/web-app.log` | Todo el web backend (JSON) |
| `logs/core-*.log` | stdout/stderr PM2 del core |
| `logs/web-*.log` | stdout/stderr PM2 del web |
| `logs/ui-*.log` | stdout/stderr del panel |

Rotación automática: 10 MB (errors), 20 MB (app logs).

## Qué se captura

- `logger.error()` / `logger.fail()` en core y web
- `uncaughtException` y `unhandledRejection` por proceso
- Errores en handlers async del **EventBus** (join, chat, balance, loops…)
- Errores no manejados en rutas **Fastify**
- Stacks completos en cada error (campo `stack` en JSON)

## Comandos útiles en la VM

```bash
# Errores en tiempo real (todos los servicios)
tail -f logs/errors.log

# Solo errores de hoy, legible
grep '"level":"error"' logs/errors.log | tail -20

# PM2
pm2 logs --err
pm2 logs haxbotron-core --lines 100

# Buscar por sala o jugador
grep 'PROB\|ruid\|PlayerJoin' logs/core-app.log
```

## Nivel de detalle

| Variable | Default beta | Efecto |
|----------|--------------|--------|
| `LOG_LEVEL` | `info` | Más debug: `LOG_LEVEL=debug` + `pm2 restart all --update-env` |

## Formato JSON (ejemplo)

```json
{"timestamp":"...","level":"error","service":"PlayerJoinHandler","message":"Failed to process player join","error":"...","stack":"Error: ...\n    at ...","ruid":"..."}
```

Parsear con `jq`:

```bash
grep '"level":"error"' logs/errors.log | jq -r '[.timestamp,.service,.message,.error] | @tsv'
```
