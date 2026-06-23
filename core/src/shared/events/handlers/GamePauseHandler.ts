import { eventBus } from '../EventBus';
import { HAXBALL_EVENTS, HaxballGamePauseEvent } from '../HaxballEvents';
import { createLogger } from '../../logger/Logger';

export class GamePauseHandler {
  private logger = createLogger('GamePauseHandler');

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.onEvent(HAXBALL_EVENTS.GAME_PAUSE, this.handleGamePause.bind(this));
  }

  private async handleGamePause(event: HaxballGamePauseEvent): Promise<void> {
    const { byPlayer, timestamp } = event;
    
    this.logger.info(`[GamePause] Game paused${byPlayer ? ` by ${byPlayer.name}` : ''}`);

    try {
      eventBus.emitEvent('game.paused', {
        byPlayer,
        timestamp
      });
    } catch (error) {
      this.logger.error(`[GamePause] Error processing pause:`, error);
    }
  }
}