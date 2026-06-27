# DEPLOY-NNN — [título corto]

| Campo | Valor |
|-------|-------|
| **Estado** | PENDIENTE / EN CURSO / EN REVIEW / APROBADO / RECHAZADO |
| **Sprint** | Sprint N |
| **Worker** | (nombre turno agente) |
| **Coordinador** | |
| **Creado** | YYYY-MM-DD |

---

## Objetivo

(1–2 oraciones: qué debe quedar resuelto al aprobar este deploy)

## PROBs en scope

| PROB | Severidad | Objetivo del worker |
|------|-----------|---------------------|
| PROB-xxx | 🔴/🟠/🟡 | |

## Archivos permitidos

Lista explícita — el worker **no edita fuera** de esta lista:

- `path/to/file.ts`

## Prohibido en este deploy

- Features nuevas
- Refactors no ligados al PROB
- Tocar subsistemas no listados
- Commits / push / deploy VM

## Criterios de cierre

- [ ] Fix mínimo implementado
- [ ] `npm run build` OK
- [ ] `npm run agent-deploy:gate -- DEPLOY-NNN` OK
- [ ] SystemStatus / CHANGELOG actualizados si corresponde
- [ ] Handoff completo abajo

## Contexto técnico (coordinador)

(Links a logs, hipótesis, archivos clave — el worker lee esto antes de codear)

---

## Handoff — Worker

*(Completar el worker al terminar)*

- **Agente / turno:**
- **PROBs tocados:**
- **Archivos modificados:**
- **Qué cambió:**
- **Build:** OK / FAIL
- **Gate:** OK / FAIL / N/A
- **Riesgos / no tocado:**
- **Listo para review:** sí / no

---

## Review — Coordinador

- **Veredicto:** PENDIENTE / APROBADO / CORREGIR / RECHAZADO
- **Notas:**
- **Siguiente deploy:**
