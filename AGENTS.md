# Guía para agentes — MikuServerPro

Sos un agente trabajando en un **servidor Haxball en recuperación**. El humano lidera; vos ejecutás fixes puntuales sin desviarte.

## Fuentes de verdad

| Archivo | Contenido |
|---------|-----------|
| **`SystemStatus.md`** | Estado de subsistemas (A–N), **solo PROBs activos**, sprints |
| **`CHANGELOG.md`** | Historial de cambios y **PROBs cerrados** (archivo) |

### Obligatorio en cada turno con cambios de código

1. Leer **`SystemStatus.md`** antes de tocar código.
2. Trabajar **solo** el PROB o subsistema asignado.
3. Al **cerrar un PROB**:
   - **Eliminar** su fila de la tabla activa en `SystemStatus.md`
   - Actualizar filas del subsistema afectado (✅ / ⚠️ / notas)
   - **Añadir** fila en `CHANGELOG.md` → sección PROBs resueltos + línea en Historial
4. Si el PROB **sigue abierto** (parcial): solo actualizar `SystemStatus.md`.
5. **Nunca** poner PROBs resueltos ni changelog en `SystemStatus.md`.

## Alcance permitido (default)

| Permitido | Prohibido sin orden humana |
|-----------|----------------------------|
| Fix de PROB-xxx activos | Features nuevas |
| Estabilidad / lifecycle | Mejoras de seguridad |
| Paridad legacy citada en PROB | Refactors grandes |
| Actualizar SystemStatus + CHANGELOG | Borrar datos de BD/jugadores |

## Dónde trabajar

```
haxserver2/             ← raíz del repo (MikuServerPro)
├── SystemStatus.md     ← estado + PROBs activos
├── CHANGELOG.md        ← historial + PROBs cerrados
├── core/
├── web/
├── database/
└── AGENTS.md
```

## Comandos útiles

```bash
npm run build          # Compilar (sin db:setup)
npm run build:full     # Compilar + prisma sync
npm run start:prod     # Windows — 3 procesos
npm run db:setup       # Schema / seed manual
```

## Flujo típico de fix

1. Humano indica `PROB-001`
2. Agente lee fila en SystemStatus + archivos listados
3. Fix mínimo + `npm run build` si tocó TS
4. **Cierra PROB:** quitar de SystemStatus → registrar en CHANGELOG
5. Reporta: qué cambió, PROBs activos que quedan

## Planes diferidos

Features analizadas pero **no** en scope actual → [`docs/plans/`](docs/plans/). No implementar salvo orden humana explícita.

## Errores comunes a evitar

- Dejar PROBs resueltos en la tabla activa
- Escribir changelog en SystemStatus.md
- Agregar `!map` u otros comandos no pedidos
- Olvidar CHANGELOG al cerrar un PROB
- Editar fuera de la raíz del repo

## Sprints (consultar SystemStatus)

| Sprint | PROBs |
|--------|-------|
| 1 Sala legacy | 001, 003, 007 |
| 2 Panel/datos | 008, 011, 012 |

Próximo ID nuevo: ver **Próximo ID libre** en SystemStatus.md.
