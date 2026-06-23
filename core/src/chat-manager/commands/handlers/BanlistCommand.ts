import { CommandHandler, CommandContext, CommandResult, PermissionLevel } from '../types/CommandTypes';
import { SanctionManager } from '../../../shared/sanctions/SanctionManager';

/**
 * Comando !banlist - Lista de jugadores baneados
 */
export class BanlistCommand implements CommandHandler {
  name = 'banlist';
  description = 'Ver lista de jugadores baneados';
  detailedHelp = '📑 !banlist : Muestra la lista de jugadores baneados con su último nombre conocido.';
  usage = '!banlist';
  permission = PermissionLevel.ADMIN;
  category = 'admin';
  cooldown = 5;

  private sanctionManager: SanctionManager;

  constructor(sanctionManager: SanctionManager) {
    this.sanctionManager = sanctionManager;
  }

  async execute(context: CommandContext): Promise<CommandResult> {
    try {
      const bannedPlayers = await this.sanctionManager.getBannedPlayers();

      if (bannedPlayers.length === 0) {
        return {
          success: true,
          message: '📋 No hay jugadores baneados actualmente.'
        };
      }

      const lines = ['📋 JUGADORES BANEADOS:'];
      
      bannedPlayers.forEach((ban, index) => {
        const date = ban.createdAt.toLocaleDateString();
        const reason = ban.reason ? ` (${ban.reason})` : '';
        const admin = ban.adminName ? ` por ${ban.adminName}` : '';
        
        lines.push(`${index + 1}. ${ban.name} [${ban.auth}] - ${date}${admin}${reason}`);
      });

      // Limitar a 10 líneas para evitar spam
      if (lines.length > 11) {
        lines.splice(11);
        lines.push(`... y ${bannedPlayers.length - 10} más.`);
      }

      return {
        success: true,
        message: lines.join('\n')
      };

    } catch (error) {
      return {
        success: false,
        error: '❌ Error al obtener la lista de baneados.'
      };
    }
  }
}