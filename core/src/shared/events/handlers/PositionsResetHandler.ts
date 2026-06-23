import { eventBus } from '../EventBus';
import { HAXBALL_EVENTS, HaxballPositionsResetEvent } from '../HaxballEvents';
import { createLogger } from '../../logger/Logger';

export class PositionsResetHandler {
  private logger = createLogger('PositionsResetHandler');

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.onEvent(HAXBALL_EVENTS.POSITIONS_RESET, this.handlePositionsReset.bind(this));
  }

  private async handlePositionsReset(event: HaxballPositionsResetEvent): Promise<void> {
    const { timestamp } = event;
    
    this.logger.debug('[PositionsReset] Player positions reset');

    try {
      eventBus.emitEvent('positions.reset', {
        timestamp
      });
    } catch (error) {
      this.logger.error(`[PositionsReset] Error processing positions reset:`, error);
    }
  }
}