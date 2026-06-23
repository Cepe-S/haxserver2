import { eventBus } from '../EventBus';
import { HAXBALL_EVENTS, HaxballPlayerKickedEvent } from '../HaxballEvents';
import { createLogger } from '../../logger/Logger';

export class PlayerKickedHandler {
  private logger = createLogger('PlayerKickedHandler');

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.onEvent(HAXBALL_EVENTS.PLAYER_KICKED, this.handlePlayerKicked.bind(this));
  }

  private async handlePlayerKicked(event: HaxballPlayerKickedEvent): Promise<void> {
    const { kickedPlayer, reason, ban, byPlayer, timestamp } = event;
    
    this.logger.info(`[PlayerKicked] ${kickedPlayer.name} ${ban ? 'banned' : 'kicked'}: ${reason}${byPlayer ? ` by ${byPlayer.name}` : ''}`);

    try {
      eventBus.emitEvent('player.kicked', {
        kickedPlayer,
        reason,
        ban,
        byPlayer,
        timestamp
      });
    } catch (error) {
      this.logger.error(`[PlayerKicked] Error processing kick:`, error);
    }
  }
}