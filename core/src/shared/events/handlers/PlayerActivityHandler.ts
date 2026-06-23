import { eventBus } from '../EventBus';
import { HAXBALL_EVENTS, HaxballPlayerActivityEvent } from '../HaxballEvents';
import { createLogger } from '../../logger/Logger';

export class PlayerActivityHandler {
  private logger = createLogger('PlayerActivityHandler');

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.onEvent(HAXBALL_EVENTS.PLAYER_ACTIVITY, this.handlePlayerActivity.bind(this));
  }

  private async handlePlayerActivity(event: HaxballPlayerActivityEvent): Promise<void> {
    const { player, timestamp } = event;
    
    this.logger.debug(`[PlayerActivity] ${player.name}#${player.id} activity detected`);

    try {
      eventBus.emitEvent('player.activity.detected', {
        player,
        timestamp
      });
    } catch (error) {
      this.logger.error(`[PlayerActivity] Error processing activity:`, error);
    }
  }
}