# DEPLOY-004 — Stats tops Fase 2

| Campo | Valor |
|-------|-------|
| **Estado** | APROBADO |
| **Depende de** | DEPLOY-002b completado |
| **Worker** | deploy-004-stats-tops |

---

## Objetivo

Tops diarios/semanales/mensuales + `!goleadores` / `!asistidores` + script seed debug.

## Entregables

### 1. Schema Prisma `StatEvent`
```prisma
model StatEvent {
  id         String   @id @default(cuid())
  ruid       String
  identityId String
  type       String   // goal | assist
  recordedAt DateTime @default(now())
  identity   PlayerIdentity @relation(fields: [identityId], references: [id], onDelete: Cascade)
  @@index([ruid, type, recordedAt])
  @@index([identityId, recordedAt])
}
```
Run `npx prisma generate` in database/ (document in handoff; db push manual).

### 2. `MatchStatsManager.endMatch`
Al persistir partido: insertar N filas `StatEvent` por cada gol/asistencia del partido (batch o loop). Mantener upsert `PlayerStats` existente.

### 3. `LeaderboardService.ts` (nuevo)
- `getTopScorers(ruid, period: 'day'|'week'|'month'|'all', limit=10)`
- `getTopAssisters(...)` 
- Períodos: day=24h, week=7d, month=30d, all=PlayerStats o all events
- Join `PlayerName` o último nick para display

### 4. Comandos chat
- `GoleadoresCommand.ts` — `!goleadores [dia|semana|mes|global]`
- `AsistidoresCommand.ts` — `!asistidores [dia|semana|mes|global]`
- Patrón: leer `AboutCommand.ts`, registrar en `PlayerChatHandler.ts`
- Mensaje formateado top 10 en español, usar STRINGS si existen en `strings/index.ts`
- category: `stats`, permission: PUBLIC

### 5. `scripts/debugging_scripts/seed-stats-tops.ts`
- Crea 5-10 PlayerIdentity + names ficticios
- Inserta StatEvent distribuidos (hoy, ayer, hace 5 días, hace 20 días) para ruid configurable (env o arg `pito` / `main-beta-1`)
- README one-liner en comentario del script: `npx tsx scripts/debugging_scripts/seed-stats-tops.ts [ruid]`

## Archivos permitidos

- `database/prisma/schema.prisma`
- `core/src/shared/stats/MatchStatsManager.ts`
- `core/src/shared/stats/LeaderboardService.ts`
- `core/src/chat-manager/commands/handlers/GoleadoresCommand.ts`
- `core/src/chat-manager/commands/handlers/AsistidoresCommand.ts`
- `core/src/shared/events/handlers/PlayerChatHandler.ts`
- `scripts/debugging_scripts/seed-stats-tops.ts`
- `docs/COMANDOS_SISTEMA.md`
- `SystemStatus.md`, `CHANGELOG.md` (PROB-029 cerrar si aplica)

## Prohibido

- gameLoop, EventBus, web/, PlayerCacheManager (002b territory), commits

## Criterios cierre

- [x] `npm run build` monorepo OK
- [x] Handoff con instrucciones probar `!goleadores dia` tras seed

## Handoff — Worker

- **Agente / turno:** deploy-004-stats-tops worker (2026-06-26)
- **PROBs tocados:** ninguno activo cerrado (feature DEPLOY-004; PROB-029 no existía en tabla activa)
- **Archivos modificados:**
  - `database/prisma/schema.prisma` — modelo `StatEvent` + relación en `PlayerIdentity`
  - `core/src/shared/stats/MatchStatsManager.ts` — `insertStatEvents` en `savePlayerStats`
  - `core/src/shared/stats/LeaderboardService.ts` — **nuevo** `getTopScorers` / `getTopAssisters`
  - `core/src/chat-manager/commands/handlers/GoleadoresCommand.ts` — **nuevo**
  - `core/src/chat-manager/commands/handlers/AsistidoresCommand.ts` — **nuevo**
  - `core/src/shared/events/handlers/PlayerChatHandler.ts` — registro comandos stats
  - `scripts/debugging_scripts/seed-stats-tops.ts` — **nuevo** seed QA
  - `docs/COMANDOS_SISTEMA.md`, `SystemStatus.md`
- **Qué cambió (1–3 oraciones):** Se añadió tabla `StatEvent` para tops por período. Al finalizar partido, `MatchStatsManager` inserta eventos gol/asistencia además del upsert `PlayerStats`. Comandos `!goleadores` y `!asistidores` consultan `LeaderboardService` (day=24h, week=7d, month=30d, global=PlayerStats).
- **Build:** OK (`npm run build` — 4 packages)
- **Gate:** N/A en Windows (bash/WSL no disponible); build manual OK
- **Riesgos / no tocado:**
  - **`npx prisma db push` requerido** antes de probar en runtime (tabla `stat_events` no existe hasta push). Ejecutar con core detenido: `cd database && npx prisma generate && npx prisma db push`
  - `prisma generate` falló EPERM con core en ejecución (DLL bloqueado); re-ejecutar generate tras detener PM2/dev
  - Sin cambios gameLoop/EventBus/web
  - Partidos reales generan StatEvents solo tras db push + restart core
- **Listo para review coordinador:** sí

### Instrucciones de prueba

1. Detener core (`npm run start` / PM2).
2. Aplicar schema: `cd database && npx prisma generate && npx prisma db push`
3. `npm run build` desde raíz.
4. Seed (ruid de la sala activa, ej. `main-beta-1` o `pito`):
   ```bash
   npx tsx scripts/debugging_scripts/seed-stats-tops.ts main-beta-1
   ```
5. Arrancar sala y en chat:
   - `!goleadores dia` → top 10 goles últimas 24h (SeedGol_01 #1 con 5 goles)
   - `!goleadores semana` → incluye eventos de hace 5 días
   - `!asistidores mes` → asistencias últimos 30 días
   - `!goleadores global` → lifetime desde `PlayerStats`
6. Partido real: verificar logs `STATS SAVED` + filas nuevas en `stat_events` tras victoria.

## Review — Coordinador

- **Veredicto:** APROBADO
- **Pendiente humano:** `prisma db push` + seed + probar en sala antes de considerar cerrado en producción
