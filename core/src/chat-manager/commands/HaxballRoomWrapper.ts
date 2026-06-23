import { HaxballRoomInterface } from './types/CommandTypes';
import { createLogger } from '../../shared/logger/Logger';

/**
 * Wrapper profesional para acceso controlado al room de Haxball desde comandos
 */
export class HaxballRoomWrapper implements HaxballRoomInterface {
  private logger = createLogger('HaxballRoomWrapper');

  constructor(private haxballRoom: any) {}

  async setPlayerTeam(playerId: number, team: number): Promise<void> {
    try {
      if (!this.haxballRoom) {
        throw new Error('Haxball room not available');
      }

      // Validar parámetros
      if (typeof playerId !== 'number' || playerId < 0) {
        throw new Error('Invalid player ID');
      }

      if (typeof team !== 'number' || team < 0 || team > 2) {
        throw new Error('Invalid team (must be 0, 1, or 2)');
      }

      await this.haxballRoom.setPlayerTeam(playerId, team);
      this.logger.debug(`Player ${playerId} moved to team ${team}`);
      
      // Trigger balance check after manual team change
      const balanceManager = this.haxballRoom.getBalanceManager?.();
      if (balanceManager) {
        setTimeout(async () => {
          await balanceManager.forceUpdatePlayerCache();
          await balanceManager.checkAndFixTeamImbalance?.();
        }, 100);
      }
    } catch (error) {
      this.logger.error('Failed to set player team', error, { playerId, team });
      throw error;
    }
  }

  async kickPlayer(playerId: number, reason: string, ban: boolean = false): Promise<void> {
    try {
      if (!this.haxballRoom) {
        throw new Error('Haxball room not available');
      }

      // Validar parámetros
      if (typeof playerId !== 'number' || playerId < 0) {
        throw new Error('Invalid player ID');
      }

      if (!reason || typeof reason !== 'string') {
        throw new Error('Kick reason is required');
      }

      await this.haxballRoom.kickPlayer(playerId, reason, ban);
      this.logger.info(`Player ${playerId} kicked`, { reason, ban });
    } catch (error) {
      this.logger.error('Failed to kick player', error, { playerId, reason, ban });
      throw error;
    }
  }

  async sendAnnouncement(
    message: string, 
    targetId?: number, 
    color?: number, 
    style?: string, 
    sound?: number
  ): Promise<void> {
    try {
      if (!this.haxballRoom) {
        throw new Error('Haxball room not available');
      }

      // Validar mensaje
      if (!message || typeof message !== 'string') {
        throw new Error('Message is required');
      }

      await this.haxballRoom.sendAnnouncement(message, targetId, color, style, sound);
      this.logger.debug('Announcement sent', { targetId, hasMessage: !!message });
    } catch (error) {
      this.logger.error('Failed to send announcement', error, { targetId });
      throw error;
    }
  }

  /**
   * Verifica si el room está disponible
   */
  public isAvailable(): boolean {
    return !!this.haxballRoom;
  }

  async setTeamColors(team: number, angle: number, textColor: number, colors: number[]): Promise<void> {
    try {
      if (!this.haxballRoom) {
        throw new Error('Haxball room not available');
      }

      // Validar parámetros
      if (typeof team !== 'number' || team < 1 || team > 2) {
        throw new Error('Invalid team (must be 1 or 2)');
      }

      if (!Array.isArray(colors) || colors.length === 0) {
        throw new Error('Colors array is required');
      }

      await this.haxballRoom.setTeamColors(team, angle, textColor, colors);
      this.logger.debug(`Team ${team} colors set`, { angle, textColor, colors });
    } catch (error) {
      this.logger.error('Failed to set team colors', error, { team, angle, textColor, colors });
      throw error;
    }
  }

  /**
   * Obtiene el powershot manager
   */
  public getPowershotManager(): any {
    return this.haxballRoom?.getPowershotManager?.();
  }
}