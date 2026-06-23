import { CommandHandler, CommandContext, CommandResult, PermissionLevel } from '../types/CommandTypes';
import { PlayerCacheManager } from '../../../shared/player/PlayerCacheManager';
import { AfkCommand } from './AfkCommand';

/**
 * Comando !mezclar - Mezcla jugadores entre equipos rojo y azul
 */
export class MezclarCommand implements CommandHandler {
  name = 'mezclar';
  description = 'Mezclar jugadores entre equipos';
  detailedHelp = '📑 !mezclar : Mezcla aleatoriamente a todos los jugadores entre el equipo rojo y azul. No afecta a espectadores ni jugadores AFK.';
  usage = '!mezclar';
  permission = PermissionLevel.ADMIN;
  category = 'admin';
  cooldown = 10;

  private playerCache = PlayerCacheManager.getInstance();

  async execute(context: CommandContext): Promise<CommandResult> {
    const { player } = context;

    try {
      // Obtener jugadores activos en equipos (no AFK, no espectadores)
      const redPlayers = this.playerCache.getPlayersInTeam(1).filter(p => !AfkCommand.isPlayerAfk(p.haxballId));
      const bluePlayers = this.playerCache.getPlayersInTeam(2).filter(p => !AfkCommand.isPlayerAfk(p.haxballId));
      
      const allActivePlayers = [...redPlayers, ...bluePlayers];
      
      if (allActivePlayers.length < 2) {
        return {
          success: false,
          error: '❌ Se necesitan al menos 2 jugadores activos en equipos para mezclar.'
        };
      }

      // Mezclar array aleatoriamente (Fisher-Yates shuffle)
      const shuffledPlayers = [...allActivePlayers];
      for (let i = shuffledPlayers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
      }

      // Asignar equipos alternadamente
      const moves: Array<{player: any, newTeam: number}> = [];
      for (let i = 0; i < shuffledPlayers.length; i++) {
        const newTeam = (i % 2) + 1; // Alterna entre 1 (rojo) y 2 (azul)
        moves.push({ player: shuffledPlayers[i], newTeam });
      }

      // Ejecutar movimientos
      if (!context.haxballRoom) {
        return {
          success: false,
          error: '❌ No se puede acceder a la sala de Haxball.'
        };
      }

      let movedCount = 0;
      for (const move of moves) {
        try {
          await this.movePlayerToTeam(context.haxballRoom, move.player.haxballId, move.newTeam);
          movedCount++;
          
          // Pequeño delay entre movimientos
          if (movedCount < moves.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.warn(`Failed to move player ${move.player.name} to team ${move.newTeam}`);
        }
      }

      return {
        success: true,
        message: `🔀 Equipos mezclados! ${movedCount} jugadores redistribuidos aleatoriamente.`
      };

    } catch (error) {
      return {
        success: false,
        error: '❌ Error al mezclar equipos.'
      };
    }
  }

  private async movePlayerToTeam(haxballRoom: any, playerId: number, team: number): Promise<void> {
    if (haxballRoom && haxballRoom.setPlayerTeam) {
      await haxballRoom.setPlayerTeam(playerId, team);
    } else {
      throw new Error('HaxballRoom not available');
    }
  }
}