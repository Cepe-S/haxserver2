import { CommandHandler, CommandContext, CommandResult, PermissionLevel } from '../types/CommandTypes';
import { STRINGS, interpolateString } from '../../../shared/strings';

/**
 * Comando !afk - Sistema AFK
 */
export class AfkCommand implements CommandHandler {
  name = 'afk';
  description = 'Activa o desactiva el modo AFK';
  detailedHelp = '📑 !afk [razón] : Activa o desactiva el modo AFK. Te mueve a espectador y te marca como ausente. Incluye una razón opcional. Si permaneces AFK demasiado tiempo, serás expulsado automáticamente.';
  usage = '!afk [razón]';
  permission = PermissionLevel.PLAYER;
  category = 'basic';
  cooldown = 3;

  // Estado AFK global (compartido entre todas las instancias)
  private static afkPlayers = new Map<number, {
    reason: string;
    timestamp: number;
    previousTeam: number;
    isAdmin: boolean;
  }>();

  private static afkTimeouts = new Map<number, NodeJS.Timeout>();

  async execute(context: CommandContext): Promise<CommandResult> {
    const { player, args, haxballRoom } = context;
    
    const isCurrentlyAfk = AfkCommand.afkPlayers.has(player.id);
    
    if (isCurrentlyAfk) {
      // Salir del AFK
      return await this.unsetAfk(player, haxballRoom);
    } else {
      // Entrar en AFK
      const reason = args.length > 0 ? args.join(' ') : '';
      return await this.setAfk(player, reason, haxballRoom);
    }
  }

  private async setAfk(player: any, reason: string, haxballRoom?: any): Promise<CommandResult> {
    const afkData = {
      reason: reason ? ` (${reason})` : '',
      timestamp: Date.now(),
      previousTeam: player.team,
      isAdmin: player.admin || false
    };

    AfkCommand.afkPlayers.set(player.id, afkData);

    // Mover a espectador si no está ya
    if (player.team !== 0 && haxballRoom) {
      try {
        await haxballRoom.setPlayerTeam(player.id, 0);
        
        // Emitir evento para que el sistema de balance se entere
        const { eventBus } = require('../../../shared/events/EventBus');
        eventBus.emitEvent('player.afk.set', {
          playerId: player.id,
          playerName: player.name,
          previousTeam: afkData.previousTeam,
          reason: afkData.reason,
          timestamp: afkData.timestamp
        });
      } catch (error) {
        console.error('Error moving player to spectator:', error);
      }
    }

    // Configurar timeout para jugadores normales (5 minutos)
    if (!afkData.isAdmin) {
      const timeout = setTimeout(() => {
        this.kickAfkPlayer(player.id, haxballRoom);
      }, 5 * 60 * 1000);

      AfkCommand.afkTimeouts.set(player.id, timeout);
      
      // Enviar mensaje privado con tiempo restante
      if (haxballRoom && haxballRoom.sendMessage) {
        setTimeout(async () => {
          try {
            await haxballRoom.sendMessage(
              player.id,
              `⏰ Estás AFK. Tienes 5 minutos para volver o serás expulsado automáticamente. Usa !afk para volver.`,
              0xFFAA00,
              'bold',
              1
            );
          } catch (error) {
            console.error('Error sending AFK warning:', error);
          }
        }, 1000);
      }
    }

    const message = interpolateString(STRINGS.command.afk.setAfk, {
      targetName: player.name,
      ticketTarget: player.id,
      targetAfkReason: afkData.reason
    });

    return {
      success: true,
      message
    };
  }

  private async unsetAfk(player: any, haxballRoom?: any): Promise<CommandResult> {
    const afkData = AfkCommand.afkPlayers.get(player.id);
    if (!afkData) {
      return {
        success: false,
        error: '❌ No estás en modo AFK.'
      };
    }

    // Limpiar timeout si existe
    const timeout = AfkCommand.afkTimeouts.get(player.id);
    if (timeout) {
      clearTimeout(timeout);
      AfkCommand.afkTimeouts.delete(player.id);
    }

    // Remover del registro AFK
    AfkCommand.afkPlayers.delete(player.id);

    // Emitir evento para que el sistema de balance maneje el retorno
    const { eventBus } = require('../../../shared/events/EventBus');
    eventBus.emitEvent('player.afk.unset', {
      playerId: player.id,
      playerName: player.name,
      previousTeam: afkData.previousTeam,
      timestamp: Date.now()
    });
    
    // El sistema de balance se encargará de asignar el equipo apropiado
    // No movemos directamente para evitar conflictos con el balanceador

    const message = interpolateString(STRINGS.command.afk.unAfk, {
      targetName: player.name,
      ticketTarget: player.id
    });

    return {
      success: true,
      message
    };
  }

  private async kickAfkPlayer(playerId: number, haxballRoom?: any): Promise<void> {
    const afkData = AfkCommand.afkPlayers.get(playerId);
    if (!afkData) return;

    // Limpiar registros
    AfkCommand.afkPlayers.delete(playerId);
    AfkCommand.afkTimeouts.delete(playerId);

    // Kick player por AFK - usar referencia del contexto original
    if (haxballRoom && haxballRoom.kickPlayer) {
      try {
        await haxballRoom.kickPlayer(playerId, 'AFK por más de 5 minutos', false);
        console.log(`Kicked AFK player ${playerId}`);
      } catch (error) {
        console.error('Error kicking AFK player:', error);
      }
    }
  }

  // Métodos estáticos para acceso global
  public static isPlayerAfk(playerId: number): boolean {
    return AfkCommand.afkPlayers.has(playerId);
  }

  public static getAfkPlayers(): Array<{id: number, reason: string, timestamp: number}> {
    return Array.from(AfkCommand.afkPlayers.entries()).map(([id, data]) => ({
      id,
      reason: data.reason,
      timestamp: data.timestamp
    }));
  }

  public static onPlayerLeave(playerId: number): void {
    const timeout = AfkCommand.afkTimeouts.get(playerId);
    if (timeout) {
      clearTimeout(timeout);
      AfkCommand.afkTimeouts.delete(playerId);
    }
    AfkCommand.afkPlayers.delete(playerId);
  }
}