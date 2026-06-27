# HOTFIX — UI no muestra servers como Running

| Campo | Valor |
|-------|-------|
| **Estado** | APROBADO |
| **Culpable** | Deploy hardening `aa465fd` (sync huérfanos) — NO workers stats DEPLOY-001/002/003 |
| **Worker** | hotfix-ui-server-status |

---

## Síntoma

Execute crea la sala en core (funciona) pero la UI lista la imagen como `inactive`.

## Causa raíz (coordinador)

1. **Race en execute:** `serverImages.ts` marca BD `status: 'running'` **antes** de que core registre la sala (línea ~312). El `setInterval(syncServerImageStates, 60_000)` ve `running` sin ruid en core → resetea a `inactive`.

2. **Sync agresivo en error:** `getActiveRoomRuids()` devuelve `[]` si core falla/timeout → trata todas las imágenes running como huérfanas.

Introducido en commit `aa465fd` (PROB-027 orphan recovery). Hotfix `const→let` (agente 92bca53e) no causó esto.

## Fix requerido (mínimo)

1. **Execute:** persistir `running` + `roomLink` **solo después** de éxito `POST /api/rooms` al core. Mantener prevención de doble execute sin marcar running prematuramente.

2. **syncServerImageStates:** si `getActiveRoomRuids` falla → **no resetear** (skip sync, log warn). Distinguir "core vacío" vs "error de red".

3. Opcional: grace period (~90s) desde `updatedAt` antes de marcar huérfano.

## Archivos permitidos

- `web/backend/src/routes/serverImages.ts`

## Verificar

- `npm run build` (monorepo)
- Flujo manual: execute → GET `/api/server-images` debe mostrar `status: 'running'`

## Handoff — Worker

- **Agente / turno:** hotfix-ui-server-status (subagent worker)
- **PROBs tocados:** Regresión sync huérfanos post-aa465fd (UI inactive tras execute exitoso)
- **Archivos modificados:** `web/backend/src/routes/serverImages.ts`
- **Qué cambió (1–3 oraciones):** Execute persiste `running` + ruid + token + roomLink solo después de `POST /api/rooms` exitoso (elimina race con sync periódico). `getActiveRoomRuids()` devuelve `null` en error de core; `syncServerImageStates()` omite reset huérfano cuando `null` (warn log). Grace period 90s desde `updatedAt` antes de marcar huérfano. `isRoomActiveInCore` distingue activo/inactivo/desconocido para no resetear en execute si core no responde.
- **Build:** OK (`web/backend` tsc + root `npm run build` turbo 4/4)
- **Gate:** N/A (HOTFIX sin script gate dedicado)
- **Riesgos / no tocado:** Ventana concurrente entre validación y POST sin lock in-memory (estrecha). No tocado: core/, frontend/, stats deploys.
- **Listo para review coordinador:** sí

## Review — Coordinador

- **Veredicto:** APROBADO
- **Notas:** Fix alineado con causa raíz aa465fd. Validar manualmente execute → UI Running.
