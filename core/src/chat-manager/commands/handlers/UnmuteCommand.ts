import { CommandHandler, CommandContext, CommandResult, PermissionLevel } from '../types/CommandTypes';
import { SanctionManager } from '../../../shared/sanctions/SanctionManager';

/**
 * Comando !unmute - Desmutear jugadores por haxballId
 */
export class UnmuteCommand implements CommandHandler {
  name = 'unmute';
  description = 'Desmutear un jugador';
  detailedHelp = '📑 !unmute <id> : Desmutea a un jugador usando su ID de Haxball.';
  usage = '!unmute <id>';
  permission = PermissionLevel.ADMIN;
  category = 'admin';
  cooldown = 3;

  private sanctionManager: SanctionManager;

  constructor(sanctionManager: SanctionManager) {
    this.sanctionManager = sanctionManager;
  }

  async execute(context: CommandContext): Promise<CommandResult> {
    const { player, args } = context;

    if (args.length === 0) {
      return {
        success: false,
        error: '❌ Uso: !unmute <id>. Ejemplo: !unmute 5'
      };
    }

    const haxballId = parseInt(args[0]);
    if (isNaN(haxballId)) {
      return {
        success: false,
        error: '❌ ID inválido. Usa el número de ID de Haxball.'
      };
    }

    try {
      const result = await this.sanctionManager.unmutePlayer(haxballId, player.auth, player.name);

      return {
        success: result.success,
        message: result.success ? `🔊 ${result.message}` : undefined,
        error: result.success ? undefined : `❌ ${result.message}`
      };

    } catch (error) {
      return {
        success: false,
        error: '❌ Error al procesar el unmute.'
      };
    }
  }
}