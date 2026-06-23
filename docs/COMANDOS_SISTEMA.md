# SISTEMA DE COMANDOS - HAXBOTRON V2

## CLASIFICACIÓN POR PRIORIDAD Y COMPLEJIDAD

### 🟢 FASE 1: COMANDOS BÁSICOS (Sin implementaciones pesadas)
**Prioridad**: CRÍTICA - Implementar primero

#### Comandos de Información (0 parámetros)
- `!help` - Muestra ayuda general
- `!about` - Información del bot
- `!list` - Lista jugadores por equipo
- `!streak` - Muestra racha actual
- `!poss` - Posesión del balón
- `!discord` - Link del Discord
- `!tier` - Información del sistema de tiers

#### Comandos con 1 Parámetro
- `!help <comando>` - Ayuda específica de comando
- `!list <red|blue|spec|mute|afk>` - Lista específica
- `!afk [razón]` - Marcar como AFK (razón opcional)

#### Comandos con 2+ Parámetros
- `!stats [#ID]` - Estadísticas (sin parámetro = propias, con ID = de otro)

### 🟡 FASE 2: COMANDOS DE ADMINISTRACIÓN
**Prioridad**: ALTA - Después de comandos básicos

#### Comandos de Admin (1-2 parámetros)
- `!mute #ID` - Mutear jugador
- `!freeze` - Congelar chat global
- `!super #ID` - Dar admin a jugador
- `!balance` - Forzar balance de equipos
- `!map [nombre]` - Cambiar mapa (sin parámetro = lista mapas)

#### Comandos de Sanciones (2-3 parámetros)
- `!ban #ID [tiempo] [razón]` - Banear jugador
- `!unban #ID` - Desbanear jugador
- `!banlist` - Lista de baneados
- `!checkban #ID` - Verificar ban de jugador
- `!clearbans` - Limpiar todos los bans

### 🔴 FASE 3: COMANDOS AVANZADOS
**Prioridad**: MEDIA - Implementar después

#### Comandos de Estadísticas
- `!ranking` - Top 20 jugadores
- `!goleadores [dia|mes]` - Top goleadores
- `!asistidores [dia|mes]` - Top asistidores
- `!statsreset` - Reset estadísticas

#### Comandos de Juego
- `!vote #ID` - Votar expulsar jugador
- `!cola` - Ver posición en cola
- `!scout` - Modo observador

#### Comandos Sociales
- `!llamaradmin [razón]` - Llamar administrador
- `!nv` - Despedirse y salir
- `!bb` - Despedirse y salir
- `!memide` - Comando humorístico

### 🟣 FASE 4: COMANDOS DE PERSONALIZACIÓN
**Prioridad**: BAJA - Implementar al final

#### Personalización
- `!avatar <caracteres>` - Cambiar avatar (1-2 caracteres)
- `!camisetas` - Cambiar camiseta
- `!size <tamaño>` - Cambiar tamaño

## ESTRUCTURA DE PERMISOS

### Niveles de Permisos
```typescript
enum PermissionLevel {
  PLAYER = 0,      // Jugador normal
  ADMIN = 1,       // Administrador
  SUPER_ADMIN = 2  // Super administrador
}
```

### Asignación de Permisos por Comando

#### PLAYER (Nivel 0)
- `!help`, `!about`, `!list`, `!stats`, `!streak`, `!poss`
- `!discord`, `!tier`, `!afk`, `!vote`, `!cola`
- `!llamaradmin`, `!nv`, `!bb`, `!memide`
- `!avatar`, `!camisetas`, `!size`

#### ADMIN (Nivel 1)
- Todos los comandos de PLAYER +
- `!mute`, `!freeze`, `!balance`
- `!ban` (solo temporal), `!unban`, `!banlist`, `!checkban`

#### SUPER_ADMIN (Nivel 2)
- Todos los comandos de ADMIN +
- `!super`, `!map`, `!clearbans`
- `!ban` (permanente), `!statsreset`
- `!powershotadmin`, comandos de debug

## SINTAXIS DE COMANDOS

### Formato General
```
!<comando> [parámetro1] [parámetro2] [parámetro3]
```

### Tipos de Parámetros
- `#ID` - ID numérico de jugador (ej: #12)
- `<requerido>` - Parámetro obligatorio
- `[opcional]` - Parámetro opcional
- `<opción1|opción2>` - Opciones específicas

### Ejemplos de Uso
```
!help                    // Ayuda general
!help stats             // Ayuda del comando stats
!list red               // Lista equipo rojo
!stats                  // Mis estadísticas
!stats #12              // Estadísticas del jugador #12
!mute #5                // Mutear jugador #5
!ban #3 30 spam         // Banear jugador #3 por 30 min por spam
!afk comiendo           // AFK con razón
!goleadores dia         // Top goleadores del día
```

## VALIDACIONES REQUERIDAS

### Validación de Parámetros
1. **ID de Jugador**: Verificar que existe y está conectado
2. **Permisos**: Verificar nivel de permiso del ejecutor
3. **Sintaxis**: Validar número y tipo de parámetros
4. **Cooldowns**: Algunos comandos tienen tiempo de espera

### Mensajes de Error Estándar
- `❌ Comando incorrecto. 📑 Usa !help o !help COMMAND para más detalles.`
- `❌ Solo los administradores pueden usar este comando.`
- `❌ No está conectado. Debes especificar un ID en el formato #número.`
- `❌ Este comando no está habilitado en esta sala.`

## IMPLEMENTACIÓN POR FASES

### FASE 1 - Comandos Básicos (Semana 1)
1. `!help` y `!help <comando>`
2. `!about`
3. `!list` y variantes
4. `!stats` básico
5. `!afk`

### FASE 2 - Administración (Semana 2)
1. `!mute` y `!freeze`
2. `!super` y sistema de permisos
3. `!balance` básico
4. `!map` con estadios existentes

### FASE 3 - Sanciones (Semana 3)
1. `!ban`, `!unban`, `!banlist`
2. `!checkban`, `!clearbans`
3. Sistema de sanciones en BD

### FASE 4 - Avanzados (Semana 4+)
1. Comandos de estadísticas
2. Sistema de votaciones
3. Comandos sociales
4. Personalización

## ARQUITECTURA DEL SISTEMA

### Componentes Principales
1. **CommandParser** - Parsea mensajes y extrae comandos
2. **CommandRegistry** - Registro de todos los comandos
3. **PermissionManager** - Gestión de permisos
4. **CommandHandler** - Interfaz base para handlers
5. **CommandExecutor** - Ejecuta comandos con validaciones

### Flujo de Ejecución
```
Chat Message → CommandParser → PermissionCheck → CommandHandler → Response
```

Esta estructura nos permitirá implementar comandos de forma incremental y mantenible.