import { eventBus } from '../EventBus';
import { HAXBALL_EVENTS, HaxballGameUnpauseEvent } from '../HaxballEvents';
import { createLogger } from '../../logger/Logger';

export class GameUnpauseHandler {
  private logger = createLogger('GameUnpauseHandler');

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.onEvent(HAXBALL_EVENTS.GAME_UNPAUSE, this.handleGameUnpause.bind(this));
  }

  private async handleGameUnpause(event: HaxballGameUnpauseEvent): Promise<void> {
    const { byPlayer, timestamp } = event;
    
    this.logger.info(`[GameUnpause] Game unpaused${byPlayer ? ` by ${byPlayer.name}` : ''}`);

    try {
      eventBus.emitEvent('game.unpaused', {
        byPlayer,
        timestamp
      });
    } catch (error) {
      this.logger.error(`[GameUnpause] Error processing unpause:`, error);
    }
  }
}