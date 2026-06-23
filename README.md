# MikuServerPro — Haxbotron V2

Servidor headless de Haxball con panel web de administración.

## Para agentes

1. Leer **`AGENTS.md`**, **`SystemStatus.md`** y **`CHANGELOG.md`** (PROBs cerrados) antes de codear.
2. Al cerrar un PROB: quitar de `SystemStatus.md` y registrar en `CHANGELOG.md`.

## Inicio rápido

```bash
cp .env.example .env
npm start          # Desarrollo
npm run start:prod # Producción Windows (concurrently)
chmod +x deploy-linux.sh && ./deploy-linux.sh  # Producción Linux / GCE
```

| Servicio | URL |
|----------|-----|
| Dashboard | http://localhost:5173 |
| Web API | http://localhost:3000 |
| Core | http://localhost:3001 |

Login panel: `ADMIN_PASSWORD` (default `admin123`).

## Arquitectura

```
haxserver2/           ← raíz del repo (MikuServerPro)
├── SystemStatus.md   ← estado + PROBs activos
├── CHANGELOG.md      ← historial + PROBs cerrados
├── AGENTS.md         ← reglas para agentes
├── database/         SQLite + Prisma
├── core/             Haxball + Fastify :3001
└── web/              Panel :3000 + :5173
```

## Documentación

| Archivo | Contenido |
|---------|-----------|
| **SystemStatus.md** | Subsistemas, PROBs activos, sprints |
| **CHANGELOG.md** | Historial y PROBs cerrados |
| **AGENTS.md** | Flujo de trabajo agentes |
| **DEPLOYMENT.md** | Build y producción |
| **docs/BETA-GCE.md** | Checklist beta VM Google Cloud |
| **docs/LOGGING.md** | Errores, archivos logs, comandos VM |
| **docs/COMANDOS_SISTEMA.md** | Comandos in-game |
| **HUMAN_TODO_LIST_NOT_FOR_IA.md** | Pendientes humanos |

## Flujo operativo

1. Server Image en panel → Execute con token `thr1.…`
2. Gestionar sala vía chat o panel (1 sala activa max)

## Comandos npm

```bash
npm run build      # Compilar workspaces
npm run build:full # Compilar + db:setup (schema sync)
npm run clean      # Limpiar dist/node_modules (mantiene BD)
npm run db:setup   # Prisma sync manual
```

Stack: Node 18+, TypeScript, Fastify, Puppeteer, React, SQLite, Prisma.
