---
name: haxball-debug-players
description: >-
  External Haxball client bots for local gameplay debugging without modifying core.
  Use when testing GameLoop, balance, !mapa, commands, or verifying deploys.
  Runs scripts/debug-players REPL (node-haxball clients joining the hosted room).
---

# Haxball Debug Players — Script Externo

Herramienta **fuera del runtime** (`scripts/debug-players/`). Conecta clientes Haxball reales vía `node-haxball` a la sala que ya hostea MikuServerPro. **No hay código de bots en core/web.**

## Setup (una vez)

```bash
cd scripts/debug-players
npm install
```

## Uso

Con stack + sala running:

```bash
npm run debug-players
# o con ruid explícito:
npm run debug-players -- --ruid pito
```

REPL interactivo (`bots>`).

| Comando | Acción |
|---------|--------|
| `status` | sala, gameloop, estadio, bots |
| `join R1 1` | bot en rojo (1=red, 2=blue) |
| `say R1 !mapa` | chat/comando |
| `all say !mapa` | comando desde todos los bots |
| `match` | forzar partido (usa API debug existente) |
| `scenario map8` | 8 bots 4v4 + partido |
| `scenario map-vote` | test DEPLOY-007 completo |
| `clear` | desconectar todos los bots |

## APIs que usa (solo lectura/control debug ya existente)

Base web `:3000` — **no** endpoints propios de bots:

- `GET /api/server-images` — link de sala running
- `GET /api/debug/gameloop` — estadio / loop
- `POST /api/debug/gameloop/transition` — forzar training/match

## Verificación post-deploy (mapas)

1. Execute server image
2. `npm run debug-players`
3. `scenario map-vote`
4. `curl.exe http://localhost:3000/api/debug/report?ruid=pito`

**map8:** 8 jugadores → `futx4`. **map-vote:** 10 jugadores → mismatch → `!mapa` → quorum → nuevo estadio.

## Limitaciones

- Requiere red (WebRTC a servidores Haxball)
- Cada bot tarda ~1–3s en conectar
- Los bots son clientes reales: pasan por join handler, balance, anti-abuse
- Al salir del REPL, usar `clear` o Ctrl+C (desconecta bots)

## Archivos (solo scripts/)

```
scripts/debug-players/
  repl.mjs           — REPL interactivo
  BotClient.mjs      — un cliente node-haxball
  BotPool.mjs        — pool + escenarios
  lib/server-api.mjs — helpers HTTP → web debug
  package.json       — dependencia node-haxball (aislada)
```
