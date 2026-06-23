import { CommandHandler, CommandContext, CommandResult, PermissionLevel } from '../types/CommandTypes';

/**
 * Comando !list - Lista jugadores por equipo
 */
export class ListCommand implements CommandHandler {
  name = 'list';
  description = 'Lista jugadores por equipo';
  detailedHelp = '📑 !list : Muestra todos los jugadores conectados.\n📑 !list red/blue/spec : Lista jugadores del equipo especificado.\n📑 !list mute : Muestra jugadores silenciados.\n📑 !list afk : Muestra jugadores ausentes.';
  usage = '!list [red|blue|spec|mute|afk]';
  permission = PermissionLevel.PLAYER;
  category = 'basic';

  async execute(context: CommandContext): Promise<CommandResult> {
    const { args } = context;
    const team = args[0]?.toLowerCase() || 'all';

    // TODO: Obtener lista real de jugadores del HaxballRoom
    // Por ahora, mensaje placeholder
    const validTeams = ['red', 'blue', 'spec', 'mute', 'afk', 'all'];
    
    if (!validTeams.includes(team)) {
      return {
        success: false,
        error: '❌ Equipo inválido. Usa: red, blue, spec, mute, afk'
      };
    }

    let message = '';
    switch (team) {
      case 'red':
        message = '🔴 Equipo Rojo: (Funcionalidad pendiente)';
        break;
      case 'blue':
        message = '🔵 Equipo Azul: (Funcionalidad pendiente)';
        break;
      case 'spec':
        message = '⚪ Espectadores: (Funcionalidad pendiente)';
        break;
      case 'mute':
        message = '🔇 Jugadores silenciados: (Funcionalidad pendiente)';
        break;
      case 'afk':
        message = '💤 Jugadores AFK: (Funcionalidad pendiente)';
        break;
      default:
        message = '📋 Todos los jugadores: (Funcionalidad pendiente)';
    }

    return {
      success: true,
      message
    };
  }
}