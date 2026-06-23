import { CommandHandler, CommandContext, CommandResult, PermissionLevel } from '../types/CommandTypes';
import { MatchManager } from '../../../shared/teams/MatchManager';

export class CamisetasCommand implements CommandHandler {
  name = 'camisetas';
  description = 'Cambia las camisetas a un partido aleatorio';
  detailedHelp = '📑 !camisetas : Selecciona y aplica camisetas de un partido aleatorio a los equipos actuales.';
  usage = '!camisetas';
  permission = PermissionLevel.PLAYER;
  category = 'game';
  cooldown = 10;

  async execute(context: CommandContext): Promise<CommandResult> {
    const { ruid } = context;

    try {
      const matchManager = new MatchManager();
      const randomMatch = matchManager.selectRandomMatch();

      if (!randomMatch) {
        return {
          success: false,
          error: '❌ No hay partidos disponibles para seleccionar camisetas.'
        };
      }

      // Get the Haxball room from the command context
      const haxballRoom = context.haxballRoom;
      if (!haxballRoom) {
        return {
          success: false,
          error: '❌ Sala no disponible.'
        };
      }

      // Apply the match kits
      const success = matchManager.applyMatchToHaxball(haxballRoom, randomMatch);

      if (success) {
        return {
          success: true,
          message: `🎽 Camisetas cambiadas: ${randomMatch.homeTeam} vs ${randomMatch.awayTeam}`
        };
      } else {
        return {
          success: false,
          error: '❌ Error aplicando las camisetas.'
        };
      }

    } catch (error) {
      return {
        success: false,
        error: '❌ Error cambiando las camisetas.'
      };
    }
  }
}