---
name: agent-deploy-worker
description: >-
  Ejecuta un deploy de agente en MikuServerPro siguiendo el manifest activo.
  Usar cuando el humano o coordinador asigna DEPLOY-xxx, sprint de fixes, o
  dice "agent deploy", "worker deploy", o indica un PROB con manifest en docs/deploys/.
disable-model-invocation: true
---

# Agent Deploy — Worker

Sos un **agente worker**. Implementás **solo** lo que dice el manifest. El coordinador revisa tu handoff.

## Antes de codear (orden fijo)

1. Leer `docs/AGENT-DEPLOY.md`
2. Leer el manifest asignado (`docs/deploys/DEPLOY-xxx.md`)
3. Leer `SystemStatus.md` → filas de los PROBs del manifest
4. Leer `AGENTS.md` + reglas `.cursor/rules/`

## Reglas de oro

| Hacer | No hacer |
|-------|----------|
| Fix mínimo del PROB asignado | Features, refactors amplios, seguridad extra |
| Reutilizar funciones/patrones existentes | Duplicar lógica ya presente en otro módulo |
| Tocar **solo** archivos listados en manifest | Archivos fuera de scope (pedir ampliación al coordinador) |
| `npm run build` si tocaste TS | Commits (salvo orden explícita) |
| Completar sección **Handoff** del manifest | Cerrar PROB sin evidencia en handoff |

## Flujo de trabajo

```
1. Confirmar scope (PROBs + archivos permitidos)
2. Implementar fix mínimo
3. npm run build  (obligatorio si hay TS)
4. bash scripts/agent-deploy-gate.sh DEPLOY-xxx  (si existe el manifest)
5. Completar Handoff en docs/deploys/DEPLOY-xxx.md
6. Reportar al coordinador — NO auto-mergear ni deploy VM
```

## Verificación post-fix (coordinador usa esto)

Tras tu handoff, el coordinador corre:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
Invoke-WebRequest http://localhost:3000/api/debug/report -OutFile report.txt
```

Vos podés pre-validar lo mismo antes del handoff. Si `@SECTION ALERTS` tiene `[FAIL]` causado por tu cambio, corregí antes de entregar.

## Handoff obligatorio (copiar al manifest)

```markdown
## Handoff — Worker

- **Agente / turno:**
- **PROBs tocados:**
- **Archivos modificados:**
- **Qué cambió (1–3 oraciones):**
- **Build:** OK / FAIL
- **Gate:** OK / FAIL
- **Riesgos / no tocado:**
- **Listo para review coordinador:** sí / no
```

## Anti-patrones (rechazo automático del coordinador)

- Nuevo helper de 3 líneas que debería ser inline
- Segundo `MatchStatsManager` / listener duplicado para lo mismo
- `console.log` de debug olvidados
- PROB cerrado en SystemStatus sin fila en CHANGELOG
- Changelog pegado en SystemStatus.md
- Cambios en `web/` cuando el PROB es solo `core/`

## GameLoop (prioridad máxima del proyecto)

Si tocás `core/src/shared/gameloop/` o `EventBus`:

- Un solo loop activo debe reaccionar a `game.start/stop/victory`
- Stats de partido solo en `MatchLoop`, no duplicar en handlers globales
- `EventBus.offEvent` debe remover el wrapper registrado en `onEvent`

Ver evidencia en `SystemStatus.md` → sección GameLoop PROB-028.
