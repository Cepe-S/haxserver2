import { eventBus } from '../EventBus';
import { HAXBALL_EVENTS, HaxballPlayerAdminChangeEvent } from '../HaxballEvents';
import { createLogger } from '../../logger/Logger';

export class PlayerAdminChangeHandler {
  private logger = createLogger('PlayerAdminChangeHandler');

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.onEvent(HAXBALL_EVENTS.PLAYER_ADMIN_CHANGE, this.handlePlayerAdminChange.bind(this));
  }

  private async handlePlayerAdminChange(event: HaxballPlayerAdminChangeEvent): Promise<void> {
    const { player, byPlayer, isAdmin, timestamp } = event;
    
    this.logger.info(`[PlayerAdminChange] ${player.name}#${player.id} ${isAdmin ? 'gained' : 'lost'} admin${byPlayer ? ` by ${byPlayer.name}` : ''}`);

    try {
      eventBus.emitEvent('player.admin.changed', {
        player,
        byPlayer,
        isAdmin,
        timestamp
      });
    } catch (error) {
      this.logger.error(`[PlayerAdminChange] Error processing admin change:`, error);
    }
  }
}