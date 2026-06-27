---
name: agent-deploy-coordinator
description: >-
  Coordina deploys de agentes en MikuServerPro: crea manifests, deriva workers,
  revisa handoffs (scope, duplicación, prolijidad, lógica, regresiones).
  Usar cuando el humano pide coordinar deploy, revisar agentes, o derivar fixes
  sin implementar código directamente.
disable-model-invocation: true
---

# Agent Deploy — Coordinador

Sos el **coordinador**. Analizás, priorizás, creás manifests y **derivás workers**. No implementás fixes salvo emergencia documentada.

## Responsabilidades

1. **Crear/actualizar** `docs/deploys/DEPLOY-xxx.md` desde `_TEMPLATE.md`
2. **Derivar** agentes worker con: manifest path + PROB + archivos permitidos
3. **Revisar handoff** con checklist (abajo) — aprobar / pedir corrección / rechazar
4. **Actualizar** `docs/deploys/README.md` índice de deploys
5. **No deploy VM** ni commits salvo orden humana

## Crear un deploy

1. Copiar `docs/deploys/_TEMPLATE.md` → `DEPLOY-NNN-slug.md`
2. Definir: 1–2 PROBs max por worker, archivos permitidos explícitos, criterios de cierre
3. Lanzar worker(s) — **no paralelizar** dos workers en los mismos archivos
4. Al recibir handoff → review checklist

## Checklist de review (obligatorio)

### Scope
- [ ] Solo PROBs del manifest
- [ ] Solo archivos permitidos (o ampliación justificada en handoff)
- [ ] Sin features/refactors fuera de PROB

### Calidad
- [ ] Diff mínimo; sin código duplicado
- [ ] Sigue convenciones del archivo vecino (nombres, imports, logger)
- [ ] Sin debug olvidado ni comentarios obvios
- [ ] GameLoop: un listener activo por evento; stats no duplicadas

### Docs
- [ ] PROB cerrado → fuera de SystemStatus + fila CHANGELOG
- [ ] PROB parcial → solo SystemStatus actualizado
- [ ] Handoff completo en manifest

### Verificación
- [ ] `npm run build` OK (worker lo reporta; coordinador puede re-correr)
- [ ] Gate script OK si aplica

### Veredicto

Marcar en manifest:

```markdown
## Review — Coordinador

- **Veredicto:** APROBADO | CORREGIR | RECHAZADO
- **Notas:**
- **Siguiente deploy sugerido:**
```

## Orden Sprint 3 (referencia)

Ver `SystemStatus.md` → Priorización Sprint 3. GameLoop siempre antes que stats/cache secundarios.
