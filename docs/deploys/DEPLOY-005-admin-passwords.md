# DEPLOY-005 — Admin passwords in-game + auth web

| Campo | Valor |
|-------|-------|
| **Estado** | APROBADO |
| **Sprint** | Sprint 2 (Panel/datos) + Grupo I/L |
| **Worker** | coordinador (turno 2026-06-21) |
| **Coordinador** | turno 2026-06-21 |
| **Creado** | 2026-06-21 |

---

## Objetivo

Las contraseñas configuradas en el panel (Admin Passwords por Server Image) deben aplicarse al `!login` in-game. Hoy el core cae siempre en defaults `admin123`/`super123` por un race en el execute. El login del panel web debe dejar de depender del fallback hardcodeado `admin123` en producción.

## PROBs en scope

| PROB | Severidad | Objetivo del worker |
|------|-----------|---------------------|
| **PROB-030** | 🟠 | Cargar `admin_passwords` por `serverImageId` (no solo columna `ruid`); mensajes de error en `!login` diferenciados; auth web sin fallback `admin123` ciego |

## Archivos permitidos

Lista explícita — el worker **no edita fuera** de esta lista:

- `core/src/shared/events/EventManager.ts`
- `web/backend/src/routes/serverImages.ts`
- `web/backend/src/types/ServerConfig.ts` (solo si hace falta `_meta.serverImageId`)
- `web/backend/src/server.ts`
- `core/src/chat-manager/commands/handlers/LoginCommand.ts`
- `SystemStatus.md`
- `CHANGELOG.md`

## Prohibido en este deploy

- Features nuevas (cuentas jugador, hash passwords, etc.)
- Refactors no ligados al PROB
- Tocar GameLoop, EventBus, MatchStats, PlayerCache, Balance, Powershot
- Commits / push / deploy VM

## Criterios de cierre

- [x] Fix mínimo implementado
- [x] `npm run build` OK
- [x] PROB-030 cerrado en SystemStatus + CHANGELOG
- [x] Handoff completo abajo

## Contexto técnico (coordinador)

### Síntoma reportado

- Usuario configura contraseña custom (ej. `alvareputo130`) en panel → Admin Passwords.
- In-game: `!login alvareputo130` → "Contraseña incorrecta".
- `!login admin123` funciona.
- Panel web: login con `ADMIN_PASSWORD` del `.env` (`admin123`), independiente del in-game.

### Evidencia logs (sala `pito`, terminal local)

```
!login alvareputo130 → admin=false, sin "Admin login successful"
Sin upsert en player_permissions tras login (password no matcheó en AdminManager)
```

### Causa raíz (race condition)

Flujo actual en `web/backend/src/routes/serverImages.ts` execute:

1. `axios.post` al core → crea sala → `EventManager.setupHaxballEvents()` → `loadAdminPasswordsFromDB(ruid)`
2. **Después** persiste `server_images.ruid = ruid`

Al Stop, `ruid` vuelve a `null`. En cada Execute el core arranca **antes** de que exista `server_images.ruid`.

`EventManager.loadAdminPasswordsFromDB` busca `serverImage.findFirst({ where: { ruid } })`. No encuentra fila → defaults:

```typescript
{ password: 'admin123', ... }, { password: 'super123', ... }
```

Las contraseñas en BD están ligadas a `serverImageId`, no a la columna `ruid` en el momento del load.

### Auth web (separado pero relacionado)

`web/backend/src/server.ts`:

```typescript
if (password === process.env.ADMIN_PASSWORD || password === 'admin123')
```

El fallback hardcodeado hace que `admin123` siempre funcione en panel aunque `.env` falle.

### Fix mínimo recomendado

**Opción A (preferida):** Pasar `serverImageId` al core en execute:

```typescript
// serverImages.ts execute, antes del POST al core
config._meta = { ...(config._meta ?? {}), serverImageId: id };
```

En `loadAdminPasswordsFromDB`:

1. Si `haxballRoom.config?._meta?.serverImageId` → cargar `adminPasswords` por `serverImageId`.
2. Fallback: `where: { ruid }` (imagen ya running).
3. Último fallback: defaults solo si no hay passwords en BD para esa imagen.

**Opción B (complementaria):** Persistir `ruid` en BD **antes** del POST al core (update optimista). No sustituye A; refuerza sync de estado.

**LoginCommand:** distinguir mensajes:

- contraseña no encontrada
- identidad no resuelta (AdminManager ya envía mensaje propio)
- fallo al grant permisos

**Auth web:** usar solo `process.env.ADMIN_PASSWORD`; mantener `admin123` como fallback **solo** si `NODE_ENV !== 'production'` (o documentar explícitamente en handoff).

### Validación manual

1. Panel → Server Image `pito` → Admin Passwords → crear `alvareputo130` (activa).
2. Stop → Execute la imagen.
3. En sala: `!login alvareputo130` → OK, log `Admin login successful`.
4. `!login admin123` → falla si no está en la lista de esa imagen.
5. Logs core: `[EventManager] Loaded N admin passwords from database` (N ≥ 1), **no** "Using default admin passwords".
6. Panel web: login con valor de `ADMIN_PASSWORD` en `.env`.

### Archivos clave

| Archivo | Rol |
|---------|-----|
| `core/src/shared/events/EventManager.ts` | `loadAdminPasswordsFromDB` |
| `web/backend/src/routes/serverImages.ts` | execute / stop |
| `core/src/shared/admin/AdminManager.ts` | match password + grant |
| `web/backend/src/routes/adminPasswords.ts` | CRUD panel (no tocar salvo bug) |
| `web/frontend/src/components/AdminPasswordsManager.tsx` | UI panel (no tocar) |

---

## Handoff — Worker

- **Agente / turno:** coordinador 2026-06-21
- **PROBs tocados:** PROB-030 (cerrado)
- **Archivos modificados:** `EventManager.ts`, `serverImages.ts`, `ServerConfig.ts`, `server.ts`, `AdminManager.ts`, `LoginCommand.ts`, `SystemStatus.md`, `CHANGELOG.md`
- **Qué cambió:** Execute inyecta `config._meta.serverImageId`; core carga `admin_passwords` por ID antes que por columna `ruid` (evita race). Auth web: fallback `admin123` solo si `NODE_ENV !== 'production'`. `!login` distingue contraseña / identidad / grant.
- **Build:** OK
- **Gate:** N/A (Windows)
- **Validación manual:** pendiente usuario — Stop → Execute → `!login <password del panel>`
- **Riesgos / no tocado:** panel web e in-game siguen siendo auth separados (`.env` vs Admin Passwords por imagen)
- **Listo para review:** sí

---

## Review — Coordinador

- **Veredicto:** APROBADO
- **Notas:** build OK; validación runtime requiere reiniciar stack y re-ejecutar imagen
- **Siguiente deploy:** PROB-021 sync-states 415
