# DEPLOY-006E — Logger debug visibility

| Campo | Valor |
|-------|-------|
| **Estado** | IMPLEMENTADO |
| **Sprint** | Debug vNext · Fase 1 |
| **Worker** | (asignar) |
| **PROB** | PROB-035 |
| **Padre** | [DEPLOY-006](DEPLOY-006-debug-sprint.md) |

---

## Objetivo

Que `LOG_LEVEL=debug` en beta/PM2 **produzca logs de debug útiles** (loops, match, balance) sin requerir `NODE_ENV=development`.

## Análisis previo

```typescript
// Logger.ts — hoy
debug(message) {
  if (process.env.NODE_ENV === 'development' && this.shouldLog('debug', message)) {
```

En VM con `LOG_LEVEL=debug` + `NODE_ENV=production` → **silencio total** en canal debug.

## PROBs en scope

| PROB | Objetivo |
|------|----------|
| **PROB-035** | Respetar `LOG_LEVEL`; documentar uso beta |

## Archivos permitidos

- `core/src/shared/logger/Logger.ts`
- `core/src/shared/logger/LoggerConfig.ts`
- `docs/LOGGING.md`
- `SystemStatus.md` / `CHANGELOG.md` al cerrar

## Prohibido

- Cambiar auth, webhooks, niveles de producción default
- Spam masivo: mantener `SPAM_PATTERNS` / `shouldLog`

## Especificación técnica

1. `debug()` debe registrar si:
   - `DEFAULT_LOGGER_CONFIG.level === 'debug'` **OR**
   - `process.env.LOG_LEVEL === 'debug'`
   - (Opcional) seguir filtrando spam via `shouldLog`
2. No exigir `NODE_ENV === 'development'` para canal debug.
3. Actualizar `docs/LOGGING.md`: tabla VM beta con `LOG_LEVEL=debug` + `pm2 restart --update-env`.
4. Servicios loop (`GAMELOOPCONTROLLER`, `LOOP:*`, `MATCHSTATSMANAGER`) deben ser visibles en `core-app.log` tras cambio.

## Criterios de cierre

- [ ] Con `LOG_LEVEL=debug` y `NODE_ENV=production`, aparecen líneas `[LOOP:*]` en log file
- [ ] Con `LOG_LEVEL=info`, debug sigue suprimido
- [ ] `npm run build` OK

## Handoff — Worker

- **`Logger.debug()`** respeta `LOG_LEVEL=debug` sin exigir `NODE_ENV=development`
- **`docs/LOGGING.md`** actualizado
- **Build:** OK

---

## Review — Coordinador

- **Veredicto:** PENDIENTE
