import { CommandHandler, CommandContext, CommandResult, PermissionLevel } from '../types/CommandTypes';
import { command } from '../../../shared/strings';

export class AcomerCommand implements CommandHandler {
  name = 'acomer';
  description = 'Te vas a comer, buen provecho';
  detailedHelp = '📑 !acomer : Te vas a comer y sales del servidor. El sistema enviará un mensaje de buen provecho a todos los jugadores.';
  usage = '!acomer';
  permission = PermissionLevel.PLAYER;
  category = 'social';
  cooldown = 0;

  async execute(context: CommandContext): Promise<CommandResult> {
    const { player, haxballRoom } = context;

    const farewellMessage = command.acomer.farewell.replace('{playerName}', player.name);
    
    // Kickear al jugador después de un delay
    if (haxballRoom) {
      setTimeout(async () => {
        try {
          await haxballRoom.kickPlayer(player.id, command.acomer.kickMessage, false);
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