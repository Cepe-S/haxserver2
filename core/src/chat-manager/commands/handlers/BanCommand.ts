import { CommandHandler, CommandContext, CommandResult, PermissionLevel } from '../types/CommandTypes';
import { SanctionManager } from '../../../shared/sanctions/SanctionManager';

/**
 * Comando !ban - Banear jugadores
 */
export class BanCommand implements CommandHandler {
  name = 'ban';
  description = 'Banear un jugador';
  detailedHelp = '📑 !ban <id/auth> <tiempo> [razón] : Banea a un jugador. Tiempo en minutos (ej: 60*24 = 1 día). 0 = permanente.';
  usage = '!ban <id/auth> <tiempo> [razón]';
  permission = PermissionLevel.ADMIN;
  category = 'admin';
  cooldown = 3;

  private sanctionManager: SanctionManager;

  constructor(sanctionManager: SanctionManager) {
    this.sanctionManager = sanctionManager;
  }

  async execute(context: CommandContext): Promise<CommandResult> {
    const { player, args, ruid } = context;

    if (args.length < 2) {
      return {
        success: false,
        error: '❌ Uso: !ban <id/auth> <tiempo> [razón]. Ejemplo: !ban 5 60*24 spam'
      };
    }

    const identifier = args[0];
    const timeStr = args[1];
    const reason = args.slice(2).join(' ') || 'No especificada';

    try {
      // Parsear tiempo
      const duration = this.sanctionManager.parseTimeString(timeStr);
      if (duration < 0) {
        return {
          success: false,
          error: '❌ Tiempo inválido. Usa números o expresiones como 60*24'
        };
      }

      // Encontrar jugador
      const targetPlayer = await this.sanctionManager.findPlayerByIdOrAuth(identifier);
      if (!targetPlayer) {
        return {
          success: false,
          error: '❌ Jugador no encontrado. Usa ID de Haxball o auth.'
        };
      }

      // Crear sanción
      await this.sanctionManager.createSanction(
        targetPlayer.identityId,
        'ban',
        duration,
        reason,
        player.auth,
        player.name
      );

      // Kickear jugador si está conectado
      if (targetPlayer.currentPlayer) {
        const timeText = duration === 0 ? 'permanente' : `${duration} minutos`;
        const kickMessage = `🚫 Has sido baneado por ${timeText}. Razón: ${reason}. Puedes apelar en nuestro Discord.`;
        await this.sanctionManager.kickPlayerNow(targetPlayer.currentPlayer.id, kickMessage);
      }

      const timeText = duration === 0 ? 'permanente' : `${duration} minutos`;
      const targetName = targetPlayer.currentPlayer?.name || 'Jugador';

      return {
        success: true,
        message: `✅ ${targetName} ha sido baneado por ${timeText}. Razón: ${reason}`
      };

    } catch (error) {
      return {
        success: false,
        error: '❌ Error al procesar el ban.'
      };
    }
  }
}