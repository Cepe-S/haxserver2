import { eventBus } from '../EventBus';
import { HAXBALL_EVENTS, HaxballPlayerTeamChangeEvent } from '../HaxballEvents';
import { createLogger } from '../../logger/Logger';

export class PlayerTeamChangeHandler {
  private logger = createLogger('PlayerTeamChangeHandler');

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.onEvent(HAXBALL_EVENTS.PLAYER_TEAM_CHANGE, this.handlePlayerTeamChange.bind(this));
  }

  private async handlePlayerTeamChange(event: HaxballPlayerTeamChangeEvent): Promise<void> {
    const { player, byPlayer, newTeam, timestamp } = event;
    
    this.logger.info(`[PlayerTeamChange] ${player.name}#${player.id} moved to team ${newTeam}${byPlayer ? ` by ${byPlayer.name}` : ''}`);
    
    this.logger.debug('PlayerTeamChange event details', {
      playerId: player.id,
      playerName: player.name,
      oldTeam: event.oldTeam || 'unknown',
      newTeam,
      byPlayer: byPlayer?.name || 'system',
      timestamp: new Date(timestamp).toISOString()
    });

    try {
      // Emitir evento interno para otros sistemas
      eventBus.emitEvent('player.team.changed', {
        player,
        byPlayer,
        newTeam,
        timestamp
      });
      
      this.logger.debug('player.team.changed event emitted successfully', {
        playerId: player.id,
        newTeam
      });
    } catch (error) {
      this.logger.error(`[PlayerTeamChange] Error processing team change:`, error);
    }
  }
}