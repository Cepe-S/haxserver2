import { CommandHandler, CommandContext, CommandResult, PermissionLevel } from '../types/CommandTypes';
import { SanctionManager } from '../../../shared/sanctions/SanctionManager';

/**
 * Comando !unban - Desbanear jugadores por auth
 */
export class UnbanCommand implements CommandHandler {
  name = 'unban';
  description = 'Desbanear un jugador';
  detailedHelp = '📑 !unban <auth> : Desbanea a un jugador usando su auth.';
  usage = '!unban <auth>';
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
        error: '❌ Uso: !unban <auth>. Ejemplo: !unban abc123def456'
      };
    }

    const auth = args[0].replace(/[#\s]/g, ''); // Limpiar auth

    try {
      const result = await this.sanctionManager.unbanPlayer(auth, player.auth, player.name);

      return {
        success: result.success,
        message: result.success ? `✅ ${result.message}` : undefined,
        error: result.success ? undefined : `❌ ${result.message}`
      };

    } catch (error) {
      return {
        success: false,
        error: '❌ Error al procesar el unban.'
      };
    }
  }
}