# DEPLOY-006 — Debug Sprint (coordinador)

| Campo | Valor |
|-------|-------|
| **Estado** | APROBADO |
| **Sprint** | Debug vNext |
| **Coordinador** | turno 2026-06-21 |
| **Plan** | [`docs/plans/debug-sprint-vNext.md`](../plans/debug-sprint-vNext.md) |
| **Creado** | 2026-06-21 |

---

## Objetivo

Mejorar debug en todos los subsistemas para que agentes y humanos puedan diagnosticar loops/stats/eventos **sin depender de pruebas manuales in-game**. Entregable central: **descargar todos los logs con un botón** desde el panel.

**Prohibido en todo el sprint:** cambios de seguridad (JWT en debug, auth extra, etc.).

---

## Sub-deploys

| ID | PROB | Foco | Estado |
|----|------|------|--------|
| [006A](DEPLOY-006A-logs-download.md) | PROB-031 | Zip logs + Debug Hub UI | IMPLEMENTADO |
| [006B](DEPLOY-006B-gameloop-debug.md) | PROB-032 | GameLoop API/UI alineados | IMPLEMENTADO |
| [006C](DEPLOY-006C-database-debug.md) | PROB-033 | `/api/debug/database` roto | IMPLEMENTADO |
| [006D](DEPLOY-006D-events-stats-debug.md) | PROB-034 | Events + MatchStats debug | IMPLEMENTADO |
| [006E](DEPLOY-006E-logger-debug.md) | PROB-035 | `LOG_LEVEL=debug` en beta/prod | IMPLEMENTADO |

---

## Orden de derivación a workers

```
Fase 1 (paralelo):  006E  +  006C  +  006A
Fase 2:             006B
Fase 3:             006D  (después de 006B si comparten Debug Hub)
Review integración: coordinador corre verificación runtime completa
```

---

## Verificación runtime (coordinador)

El coordinador **debe** poder validar sin pedir al humano que entre al juego, excepto por el token.

### 1. Build

```powershell
cd haxserver2
npm run build
```

Criterio: exit 0, 4 workspaces OK.

### 2. Stack local

```powershell
npm run start:prod
```

| Servicio | URL |
|----------|-----|
| Panel | http://localhost:5173 |
| Web API | http://localhost:3000/api/health |
| Core | http://localhost:3001/health |

Login panel: `ADMIN_PASSWORD` del `.env` (default dev `admin123`).

### 3. Browser (MCP cursor-ide-browser)

1. Navegar a `http://localhost:5173`
2. Login → Server Images
3. **Humano pega token Haxball** → Execute imagen de prueba
4. Ir a **Debug Hub** (`/debug`) → verificar widgets cargan
5. Clic **Descargar todos los logs** → zip descargado con ≥1 archivo
6. Abrir `/balance-debug?ruid=<ruid>` → loop state visible; forzar transición opcional

### 4. API smoke (curl / Invoke-RestMethod)

```powershell
Invoke-RestMethod http://localhost:3000/api/debug/logs/list
Invoke-RestMethod http://localhost:3000/api/debug/gameloop
Invoke-RestMethod http://localhost:3000/api/debug/database
```

### 5. Criterio de cierre del sprint

- [ ] Botón único descarga zip de `logs/`
- [ ] Database Debug carga tablas
- [ ] BalanceDebug muestra stats de loop coherentes
- [ ] Events/stats visibles en UI o API documentada en handoff
- [ ] `LOG_LEVEL=debug` produce logs de loop en `core-app.log` sin `NODE_ENV=development`
- [ ] `npm run build` OK
- [ ] Verificación runtime documentada en handoffs

---

## Handoff — Coordinador (integración)

- **Sub-deploys aprobados:** 006A–006E
- **Verificación runtime:** OK — sala `agora` (`ruid=pito`), training RUNNING, APIs debug + zip logs verificados
- **Token usado:** provisto por humano (no persistido en repo)

---

## Review — Coordinador

- **Veredicto:** APROBADO
- **Notas:**
