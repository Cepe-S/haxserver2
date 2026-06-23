import { CommandHandler, CommandContext, CommandResult, PermissionLevel } from '../types/CommandTypes';
import { SanctionManager } from '../../../shared/sanctions/SanctionManager';

/**
 * Comando !mute - Mutear jugadores
 */
export class MuteCommand implements CommandHandler {
  name = 'mute';
  description = 'Mutear un jugador';
  detailedHelp = '📑 !mute <id/auth> <tiempo> [razón] : Mutea a un jugador. Tiempo en minutos (ej: 60*24 = 1 día). 0 = permanente.';
  usage = '!mute <id/auth> <tiempo> [razón]';
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
        error: '❌ Uso: !mute <id/auth> <tiempo> [razón]. Ejemplo: !mute 5 30 spam'
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
        'mute',
        duration,
        reason,
        player.auth,
        player.name
      );

      const timeText = duration === 0 ? 'permanente' : `${duration} minutos`;
      const targetName = targetPlayer.currentPlayer?.name || 'Jugador';

      // Si el jugador está conectado, actualizar cache de mute
      if (targetPlayer.currentPlayer) {
        await this.sanctionManager.cacheMuteStatus(targetPlayer.currentPlayer.id, targetPlayer.identityId);
      }

      return {
        success: true,
        message: `🔇 ${targetName} ha sido muteado por ${timeText}. Razón: ${reason}`
      };

    } catch (error) {
      return {
        success: false,
        error: '❌ Error al procesar el mute.'
      };
    }
  }
}