import { GameLoop, GameLoopConfig } from './GameLoop';
import { MatchManager } from '../teams/MatchManager';
import { ChatManager } from '../../chat-manager/ChatManager';
import { eventBus } from '../events/EventBus';
import { StadiumSelector } from '../stadiums/StadiumSelector';
import { MapVoteManager } from '../stadiums/MapVoteManager';
import { STRINGS } from '../strings';

/**
 * Match Loop
 * 
 * Responsabilidades:
 * - Cargar estadio de juego (futx4, futx3, etc)
 * - Configurar settings con límites (timeLimit, scoreLimit)
 * - Seleccionar partido aleatorio (equipos reales)
 * - Aplicar camisetas de equipos
 * - Iniciar partido
 * - Monitorear jugadores (si bajan de mínimo, volver a training)
 * - Al terminar: guardar stats, limpiar cache, reiniciar con nuevo partido
 * - Guardar información del partido en la base de datos
 */
export class MatchLoop extends GameLoop {
  private matchManager: MatchManager;
  private chatManager: ChatManager | null = null;
  private matchStatsManager: any = null;
  private currentMatch: any = null;
  private isApplyingSettings = false;
  private gameStartProcessed = false;
  private stadiumSelector: StadiumSelector | null = null;
  private mapVoteManager: MapVoteManager | null = null;
  private isMapVoteRestart = false;
  private mapVoteListener: ((data: any) => void) | null = null;

  constructor(config: GameLoopConfig, chatManager?: ChatManager) {
    super('MatchLoop', config);
    this.matchManager = new MatchManager();
    this.chatManager = chatManager || null;
  }

  /**
   * Configura el MatchStatsManager
   */
  public setMatchStatsManager(matchStatsManager: any): void {
    this.matchStatsManager = matchStatsManager;
  }

  public setStadiumSelector(selector: StadiumSelector): void {
    this.stadiumSelector = selector;
  }

  public setMapVoteManager(manager: MapVoteManager): void {
    this.mapVoteManager = manager;
  }

  public getCurrentStadiumName(): string {
    return this.config.stadiumName;
  }

  /**
   * Obtiene información del partido actual
   */
  public getCurrentMatch(): any {
    return this.currentMatch;
  }

  /**
   * Inicializa el modo partido
   */
  protected async onEnter(): Promise<void> {
    this.logger.info('Entering match mode');

    try {
      // 1. Detener juego actual
      await this.safeStopGame();
      await this.delay(300);

      // 2. Seleccionar partido aleatorio
      this.currentMatch = this.matchManager.selectRandomMatch();
      if (this.currentMatch) {
        this.logger.info(`Selected match: ${this.currentMatch.homeTeam} vs ${this.currentMatch.awayTeam}`);
      } else {
        this.logger.warn('No match selected, using default configuration');
      }

      // 3. Cargar estadio según cantidad de jugadores
      const count = this.getPlayerCount().total;
      if (this.stadiumSelector) {
        this.config.stadiumName = this.stadiumSelector.pick(count);
      }
      this.logger.info(`Loading game stadium: ${this.config.stadiumName} (${count} players)`);
      await this.safeChangeStadium(this.config.stadiumName);
      this.setupMapVoteListener();
      
      // 4. Aplicar camisetas INMEDIATAMENTE después del estadio (antes de cualquier delay)
      // Esto evita que se vean los colores por defecto del estadio
      if (this.currentMatch && this.haxballRoom) {
        const success = this.matchManager.applyMatchToHaxball(this.haxballRoom, this.currentMatch);
        if (success) {
          this.logger.success(`Team kits applied: ${this.currentMatch.homeTeam} vs ${this.currentMatch.awayTeam}`);
        } else {
          this.logger.warn('Failed to apply team kits');
        }
      }
      await this.delay(300);

      // 5. Aplicar configuraciones de juego
      this.logger.info(`Applying game settings: timeLimit=${this.config.timeLimit}, scoreLimit=${this.config.scoreLimit}`);
      await this.applyGameSettings();
      await this.delay(300);

      // 6. Anunciar partido
      if (this.currentMatch && this.chatManager) {
        try {
          await this.chatManager.send(
            `🏆 ${this.currentMatch.homeTeam} vs ${this.currentMatch.awayTeam}`,
            {
              color: 0x00FF00,
              style: 'bold',
              sound: 2
            }
          );
        } catch (error) {
          this.logger.warn('Failed to announce match:', error);
        }
      }

      // 7. Iniciar juego
      await this.delay(500);
      await this.safeStartGame();
      // game.start may fire while state is STARTING (before RUNNING) — ensure stats tracking
      this.ensureMatchStatsStarted();

      this.logger.success('Match mode activated');

    } catch (error) {
      this.logger.error('Failed to enter match mode:', error);
      throw error;
    }
  }

  /**
   * Monitorea condiciones para volver a training
   */
  protected onUpdate(): void {
    if (this.isStopping) return;
    
    const { total } = this.getPlayerCount();

    this.logger.debug(`Match update - Players: ${total}/${this.config.minPlayers}`);

    // Si no hay suficientes jugadores, volver a training
    if (total < this.config.minPlayers) {
      this.logger.warn(`Not enough players (${total}/${this.config.minPlayers}) - requesting transition to training`);
      this.requestTransition('training', `notEnoughPlayers (${total})`);
    }
  }

  /**
   * Limpia recursos al salir del loop
   */
  protected async onExit(): Promise<void> {
    this.logger.info('Exiting match mode');
    this.teardownMapVoteListener();
    this.mapVoteManager?.clearVote();
    if (this.matchStatsManager?.isMatchActive()) {
      this.matchStatsManager.clearCache();
    }
    this.currentMatch = null;
    this.isApplyingSettings = false;
    this.gameStartProcessed = false;
    this.isMapVoteRestart = false;
  }

  /**
   * Maneja inicio de juego en match
   */
  protected async handleGameStart(event: any): Promise<void> {
    if (this.isStopping || this.gameStartProcessed) return;
    
    this.gameStartProcessed = true;
    this.logger.info('Match game started');

    try {
      this.ensureMatchStatsStarted();
    } catch (error) {
      this.logger.error('Error in handleGameStart:', error);
    }
  }

  /** Start match stats if not already tracking (idempotent). */
  private ensureMatchStatsStarted(): void {
    if (this.matchStatsManager && !this.matchStatsManager.isMatchActive()) {
      this.matchStatsManager.startMatch();
    }
  }

  /**
   * Maneja fin de juego en match
   * TAREA CRÍTICA: Guardar en BD y limpiar cache
   */
  protected async handleGameStop(event: any): Promise<void> {
    if (this.isStopping) return;
    
    this.gameStartProcessed = false;
    this.logger.info('Match game stopped - processing...');

    try {
      if (this.matchStatsManager?.isMatchActive()) {
        await this.matchStatsManager.endMatch();
        this.logger.success('Match stats saved and cache cleared');
      }

      const mapVoteRestart = this.isMapVoteRestart;
      if (mapVoteRestart) {
        this.isMapVoteRestart = false;
      }

      await this.delay(1000);
      if (this.isStopping) return;

      const { total } = this.getPlayerCount();

      if (total >= this.config.minPlayers) {
        if (mapVoteRestart) {
          this.logger.info('Restarting after map vote...');
          await this.applyStadiumForCount(total, true);
          this.mapVoteManager?.clearVote();
          if (this.chatManager) {
            await this.chatManager.send(
              STRINGS.mapVote.changed.replace('{stadium}', this.config.stadiumName),
              { color: 0x00FF00, sound: 1 }
            ).catch(() => {});
          }
        }
        this.logger.info('Restarting with new match...');
        await this.startNewMatch(mapVoteRestart);
      } else {
        this.logger.info('Not enough players, waiting for transition to training...');
      }

    } catch (error) {
      this.logger.error('Error in handleGameStop:', error);
    }
  }

  /**
   * Maneja victoria de equipo
   */
  protected async handleTeamVictory(event: any): Promise<void> {
    if (this.isStopping) return;
    
    const { scores } = event;
    
    this.logger.info(`Team victory! Score: ${scores.red}-${scores.blue}`);

    try {
      // Nota: El anuncio de victoria lo maneja ChatManager.sendVictory()
      // No duplicamos el mensaje aquí
      
      // El gameStop se ejecutará automáticamente después y manejará el resto
      
    } catch (error) {
      this.logger.error('Error in handleTeamVictory:', error);
    }
  }

  /**
   * Reinicia el partido actual (después de que termine uno)
   * NO cambia camisetas - usa las que se aplicaron en onEnter()
   */
  private async startNewMatch(skipStadiumReeval = false): Promise<void> {
    if (this.isStopping) return;
    
    try {
      if (!skipStadiumReeval) {
        await this.applyStadiumForCount(this.getPlayerCount().total, false);
      }

      this.logger.info(`Restarting match: ${this.currentMatch?.homeTeam || 'unknown'} vs ${this.currentMatch?.awayTeam || 'unknown'}`);

      // Aplicar configuraciones (sin cambiar camisetas)
      await this.applyGameSettings();
      if (this.isStopping) return;
      
      await this.delay(300);
      if (this.isStopping) return;

      // Iniciar juego (delay reducido para sistema más rápido)
      await this.delay(500);
      if (this.isStopping) return;
      
      await this.safeStartGame();
      this.ensureMatchStatsStarted();

      this.logger.success('Match restarted');

    } catch (error) {
      this.logger.error('Failed to restart match:', error);
    }
  }

  /**
   * Aplica configuraciones de juego
   */
  private async applyGameSettings(): Promise<void> {
    if (!this.haxballRoom?.browserPage || this.isStopping) {
      return;
    }

    if (this.isApplyingSettings) {
      return;
    }

    this.isApplyingSettings = true;

    try {
      // Obtener valores con fallbacks centralizados
      const timeLimit = this.config.timeLimit ?? 10;
      const scoreLimit = this.config.scoreLimit ?? 5;
      const teamLock = this.config.teamLock ?? true;

      this.logger.info('🎮 Applying match settings', { 
        timeLimit, 
        scoreLimit, 
        teamLock,
        configSource: {
          timeLimit: this.config.timeLimit,
          scoreLimit: this.config.scoreLimit,
          teamLock: this.config.teamLock
        }
      });

      if (this.isStopping) return;

      await this.haxballRoom.browserPage.evaluate((config) => {
        if ((window as any).gameRoom?._room) {
          const room = (window as any).gameRoom._room;
          console.log('🎮 [BROWSER] Applying settings:', config);
          room.setTimeLimit(config.timeLimit);
          room.setScoreLimit(config.scoreLimit);
          room.setTeamsLock(config.teamLock);
          console.log('✅ [BROWSER] Settings applied');
        }
      }, { timeLimit, scoreLimit, teamLock });
      
    } catch (error) {
      this.logger.error('Failed to apply game settings:', error);
      throw error;
    } finally {
      this.isApplyingSettings = false;
    }
  }

  /**
   * Detiene el juego de forma segura
   */
  private async safeStopGame(): Promise<void> {
    if (!this.haxballRoom) {
      this.logger.warn('HaxballRoom not available');
      return;
    }

    try {
      await this.haxballRoom.stopGame();
      this.logger.debug('Game stopped safely');
    } catch (error) {
      this.logger.warn('Failed to stop game (may not be running):', error);
    }
  }

  /**
   * Cambia el estadio de forma segura
   */
  private async safeChangeStadium(stadiumName: string): Promise<void> {
    if (!this.haxballRoom) {
      throw new Error('HaxballRoom not available');
    }

    try {
      await this.haxballRoom.setStadium(stadiumName);
      this.logger.info(`Stadium changed to ${stadiumName}`);
    } catch (error) {
      this.logger.error(`Failed to change stadium to ${stadiumName}:`, error);
      throw error;
    }
  }

  /**
   * Inicia el juego de forma segura
   */
  private async safeStartGame(): Promise<void> {
    if (!this.haxballRoom) {
      throw new Error('HaxballRoom not available');
    }

    try {
      await this.haxballRoom.startGame();
      this.logger.info('Match game started');
    } catch (error) {
      this.logger.error('Failed to start game:', error);
      throw error;
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private setupMapVoteListener(): void {
    this.teardownMapVoteListener();
    this.mapVoteListener = async () => {
      if (this.isStopping || this.isMapVoteRestart) return;
      this.isMapVoteRestart = true;
      this.logger.info('Map vote passed — stopping game for stadium change');
      await this.safeStopGame();
    };
    eventBus.onEvent('map.vote.passed', this.mapVoteListener);
  }

  private teardownMapVoteListener(): void {
    if (this.mapVoteListener) {
      eventBus.offEvent('map.vote.passed', this.mapVoteListener);
      this.mapVoteListener = null;
    }
  }

  private async applyStadiumForCount(count: number, forceNewMatch: boolean): Promise<void> {
    if (!this.stadiumSelector) return;

    const ideal = this.stadiumSelector.pick(count);
    if (ideal === this.config.stadiumName && !forceNewMatch) return;

    this.config.stadiumName = ideal;
    await this.safeChangeStadium(ideal);

    if (forceNewMatch) {
      this.currentMatch = this.matchManager.selectRandomMatch();
      if (this.currentMatch && this.haxballRoom) {
        this.matchManager.applyMatchToHaxball(this.haxballRoom, this.currentMatch);
      }
    }
  }

  /**
   * Override para incluir info del partido actual
   */
  public getDebugInfo(): any {
    const baseInfo = super.getDebugInfo();
    return {
      ...baseInfo,
      currentMatch: this.currentMatch ? {
        homeTeam: this.currentMatch.homeTeam,
        awayTeam: this.currentMatch.awayTeam
      } : null
    };
  }
}
