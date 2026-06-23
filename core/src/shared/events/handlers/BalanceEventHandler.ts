import { eventBus } from '../EventBus';
import { HAXBALL_EVENTS } from '../HaxballEvents';
import { createLogger } from '../../logger/Logger';

/**
 * Handler que conecta eventos de Haxball con el sistema de balance
 * FASE 2.1: Sistema de balanceo crítico
 */
export class BalanceEventHandler {
  private logger = createLogger('BalanceEventHandler');
  private balanceManager: any = null;

  constructor() {
    this.setupEventListeners();
  }

  public setBalanceManager(balanceManager: any): void {
    this.balanceManager = balanceManager;
    this.logger.info('Balance manager connected to event handler');
  }

  private setupEventListeners(): void {
    // Usar solo eventos estándar correctos (sin duplicación)
    eventBus.on(HAXBALL_EVENTS.PLAYER_JOIN, async (event) => {
      if (this.balanceManager) {
        this.logger.debug('Processing player join for balance', { player: event.player.name });
        await this.balanceManager.onPlayerJoin(event.player);
      }
    });

    eventBus.on(HAXBALL_EVENTS.PLAYER_LEAVE, async (event) => {
      if (this.balanceManager) {
        this.logger.debug('Processing player leave for balance', { playerId: event.player.id });
        await this.balanceManager.onPlayerLeave(event.player.id);
      }
    });

    eventBus.on(HAXBALL_EVENTS.PLAYER_TEAM_CHANGE, async (event) => {
      if (this.balanceManager) {
        this.logger.debug('Processing team change for balance', { player: event.player.name, newTeam: event.newTeam });
        await this.balanceManager.onPlayerTeamChange(event.player, event.newTeam);
      }
    });

    eventBus.on(HAXBALL_EVENTS.GAME_START, () => {
      if (this.balanceManager) {
        this.logger.debug('Processing game start for balance');
        this.balanceManager.onGameStart();
      }
    });

    eventBus.on(HAXBALL_EVENTS.GAME_STOP, () => {
      if (this.balanceManager) {
        this.logger.debug('Processing game stop for balance');
        this.balanceManager.onGameStop();
      }
    });

    eventBus.on(HAXBALL_EVENTS.TEAM_VICTORY, (event) => {
      if (this.balanceManager) {
        this.logger.debug('Processing team victory for balance');
        this.balanceManager.onTeamVictory(event.scores);
      }
    });

    this.logger.info('Balance event listeners configured');
  }
}