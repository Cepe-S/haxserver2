import { CommandHandler, CommandContext, CommandResult, PermissionLevel } from '../types/CommandTypes';
import { MapVoteManager } from '../../../shared/stadiums/MapVoteManager';

/**
 * Comando !mapa — votación para cambiar estadio cuando no es ideal para la cantidad de jugadores.
 */
export class MapaCommand implements CommandHandler {
  name = 'mapa';
  description = 'Vota para cambiar el mapa cuando no es ideal para los jugadores';
  detailedHelp = '📑 !mapa : Vota para cambiar el estadio cuando hay demasiados o pocos jugadores para el mapa actual. Requiere 60% de votos de quienes están en cancha.';
  usage = '!mapa';
  permission = PermissionLevel.PLAYER;
  category = 'basic';
  cooldown = 5;

  constructor(private getMapVoteManager: () => MapVoteManager | null) {}

  async execute(context: CommandContext): Promise<CommandResult> {
    const manager = this.getMapVoteManager();
    if (!manager) {
      return { success: false, error: '❌ Sistema de mapa no disponible.' };
    }

    const result = await manager.registerVote(context.player.id, context.player.team);
    if (!result.ok) {
      return { success: false, error: result.message };
    }

    return { success: true, message: result.message };
  }
}
