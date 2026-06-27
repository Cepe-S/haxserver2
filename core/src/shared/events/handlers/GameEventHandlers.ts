import { eventBus } from '../EventBus';
import { 
  HAXBALL_EVENTS, 
  HaxballGameStartEvent, 
  HaxballGameStopEvent, 
  HaxballTeamGoalEvent,
  HaxballPlayerTeamChangeEvent,
  HaxballPlayerAdminChangeEvent,
  HaxballPlayerActivityEvent,
  HaxballPlayerBallKickEvent
} from '../HaxballEvents';
import { createLogger } from '../../logger/Logger';
import { ChatManager } from '../../../chat-manager/ChatManager';
import { BallTracker } from '../../stats/BallTracker';
import { MatchStatsManager } from '../../stats/MatchStatsManager';
import { MatchManager } from '../../teams/MatchManager';

/**
 * Handlers para eventos de juego
 * Basados en los event listeners del sistema viejo
 */
export class GameEventHandlers {
  private logger = createLogger('GameEventHandlers');
  private chatManager: ChatManager | null = null;
  private ballTracker: BallTracker;
  private matchStatsManager: MatchStatsManager | null = null;
  private matchManager: MatchManager;
  private haxballRoom: any = null;

  constructor(ruid: string, chatManager?: ChatManager, haxballRoom?: any) {
    this.chatManager = chatManager || null;
    this.ballTracker = new BallTracker();
    // NO crear MatchStatsManager aquí - se inyecta desde HaxballRoom
    this.matchManager = new MatchManager();
    this.haxballRoom = haxballRoom || null;
    this.setupEventListeners();
  }
  
  /**
   * Configura el MatchStatsManager (llamado desde HaxballRoom)
   */
  public setMatchStatsManager(matchStatsManager: MatchStatsManager): void {
    this.matchStatsManager = matchStatsManager;
  }

  /**
   * Obtiene el MatchStatsManager para compartir con otros handlers
   */
  public getMatchStatsManager(): MatchStatsManager {
    return this.matchStatsManager;
  }

  private setupEventListeners(): void {
    // Eventos de juego
    eventBus.onEvent('haxball.game.start', this.handleGameStart.bind(this));
    eventBus.onEvent('haxball.game.stop', this.handleGameStop.bind(this));
    eventBus.onEvent('haxball.team.goal', this.handleTeamGoal.bind(this));
    eventBus.onEvent('haxball.player.ballKick', this.handlePlayerBallKick.bind(this));

  }

  private async handleGameStart(event: HaxballGameStartEvent): Promise<void> {
    const { byPlayer, timestamp } = event;
    
    this.logger.info(`[GameStart] Game started${byPlayer ? ` by ${byPlayer.name}#${byPlayer.id}` : ''}`);

    try {
      // Match stats lifecycle is owned by MatchLoop (training uses 0/0 limits)
      this.ballTracker.clear();

      // Marcar que el juego está activo
      eventBus.emitEvent('game.state.changed', {
        isActive: true,
        startedBy: byPlayer,
        timestamp
      });

      // Nota: La aplicación de camisetas ahora la maneja MatchLoop.onEnter()
      // initializeGameSystems() eliminado para evitar duplicación de camisetas

      // Log para debug
      this.logMatchDebugAction('GAME_START', byPlayer?.name || 'System', 'Game started');

    } catch (error) {
      this.logger.error('[GameStart] Error handling game start:', error);
    }
  }

  private async handleGameStop(event: HaxballGameStopEvent): Promise<void> {
    const { byPlayer, timestamp } = event;
    
    this.logger.info(`[GameStop] Game stopped${byPlayer ? ` by ${byPlayer.name}#${byPlayer.id}` : ''}`);

    try {
      // Match stats persist/clear is owned by MatchLoop.handleGameStop
      this.ballTracker.clear();

      // Marcar que el juego está inactivo
      eventBus.emitEvent('game.state.changed', {
        isActive: false,
        stoppedBy: byPlayer,
        timestamp
      });

      // Procesar estadísticas finales
      await this.processGameStatistics();

      // Log para debug
      this.logMatchDebugAction('GAME_STOP', byPlayer?.name || 'System', 'Game stopped');

    } catch (error) {
      this.logger.error('[GameStop] Error handling game stop:', error);
    }
  }

  private async handleTeamGoal(event: HaxballTeamGoalEvent): Promise<void> {
    const { team, scores, timestamp } = event;
    
    this.logger.info(`[TeamGoal] Team ${team} scored! Score: ${scores.red}-${scores.blue}`);

    try {
      // Determinar goleador y asistente
      const goalData = await this.processGoalData(team, timestamp);

      // Anunciar gol
      this.logger.info(`[TeamGoal] Attempting to announce goal for team ${team}`);
      if (this.chatManager) {
        this.logger.info(`[TeamGoal] ChatManager available, sending goal announcement`);
        if (goalData.assist) {
          await this.chatManager.sendGoal(goalData.scorer, goalData.assist);
        } else {
          await this.chatManager.sendGoal(goalData.scorer);
        }
      } else {
        this.logger.warn(`[TeamGoal] ChatManager not available`);
      }

      // Emitir evento de gol procesado
      eventBus.emitEvent('goal.scored', {
        team,
        scorer: goalData.scorer,
        assist: goalData.assist,
        scores,
        timestamp
      });

      // Actualizar estadísticas
      await this.updateGoalStatistics(goalData);

      // Log para debug
      this.logMatchDebugAction('TEAM_GOAL', goalData.scorer?.name || 'Unknown', `Goal for team ${team}`);

    } catch (error) {
      this.logger.error('[TeamGoal] Error handling team goal:', error);
    }
  }

  private async handlePlayerTeamChange(event: HaxballPlayerTeamChangeEvent): Promise<void> {
    const { player, byPlayer, newTeam, timestamp } = event;
    
    this.logger.info(`[PlayerTeamChange] ${player.name}#${player.id} moved to team ${newTeam}${byPlayer ? ` by ${byPlayer.name}` : ''}`);

    try {
      // Emitir evento para sistemas de balance
      eventBus.emitEvent('player.team.changed', {
        player,
        byPlayer,
        newTeam,
        timestamp
      });

      // Log para debug
      this.logMatchDebugAction('PLAYER_TEAM_CHANGE', player.name, `Moved to team ${newTeam}`);

    } catch (error) {
      this.logger.error('[PlayerTeamChange] Error handling team change:', error);
    }
  }

  private async handlePlayerAdminChange(event: HaxballPlayerAdminChangeEvent): Promise<void> {
    const { player, byPlayer, isAdmin, timestamp } = event;
    
    this.logger.info(`[PlayerAdminChange] ${player.name}#${player.id} ${isAdmin ? 'gained' : 'lost'} admin${byPlayer ? ` by ${byPlayer.name}` : ''}`);

    try {
      // Emitir evento para sistema de permisos
      eventBus.emitEvent('player.admin.changed', {
        player,
        byPlayer,
        isAdmin,
        timestamp
      });

      // Log para debug
      this.logMatchDebugAction('PLAYER_ADMIN_CHANGE', player.name, `${isAdmin ? 'Gained' : 'Lost'} admin`);

    } catch (error) {
      this.logger.error('[PlayerAdminChange] Error handling admin change:', error);
    }
  }

  private async handlePlayerActivity(event: HaxballPlayerActivityEvent): Promise<void> {
    const { player, timestamp } = event;
    
    // Solo log en debug para evitar spam
    this.logger.debug(`[PlayerActivity] ${player.name}#${player.id} activity detected`);

    try {
      // Emitir evento para sistema AFK
      eventBus.emitEvent('player.activity.detected', {
        player,
        timestamp
      });

    } catch (error) {
      this.logger.error('[PlayerActivity] Error handling player activity:', error);
    }
  }

  private async handlePlayerBallKick(event: HaxballPlayerBallKickEvent): Promise<void> {
    const { player, timestamp } = event;
    
    this.logger.debug(`[PlayerBallKick] ${player.name}#${player.id} kicked the ball`);

    try {
      // Registrar toque del balón para tracking de goles
      if (player.team === 1 || player.team === 2) {
        this.ballTracker.recordBallTouch(player.id, player.name, player.team);
        if (this.matchStatsManager) {
          this.matchStatsManager.recordBallTouch(player.id);
        }
      }

      // Emitir evento para sistemas de powershot y posesión
      eventBus.emitEvent('player.ball.kicked', {
        player,
        timestamp
      });

    } catch (error) {
      this.logger.error('[PlayerBallKick] Error handling ball kick:', error);
    }
  }



  private async processGameStatistics(): Promise<void> {
    // TODO: Procesar estadísticas finales del juego
    // - Guardar estadísticas de jugadores
    // - Generar replay si está habilitado
    // - Actualizar ratings
    this.logger.debug('[GameStop] Game statistics processed');
  }

  private async processGoalData(team: number, timestamp: number): Promise<any> {
    // Obtener datos del gol basado en el ballStack
    const goalData = this.ballTracker.getGoalData(team);
    
    if (goalData.scorer) {
      // Registrar gol en estadísticas
      if (this.matchStatsManager) {
        this.matchStatsManager.recordGoal(goalData.scorer.playerId);
        
        // Registrar asistencia si existe
        if (goalData.assist) {
          this.matchStatsManager.recordAssist(goalData.assist.playerId);
        }
      }
      
      return {
        scorer: {
          name: goalData.scorer.playerName,
          id: goalData.scorer.playerId
        },
        assist: goalData.assist ? {
          name: goalData.assist.playerName,
          id: goalData.assist.playerId
        } : null
      };
    }
    
    // Fallback si no hay datos del ballStack
    return {
      scorer: {
        name: team === 1 ? 'Red Team' : 'Blue Team',
        id: 0
      },
      assist: null
    };
  }

  private async updateGoalStatistics(goalData: any): Promise<void> {
    // TODO: Actualizar estadísticas de goles y asistencias
    this.logger.debug('[TeamGoal] Goal statistics updated');
  }





  private logMatchDebugAction(action: string, playerName: string, details: string): void {
    const { pushMatchDebug } = require('../../debug/MatchDebugLog');
    pushMatchDebug(action, playerName, details);
    this.logger.debug(`[MatchDebug] ${action}: ${playerName} - ${details}`);
  }
}