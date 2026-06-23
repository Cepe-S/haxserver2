import { eventBus } from '../EventBus';
import { HAXBALL_EVENTS, HaxballTeamVictoryEvent } from '../HaxballEvents';
import { createLogger } from '../../logger/Logger';
import { ChatManager } from '../../../chat-manager/ChatManager';

export class TeamVictoryHandler {
  private logger = createLogger('TeamVictoryHandler');
  private chatManager: ChatManager | null = null;

  constructor(chatManager?: ChatManager) {
    this.chatManager = chatManager || null;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.onEvent(HAXBALL_EVENTS.TEAM_VICTORY, this.handleTeamVictory.bind(this));
  }

  private async handleTeamVictory(event: HaxballTeamVictoryEvent): Promise<void> {
    const { scores, timestamp } = event;
    
    this.logger.info(`[TeamVictory] Game ended: ${scores.red}-${scores.blue}`);

    try {
      // Anunciar victoria usando ChatManager.sendVictory() - mensaje correcto del sistema
      if (this.chatManager) {
        const streak = { count: 1, teamName: scores.red > scores.blue ? 'Rojo' : 'Azul' };
        await this.chatManager.sendVictory(scores, streak);
      }
      
      eventBus.emitEvent('match.ended', {
        scores,
        timestamp
      });
    } catch (error) {
      this.logger.error(`[TeamVictory] Error processing victory:`, error);
    }
  }
}