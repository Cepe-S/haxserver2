import { CommandHandler, CommandContext, CommandResult, PermissionLevel } from '../types/CommandTypes';
import { command } from '../../../shared/strings';

export class NvCommand implements CommandHandler {
  name = 'nv';
  description = 'Te despides y sales del servidor';
  detailedHelp = command.helpman.nv;
  usage = '!nv';
  permission = PermissionLevel.PLAYER;
  category = 'social';
  cooldown = 0;

  async execute(context: CommandContext): Promise<CommandResult> {
    const { player, haxballRoom } = context;

    const farewellMessage = command.nv.farewell.replace('{playerName}', player.name);
    
    // Kickear al jugador después de un delay
    if (haxballRoom) {
      setTimeout(async () => {
        try {
          await haxballRoom.kickPlayer(player.id, command.nv.kickMessage, false);
        } catch (error) {
          // Ignore kick errors
        }
      }, 1000);
    }
    
    return {
      success: true,
      message: farewellMessage
    };
  }
}