import { eventBus } from '../EventBus';
import { createLogger } from '../../logger/Logger';
import { MapVoteManager } from '../../stadiums/MapVoteManager';
import { PlayerCacheManager } from '../../player/PlayerCacheManager';

/**
 * Routes player-count events to MapVoteManager (mismatch notify / vote cancel).
 */
export class MapVoteEventHandler {
  private logger = createLogger('MapVoteEventHandler');
  private mapVoteManager: MapVoteManager | null = null;
  private boundHandlers: Array<{ event: string; listener: (...args: any[]) => void }> = [];

  setMapVoteManager(manager: MapVoteManager): void {
    this.mapVoteManager = manager;
  }

  start(): void {
    this.stop();

    const onCountChange = (data: { count?: number }) => {
      const count = data?.count ?? this.getPlayerCount();
      this.mapVoteManager?.onPlayerCountChanged(count);
    };

    eventBus.onEvent('player.count.changed', onCountChange);
    eventBus.onEvent('player.afk.set', onCountChange);
    eventBus.onEvent('player.afk.unset', onCountChange);
    eventBus.onEvent('haxball.player.leave', onCountChange);

    this.boundHandlers = [
      { event: 'player.count.changed', listener: onCountChange },
      { event: 'player.afk.set', listener: onCountChange },
      { event: 'player.afk.unset', listener: onCountChange },
      { event: 'haxball.player.leave', listener: onCountChange },
    ];

    this.logger.info('MapVoteEventHandler started');
  }

  stop(): void {
    for (const { event, listener } of this.boundHandlers) {
      eventBus.offEvent(event, listener);
    }
    this.boundHandlers = [];
  }

  private getPlayerCount(): number {
    const { red, blue } = PlayerCacheManager.getInstance().getActiveTeamCounts();
    return red + blue;
  }
}
