import { eventBus } from '../EventBus';
import { HAXBALL_EVENTS, HaxballKickRateLimitSetEvent } from '../HaxballEvents';
import { createLogger } from '../../logger/Logger';

export class KickRateLimitSetHandler {
  private logger = createLogger('KickRateLimitSetHandler');

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.onEvent(HAXBALL_EVENTS.KICK_RATE_LIMIT_SET, this.handleKickRateLimitSet.bind(this));
  }

  private async handleKickRateLimitSet(event: HaxballKickRateLimitSetEvent): Promise<void> {
    const { min, rate, burst, byPlayer, timestamp } = event;
    
    this.logger.info(`[KickRateLimit] Set to ${min}/${rate}/${burst}${byPlayer ? ` by ${byPlayer.name}` : ''}`);

    try {
      eventBus.emitEvent('kickRateLimit.set', {
        min,
        rate,
        burst,
        byPlayer,
        timestamp
      });
    } catch (error) {
      this.logger.error(`[KickRateLimit] Error processing rate limit:`, error);
    }
  }
}