# Índice de deploys de agentes

| ID | Estado | PROBs | Notas |
|----|--------|-------|-------|
| [DEPLOY-001](DEPLOY-001-gameloop-stats.md) | APROBADO | PROB-028, PROB-024 | Stats prep Wave A |
| [DEPLOY-002](DEPLOY-002-player-cache.md) | APROBADO | PROB-022 | Stats prep Wave B |
| [DEPLOY-003](DEPLOY-003-stats-identity.md) | APROBADO | PROB-023, PROB-025 | Stats prep Wave C — **prep completa** |
| [DEPLOY-002b](DEPLOY-002b-backfill-grace.md) | APROBADO | backfill spam | |
| [DEPLOY-004](DEPLOY-004-stats-tops.md) | APROBADO | Stats tops | requiere `db push` + seed |
| [DEPLOY-005](DEPLOY-005-admin-passwords.md) | APROBADO | PROB-030 | Admin passwords por serverImageId |
| [DEPLOY-006](DEPLOY-006-debug-sprint.md) | APROBADO | PROB-031–035 | Debug Sprint — ver sub-deploys 006A–006E |
| [DEPLOY-007](DEPLOY-007-dynamic-stadium.md) | PENDIENTE | PROB-036–040 | Estadio dinámico + !mapa — ver 007A–007E |

Sub-deploys 006: [006A logs](DEPLOY-006A-logs-download.md) · [006B gameloop](DEPLOY-006B-gameloop-debug.md) · [006C database](DEPLOY-006C-database-debug.md) · [006D events](DEPLOY-006D-events-stats-debug.md) · [006E logger](DEPLOY-006E-logger-debug.md)

Sub-deploys 007: [007A registry](DEPLOY-007A-stadium-registry.md) · [007B selector](DEPLOY-007B-stadium-selector.md) · [007C vote](DEPLOY-007C-map-vote.md) · [007D matchloop](DEPLOY-007D-matchloop-stadium.md) · [007E config](DEPLOY-007E-map-vote-config.md)

Plan debug: [`docs/plans/debug-sprint-vNext.md`](../plans/debug-sprint-vNext.md) · Plan stats: [`docs/plans/stats-tops-vNext.md`](../plans/stats-tops-vNext.md) · Plan estadio: [`docs/plans/dynamic-stadium-vNext.md`](../plans/dynamic-stadium-vNext.md)

Plantilla: [`_TEMPLATE.md`](_TEMPLATE.md) · Proceso: [`../AGENT-DEPLOY.md`](../AGENT-DEPLOY.md)
