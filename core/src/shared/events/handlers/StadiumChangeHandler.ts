import { eventBus } from '../EventBus';
import { HAXBALL_EVENTS, HaxballStadiumChangeEvent } from '../HaxballEvents';
import { createLogger } from '../../logger/Logger';

export class StadiumChangeHandler {
  private logger = createLogger('StadiumChangeHandler');

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.onEvent(HAXBALL_EVENTS.STADIUM_CHANGE, this.handleStadiumChange.bind(this));
  }

  private async handleStadiumChange(event: HaxballStadiumChangeEvent): Promise<void> {
    const { newStadiumName, byPlayer, timestamp } = event;
    
    this.logger.info(`[StadiumChange] Changed to: ${newStadiumName}${byPlayer ? ` by ${byPlayer.name}` : ''}`);

    try {
      eventBus.emitEvent('stadium.changed', {
        newStadiumName,
        byPlayer,
        timestamp
      });
    } catch (error) {
      this.logger.error(`[StadiumChange] Error processing stadium change:`, error);
    }
  }
}