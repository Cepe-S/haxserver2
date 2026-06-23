import { CommandHandler, CommandContext, CommandResult, PermissionLevel } from '../types/CommandTypes';
import { STRINGS } from '../../../shared/strings';

/**
 * Comando !discord - Link del Discord
 */
export class DiscordCommand implements CommandHandler {
  name = 'discord';
  description = 'Link del Discord';
  detailedHelp = '📑 !discord : Muestra el enlace del servidor Discord oficial para unirse a la comunidad, participar en torneos y estar al día con novedades.';
  usage = '!discord';
  permission = PermissionLevel.PLAYER;
  category = 'social';
  cooldown = 10; // 10 segundos

  async execute(context: CommandContext): Promise<CommandResult> {
    return {
      success: true,
      message: STRINGS.scheduler.advertise
    };
  }
}