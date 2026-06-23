import { GameLoop, GameLoopConfig } from './GameLoop';

/**
 * Training Loop
 * 
 * Responsabilidades:
 * - Cargar estadio de training/ready
 * - Configurar settings sin límites (timeLimit=0, scoreLimit=0)
 * - Monitorear cantidad de jugadores
 * - Solicitar transición a MatchLoop cuando hay suficientes jugadores
 * - Reiniciar automáticamente si el juego se detiene
 */
export class TrainingLoop extends GameLoop {
  private settingsTimeout: NodeJS.Timeout | null = null;
  private isApplyingSettings = false;

  constructor(config: GameLoopConfig) {
    super('TrainingLoop', config);
  }

  /**
   * Inicializa el modo training
   */
  protected async onEnter(): Promise<void> {
    this.logger.info('Entering training mode');

    try {
      // 1. Detener juego actual si está corriendo
      await this.safeStopGame();
      await this.delay(300);

      // 2. Cargar estadio de training
      this.logger.info(`Loading training stadium: ${this.config.stadiumName}`);
      await this.safeChangeStadium(this.config.stadiumName);
      await this.delay(300);

      // 3. Aplicar configuraciones de training (sin límites)
      this.logger.info('Applying training settings');
      await this.applyTrainingSettings();
      await this.delay(300);

      // 4. Iniciar juego en modo training
      await this.safeStartGame();

      this.logger.success('Training mode activated');

    } catch (error) {
      this.logger.error('Failed to enter training mode:', error);
      throw error;
    }
  }

  /**
   * Monitorea condiciones para transición a MatchLoop
   */
  protected onUpdate(): void {
    if (this.isStopping) return;
    
    const { total } = this.getPlayerCount();

    this.logger.debug(`Training update - Players: ${total}/${this.config.minPlayers}`);

    // Si hay suficientes jugadores, solicitar transición a MatchLoop
    if (total >= this.config.minPlayers) {
      this.logger.info(`Minimum players reached (${total}/${this.config.minPlayers}) - requesting transition to match mode`);
      this.requestTransition('match', `minPlayers reached (${total})`);
    }
  }

  /**
   * Limpia recursos al salir del loop
   */
  protected async onExit(): Promise<void> {
    this.logger.info('Exiting training mode');
    
    if (this.settingsTimeout) {
      clearTimeout(this.settingsTimeout);
      this.settingsTimeout = null;
    }
    
    this.isApplyingSettings = false;
  }

  /**
   * Maneja inicio de juego en training
   */
  protected async handleGameStart(event: any): Promise<void> {
    if (this.isStopping) return;
    
    // Reaplicar settings para asegurar que estén correctos
    if (this.settingsTimeout) {
      clearTimeout(this.settingsTimeout);
    }
    
    this.settingsTimeout = setTimeout(async () => {
      if (this.isStopping) return;
      try {
        await this.applyTrainingSettings();
      } catch (error) {
        this.logger.error('Failed to reapply training settings on game start', error);
      }
      this.settingsTimeout = null;
    }, 500);
  }

  /**
   * Maneja fin de juego en training
   * En training, siempre reiniciamos automáticamente
   */
  protected async handleGameStop(event: any): Promise<void> {
    if (this.isStopping) return;
    
    this.logger.info('Training game stopped - restarting immediately');

    try {
      await this.delay(500);
      if (this.isStopping) return;
      
      // Reiniciar training
      await this.applyTrainingSettings();
      if (this.isStopping) return;
      
      await this.delay(300);
      if (this.isStopping) return;
      
      await this.safeStartGame();

      this.logger.success('Training restarted');
      
    } catch (error) {
      this.logger.error('Failed to restart training:', error);
    }
  }

  /**
   * Maneja victoria de equipo en training
   */
  protected async handleTeamVictory(event: any): Promise<void> {
    if (this.isStopping) return;
    // No hacemos nada, el gameStop se encarga del reinicio
  }

  /**
   * Aplica configuraciones específicas de training
   */
  private async applyTrainingSettings(): Promise<void> {
    if (!this.haxballRoom?.browserPage || this.isStopping) {
      return;
    }

    if (this.isApplyingSettings) {
      return;
    }

    this.isApplyingSettings = true;

    try {
      if (this.isStopping) return;
      
      await this.haxballRoom.browserPage.evaluate(() => {
        if ((window as any).gameRoom?._room) {
          const room = (window as any).gameRoom._room;
          room.setTimeLimit(0);
          room.setScoreLimit(0);
          room.setTeamsLock(false);
        }
      });
      
    } catch (error) {
      this.logger.error('Failed to apply training settings:', error);
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
      this.logger.info('Training game started');
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
}
