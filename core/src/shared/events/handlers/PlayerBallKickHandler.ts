import { eventBus } from '../EventBus';
import { HAXBALL_EVENTS, HaxballPlayerBallKickEvent } from '../HaxballEvents';
import { createLogger } from '../../logger/Logger';

export class PlayerBallKickHandler {
  private logger = createLogger('PlayerBallKickHandler');

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.onEvent(HAXBALL_EVENTS.PLAYER_BALL_KICK, this.handlePlayerBallKick.bind(this));
  }

  private async handlePlayerBallKick(event: HaxballPlayerBallKickEvent): Promise<void> {
    const { player, timestamp } = event;
    
    this.logger.debug(`[PlayerBallKick] ${player.name}#${player.id} kicked the ball`);

    try {
      eventBus.emitEvent('player.ball.kicked', {
        player,
        timestamp
      });
    } catch (error) {
      this.logger.error(`[PlayerBallKick] Error processing ball kick:`, error);
    }
  }
}