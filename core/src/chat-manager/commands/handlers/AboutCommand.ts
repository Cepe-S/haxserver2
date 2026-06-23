import { CommandHandler, CommandContext, CommandResult, PermissionLevel } from '../types/CommandTypes';
import { STRINGS, interpolateString } from '../../../shared/strings';

/**
 * Comando !about - Información del bot
 */
export class AboutCommand implements CommandHandler {
  name = 'about';
  description = 'Información del bot';
  detailedHelp = '📑 !about : Muestra información sobre el bot, versión y enlaces de soporte.';
  usage = '!about';
  permission = PermissionLevel.PLAYER;
  category = 'basic';

  async execute(context: CommandContext): Promise<CommandResult> {
    const launchTime = new Date().toLocaleString('es-ES');
    
    const message = interpolateString(STRINGS.command.about, {
      RoomName: 'MikuServerPro',
      _LaunchTime: launchTime
    });

    return {
      success: true,
      message
    };
  }
}