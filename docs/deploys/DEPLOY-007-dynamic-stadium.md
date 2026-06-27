# DEPLOY-007 — Estadio dinámico + votación !mapa (coordinador)

| Campo | Valor |
|-------|-------|
| **Estado** | APROBADO |
| **Sprint** | Gameplay — estadio dinámico |
| **Plan** | [`docs/plans/dynamic-stadium-vNext.md`](../plans/dynamic-stadium-vNext.md) |
| **Creado** | 2026-06-27 |

---

## Objetivo

Estadio según cantidad de jugadores + votación `!mapa` que cierra el partido con stats y reinicia en el mapa correcto.

---

## Sub-deploys

| ID | PROB | Foco | Estado |
|----|------|------|--------|
| [007A](DEPLOY-007A-stadium-registry.md) | PROB-036 | Metadata estadios (min/max players) | APROBADO |
| [007B](DEPLOY-007B-stadium-selector.md) | PROB-037 | Selector mejor estadio por count | APROBADO |
| [007C](DEPLOY-007C-map-vote.md) | PROB-038 | MapVoteManager + !mapa + hooks eventos | APROBADO |
| [007D](DEPLOY-007D-matchloop-stadium.md) | PROB-039 | MatchLoop inicio/fin/restart con selector | APROBADO |
| [007E](DEPLOY-007E-map-vote-config.md) | PROB-040 | Panel min/max editables + seed defaults | APROBADO |

---

## Orden de workers

```
Fase 1:  007A
Fase 2:  007B  +  007E (paralelo — archivos distintos)
Fase 3:  007C  (depende 007B)
Fase 4:  007D  (depende 007B + 007C)
Review:  coordinador + /api/debug/report
```

---

## Reglas del sprint

- **GameLoop intacto** — un listener por evento; stats solo vía `endMatch()`
- Votación **solo en MatchLoop activo**
- Conteo = red+blue (`getPlayerCount()` existente)
- **Rangos min/max:** defaults en `StadiumRegistry`; editables por imagen en panel (007E); runtime usa `resolveStadiumDefinitions`
- Fix mínimo; sin !map admin en este sprint

---

## Handoff — Coordinador

- **Build:** OK (`npm run build`, tsc core/web)
- **Execute:** sala `agora` (`ruid=pito`) — link nuevo activo
- **Debug report:** sin `[FAIL]`; WARNs preexistentes (listeners duplicados en EventBus)
- **Runtime:** `MapVoteEventHandler started`, `Mapa command registered`, training RUNNING
- **PROBs cerrados:** 036–040

---

## Review — Coordinador

- **Veredicto:** APROBADO
