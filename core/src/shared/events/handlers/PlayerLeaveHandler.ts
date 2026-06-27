import { eventBus } from '../EventBus';
import { HAXBALL_EVENTS, HaxballPlayerLeaveEvent } from '../HaxballEvents';
import { PlayerIdentityManager } from '../../player/PlayerIdentityManager';
import { createLogger } from '../../logger/Logger';
import { PlayerCacheManager } from '../../player/PlayerCacheManager';

/**
 * Handler para eventos de jugador saliendo
 * Basado en onPlayerLeaveListener del sistema viejo
 */
export class PlayerLeaveHandler {
  private logger = createLogger('PlayerLeaveHandler');
  private playerIdentityManager = PlayerIdentityManager.getInstance();
  private playerCache = PlayerCacheManager.getInstance();

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.onEvent(HAXBALL_EVENTS.PLAYER_LEAVE, this.handlePlayerLeave.bind(this));
  }

  private async handlePlayerLeave(event: HaxballPlayerLeaveEvent): Promise<void> {
    const { player, timestamp } = event;
    
    this.logger.info(`[PlayerLeave] ${player.name}#${player.id} left`);

    try {
      // Actualizar tiempo de salida en la base de datos
      await this.updatePlayerLeaveTime(player, timestamp);

      // Verificar si era AFK
      const wasAfk = await this.checkIfPlayerWasAfk(player);
      
      // Limpiar del cache unificado
      this.playerCache.removePlayer(player.id);

      // Emitir evento interno para otros subsistemas
      eventBus.emitEvent('player.left', {
        playerId: player.id,
        playerName: player.name,
        auth: player.auth,
        conn: player.conn,
        wasAfk,
        timestamp
      });

      // Notificar al sistema de administradores
      eventBus.emitEvent('admin.player.left', {
        playerId: player.id
      });

      // Log para debug de match
      this.logMatchDebugAction(player, wasAfk);

    } catch (error) {
      this.logger.error(`[PlayerLeave] Error processing leave for ${player.name}#${player.id}:`, error);
    }
  }

  private async updatePlayerLeaveTime(player: any, timestamp: number): Promise<void> {
    try {
      const { db } = require('@mikuserverpro/database');
      const leftAt = new Date(timestamp);
      const cached = this.playerCache.getPlayerByHaxballId(player.id);

      const orConditions: Array<{ conn?: string; haxballId?: number; playerId?: string }> = [
        { conn: player.conn },
        { haxballId: player.id }
      ];
      if (cached?.identityId) {
        orConditions.push({ playerId: cached.identityId });
      }

      await db.connection.updateMany({
        where: {
          leftAt: null,
          OR: orConditions
        },
        data: { leftAt }
      });
      
      this.logger.debug(`[PlayerLeave] Leave time updated for ${player.name}`);
    } catch (error) {
      this.logger.error(`[PlayerLeave] Failed to update leave time for ${player.name}:`, error);
    }
  }

  private async checkIfPlayerWasAfk(player: any): Promise<boolean> {
    try {
      const cachedPlayer = this.playerCache.getPlayerByHaxballId(player.id);
      return cachedPlayer?.isAfk || false;
    } catch (error) {
      this.logger.warn(`[PlayerLeave] Failed to check AFK status for ${player.name}:`, error);
      return false;
    }
  }

  private logMatchDebugAction(player: any, wasAfk: boolean): void {
    // TODO: Implementar sistema de debug de match
    // Basado en el sistema viejo:
    // window.gameRoom.matchDebugActions.unshift({
    //   timestamp: Date.now(),
    //   action: "PLAYER_LEAVE",
    //   playerName: player.name,
    //   playerId: player.id,
    //   details: `Player left the room${wasAfk ? ' (was AFK)' : ''}`
    // });
    
    this.logger.debug(`[PlayerLeave] Match debug action logged for ${player.name}${wasAfk ? ' (was AFK)' : ''}`);
  }
}