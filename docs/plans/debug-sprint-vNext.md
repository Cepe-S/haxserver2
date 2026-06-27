# Debug Sprint vNext — plan maestro

**Fecha:** 2026-06-21  
**Objetivo:** Mejorar observabilidad y workflow de debug (especialmente loops) sin tocar seguridad/auth.  
**Coordinador:** agente router · **Workers:** DEPLOY-006A → 006E (paralelo solo donde archivos no se solapan)

---

## Contexto (análisis previo)

| Capa | Estado actual | Gap principal |
|------|---------------|---------------|
| Consola / Logger | Winston + `logs/*.log` | `logger.debug()` ignorado fuera de `NODE_ENV=development` |
| API core debug | `/api/debug/*` singleton | Stats UI desalineada; sin `/api/debug/database` |
| API por ruid | `balance-debug`, `/events` | Sin proxy web ni UI |
| Panel web | `BalanceDebugPage`, `DatabaseDebug` | DB debug roto; sin descarga de logs; nav incompleta |
| In-game | `!debugpowershot` | Match debug = TODO (`logMatchDebugAction`) |
| Scripts | `seed-stats-tops.ts` | Sin escenarios de loop automatizados |

---

## Entregable humano clave

**Un botón en la UI** → descarga un `.zip` con todos los archivos de `logs/` (`errors.log`, `core-app.log`, `web-app.log`, PM2 stdout si existen).

---

## Workers y orden

| Deploy | PROB | Sistema | Depende de |
|--------|------|---------|------------|
| [006E](../deploys/DEPLOY-006E-logger-debug.md) | PROB-035 | Logger / consola | — |
| [006C](../deploys/DEPLOY-006C-database-debug.md) | PROB-033 | Database debug UI | — |
| [006B](../deploys/DEPLOY-006B-gameloop-debug.md) | PROB-032 | GameLoop + BalanceDebugPage | — |
| [006D](../deploys/DEPLOY-006D-events-stats-debug.md) | PROB-034 | Events + MatchStats | 006B recomendado antes (misma página debug) |
| [006A](../deploys/DEPLOY-006A-logs-download.md) | PROB-031 | Logs zip + Debug Hub | — |

**Paralelo permitido:** 006E + 006C + 006A (archivos distintos).  
**Secuencial:** 006B antes de 006D si ambos tocan `BalanceDebugPage.tsx` — 006D usa pestañas nuevas o archivos separados.

---

## Verificación (coordinador / CI local)

Ver [DEPLOY-006-debug-sprint.md](../deploys/DEPLOY-006-debug-sprint.md) → sección **Verificación runtime**.

El **humano solo provee** el token Haxball para Execute. El coordinador:

1. `npm run build`
2. Levanta stack (`npm run start:prod` o procesos ya corriendo)
3. Browser MCP → `http://localhost:5173` → login panel
4. Execute Server Image con token del humano
5. Valida Debug Hub, descarga zip, gameloop panel, logs en zip

---

## Fuera de scope (explícito)

- JWT / auth en endpoints debug
- Hash de contraseñas
- Features de gameplay nuevas
- Deploy VM (salvo orden humana)
