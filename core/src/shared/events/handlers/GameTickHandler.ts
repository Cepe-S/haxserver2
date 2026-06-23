import { eventBus } from '../EventBus';
import { HAXBALL_EVENTS, HaxballGameTickEvent } from '../HaxballEvents';
import { createLogger } from '../../logger/Logger';

export class GameTickHandler {
  private logger = createLogger('GameTickHandler');

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.onEvent(HAXBALL_EVENTS.GAME_TICK, this.handleGameTick.bind(this));
  }

  private async handleGameTick(event: HaxballGameTickEvent): Promise<void> {
    const { timestamp } = event;

    try {
      eventBus.emitEvent('game.tick', {
        timestamp
      });
    } catch (error) {
      this.logger.error(`[GameTick] Error processing tick:`, error);
    }
  }
}