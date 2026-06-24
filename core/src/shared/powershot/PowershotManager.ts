import { createLogger } from '../logger/Logger';
import { eventBus } from '../events/EventBus';

export enum PowershotMode {
  DISABLED = 'disabled',
  CLASSIC = 'classic',
  FAST = 'fast',
  EPIC = 'epic',
  COMPETITIVE = 'competitive'
}

export interface PowershotConfig {
  mode: PowershotMode;
  activationTime: number;      // Tiempo en ms
  stickDistance: number;       // Distancia de detección
  powerMultiplier: number;     // Multiplicador de potencia
  cooldownTime: number;        // Cooldown entre powershots
  maxPerMatch: number;         // Máximo por partido
  normalColor: number;         // Color normal de pelota
  activeColor: number;         // Color powershot activo
  flashColor: number;          // Color de titileo
}

export interface PowershotState {
  isActive: boolean;
  counter: number;
  currentPlayerId: number;
  activationThreshold: number;
  timer: NodeJS.Timeout | null;
  playerCooldowns: Map<number, number>;
  matchUsage: Map<number, number>;
}

export class PowershotManager {
  private logger = createLogger('POWERSHOT');
  private config: PowershotConfig;
  private state: PowershotState;
  private haxballRoom: any = null;
  private ruid: string;
  private originalBallProperties: any = null;
  private eventUnsubscribers: Array<() => void> = [];

  // Configuraciones predefinidas por modo
  private static readonly MODE_CONFIGS: Record<PowershotMode, Partial<PowershotConfig>> = {
    [PowershotMode.DISABLED]: {
      activationTime: 0,
      powerMultiplier: 1.0,
      cooldownTime: 0,
      maxPerMatch: 0
    },
    [PowershotMode.CLASSIC]: {
      activationTime: 1500,      // 1.5 segundos
      stickDistance: 26,
      powerMultiplier: 2.0,
      cooldownTime: 30000,       // 30 segundos
      maxPerMatch: 10,
      normalColor: 0xFFFFFF,
      activeColor: 0xFF4500,
      flashColor: 0xCCCCCC
    },
    [PowershotMode.FAST]: {
      activationTime: 800,       // 0.8 segundos
      stickDistance: 24,
      powerMultiplier: 1.6,
      cooldownTime: 15000,       // 15 segundos
      maxPerMatch: 15,
      normalColor: 0xFFFFFF,
      activeColor: 0x00FF00,
      flashColor: 0x88FF88
    },
    [PowershotMode.EPIC]: {
      activationTime: 3000,      // 3 segundos
      stickDistance: 30,
      powerMultiplier: 3.0,
      cooldownTime: 60000,       // 60 segundos
      maxPerMatch: 3,
      normalColor: 0xFFFFFF,
      activeColor: 0xFF0080,
      flashColor: 0xFF88CC
    },
    [PowershotMode.COMPETITIVE]: {
      activationTime: 2000,      // 2 segundos
      stickDistance: 22,
      powerMultiplier: 1.8,
      cooldownTime: 45000,       // 45 segundos
      maxPerMatch: 5,
      normalColor: 0xFFFFFF,
      activeColor: 0x0080FF,
      flashColor: 0x88CCFF
    }
  };

  constructor(ruid: string, mode: PowershotMode = PowershotMode.CLASSIC) {
    this.ruid = ruid;
    this.config = this.createConfig(mode);
    this.state = this.createInitialState();
    this.setupEventListeners();
  }

  public setHaxballRoom(room: any): void {
    this.haxballRoom = room;
  }

  public setOriginalBallProperties(ballConfig: any): void {
    this.originalBallProperties = {
      radius: ballConfig.ballRadius || 6.4,
      color: parseInt(ballConfig.ballColor || 'FFFFFF', 16),
      bCoeff: ballConfig.ballBCoeff || 0.4,
      invMass: ballConfig.ballInvMass || 1.5,
      damping: ballConfig.ballDamping || 0.99
    };
    
    this.logger.debug('Original ball properties set', this.originalBallProperties);
  }

  private createConfig(mode: PowershotMode): PowershotConfig {
    const baseConfig: PowershotConfig = {
      mode,
      activationTime: 1500,
      stickDistance: 26,
      powerMultiplier: 2.0,
      cooldownTime: 30000,
      maxPerMatch: 10,
      normalColor: 0xFFFFFF,
      activeColor: 0xFF4500,
      flashColor: 0xCCCCCC
    };

    return { ...baseConfig, ...PowershotManager.MODE_CONFIGS[mode] };
  }

  private createInitialState(): PowershotState {
    return {
      isActive: false,
      counter: 0,
      currentPlayerId: 0,
      activationThreshold: Math.floor(this.config.activationTime / 25), // 25ms ticks
      timer: null,
      playerCooldowns: new Map(),
      matchUsage: new Map()
    };
  }

  private setupEventListeners(): void {
    this.cleanupEventListeners();
    
    const ballKickHandler = async (event: any) => {
      await this.onPlayerBallKick(event.player);
    };
    
    const gameTickHandler = () => {
      this.onGameTick();
    };
    
    const gameStartHandler = () => {
      this.onGameStart();
    };
    
    const gameStopHandler = () => {
      this.onGameStop();
    };
    
    eventBus.on('haxball.player.ballKick', ballKickHandler);
    eventBus.on('haxball.game.tick', gameTickHandler);
    eventBus.on('haxball.game.start', gameStartHandler);
    eventBus.on('haxball.game.stop', gameStopHandler);
    
    this.eventUnsubscribers.push(
      () => eventBus.off('haxball.player.ballKick', ballKickHandler),
      () => eventBus.off('haxball.game.tick', gameTickHandler),
      () => eventBus.off('haxball.game.start', gameStartHandler),
      () => eventBus.off('haxball.game.stop', gameStopHandler)
    );
    
    this.logger.info('Powershot event listeners configured');
  }
  
  private cleanupEventListeners(): void {
    this.eventUnsubscribers.forEach(unsubscribe => unsubscribe());
    this.eventUnsubscribers = [];
  }

  public setMode(mode: PowershotMode): void {
    this.logger.info(`Changing powershot mode: ${this.config.mode} → ${mode}`);
    
    this.resetPowershot();
    this.config = this.createConfig(mode);
    this.state.activationThreshold = Math.floor(this.config.activationTime / 25);
    
    if (mode === PowershotMode.DISABLED) {
      this.resetAllCooldowns();
    }
  }

  public getMode(): PowershotMode {
    return this.config.mode;
  }

  public getModeInfo(): any {
    return {
      mode: this.config.mode,
      config: { ...this.config },
      description: this.getModeDescription()
    };
  }

  private getModeDescription(): string {
    switch (this.config.mode) {
      case PowershotMode.DISABLED:
        return '🚫 Powershot desactivado';
      case PowershotMode.CLASSIC:
        return '⚡ Modo clásico - Balance entre potencia y tiempo';
      case PowershotMode.FAST:
        return '💨 Modo rápido - Activación rápida, menos potencia';
      case PowershotMode.EPIC:
        return '🔥 Modo épico - Máxima potencia, tiempo largo';
      case PowershotMode.COMPETITIVE:
        return '🏆 Modo competitivo - Balanceado para torneos';
      default:
        return '❓ Modo desconocido';
    }
  }

  private async onPlayerBallKick(player: any): Promise<void> {
    if (this.config.mode === PowershotMode.DISABLED) return;

    // Aplicar powershot si está activo
    if (this.state.isActive && this.state.currentPlayerId === player.id) {
      this.applyPowershotKick(player);
    }

    // Iniciar detección para este jugador
    await this.checkPlayerBallPossession(player.id);
  }

  private onGameTick(): void {
    if (this.config.mode === PowershotMode.DISABLED) return;

    // Verificar posesión cada 15 ticks (optimizado)
    if (Date.now() % 375 < 25) { // Aproximadamente cada 375ms
      this.checkAllPlayersPossession().catch(error => {
        this.logger.error('Error in game tick possession check', error);
      });
    }
  }

  private onGameStart(): void {
    this.resetPowershot();
    this.resetMatchUsage();
    this.initializeBallProperties();
  }

  private onGameStop(): void {
    this.resetPowershot();
  }

  private async checkPlayerBallPossession(playerId: number): Promise<void> {
    if (!this.isPlayerEligible(playerId)) {
      return;
    }

    const isHolding = await this.isBallStuckToPlayer(playerId);
    const wasHoldingBefore = this.state.currentPlayerId === playerId && this.state.timer !== null;

    if (isHolding && !wasHoldingBefore) {
      this.startPowershotTimer(playerId);
    } else if (!isHolding && wasHoldingBefore) {
      this.resetPowershot();
    }
  }

  private async checkAllPlayersPossession(): Promise<void> {
    if (!this.haxballRoom) return;

    try {
      const players = await this.haxballRoom.getCurrentPlayers();
      
      // Validar que players sea un array
      if (!Array.isArray(players)) {
        return;
      }
      
      let ballHolderFound = false;

      for (const player of players) {
        if (player && this.isPlayerEligible(player.id) && (await this.isBallStuckToPlayer(player.id))) {
          if (!ballHolderFound) {
            await this.checkPlayerBallPossession(player.id);
            ballHolderFound = true;
          } else {
            // Múltiples jugadores con pelota - resetear
            this.resetPowershot();
            break;
          }
        }
      }

      if (!ballHolderFound && this.state.isActive) {
        this.resetPowershot();
      }
    } catch (error) {
      this.logger.error('Error checking players possession', error);
    }
  }

  private isPlayerEligible(playerId: number): boolean {
    if (this.config.mode === PowershotMode.DISABLED) {
      return false;
    }
    if (!playerId || playerId === 0) {
      return false;
    }

    return true;
  }

  private async isBallStuckToPlayer(playerId: number): Promise<boolean> {
    if (!this.haxballRoom) {
      return false;
    }

    try {
      const ballPos = await this.haxballRoom.getBallPosition?.();
      const player = await this.haxballRoom.getPlayer?.(playerId);

      if (!ballPos || !player?.position) {
        return false;
      }

      const deltaX = ballPos.x - player.position.x;
      const deltaY = ballPos.y - player.position.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      return distance <= this.config.stickDistance;
    } catch (error) {
      return false;
    }
  }

  private startPowershotTimer(playerId: number): void {
    if (this.state.currentPlayerId !== playerId) {
      this.resetPowershot();
      this.state.currentPlayerId = playerId;
    }

    if (this.state.timer) return;

    this.state.counter = 0;
    this.logger.debug(`Starting powershot timer for player ${playerId}`);

    this.state.timer = setInterval(async () => {
      if (!(await this.isBallStuckToPlayer(playerId))) {
        this.resetPowershot();
        return;
      }

      this.state.counter++;
      this.updateBallVisuals();

      if (this.state.counter >= this.state.activationThreshold && !this.state.isActive) {
        this.activatePowershot();
      }
    }, 25);
  }

  private updateBallVisuals(): void {
    if (!this.haxballRoom) return;

    // Sistema de titileo basado en porcentaje del tiempo total (igual que haxbotron viejo)
    const progressPercent = (this.state.counter / this.state.activationThreshold) * 100;
    
    // Solo manejar colores si no se ha activado aún el powershot
    if (!this.state.isActive) {
      // Titileo empieza al 60% del tiempo y termina al 100%
      if (progressPercent >= 60 && progressPercent < 100) {
        // Calcular cuántos ticks han pasado en este 40% de tiempo (60% a 100%)
        const flashingPeriod = this.state.activationThreshold * 0.4; // 40% del tiempo total
        const ticksInFlashingPeriod = this.state.counter - (this.state.activationThreshold * 0.6);
        
        // Dividir el período de titileo en exactamente 2 ciclos completos
        const cycleDuration = flashingPeriod / 2; // Cada ciclo es 20% del tiempo total
        const currentCycle = Math.floor(ticksInFlashingPeriod / cycleDuration);
        const ticksInCurrentCycle = ticksInFlashingPeriod % cycleDuration;
        const isFirstHalfOfCycle = ticksInCurrentCycle < (cycleDuration / 2);
        
        // Solo titilar si estamos en uno de los 2 ciclos permitidos
        if (currentCycle < 2) {
          const flashColor = isFirstHalfOfCycle ? this.config.flashColor : this.config.normalColor; // Gris claro/Blanco
          this.setBallProperties({ color: flashColor });
        } else {
          // Después de los 2 ciclos, mantener color normal
          this.setBallProperties({ color: this.config.normalColor });
        }
      } else if (progressPercent < 60) {
        // Mantener pelota blanca antes del 60%
        this.setBallProperties({ color: this.config.normalColor });
      }
    }
  }

  private activatePowershot(): void {
    if (this.state.isActive) return;

    this.state.isActive = true;
    this.setBallProperties({
      color: this.config.activeColor,
      invMass: this.config.powerMultiplier
    });

    this.logger.info(`🔥 Powershot activated for player ${this.state.currentPlayerId}`);
  }

  private applyPowershotKick(player: any): void {
    if (!this.state.isActive) return;

    this.logger.info(`⚡ Powershot applied by player ${player.id}!`);
    
    // Resetear después del kick
    this.resetPowershot();
  }

  public resetPowershot(): void {
    if (this.state.timer) {
      clearInterval(this.state.timer);
      this.state.timer = null;
    }

    // Restaurar propiedades originales de la pelota
    if (this.originalBallProperties) {
      this.setBallProperties({
        color: this.originalBallProperties.color,
        invMass: this.originalBallProperties.invMass
      });
    }

    this.state.isActive = false;
    this.state.counter = 0;
    this.state.currentPlayerId = 0;
  }

  private setBallProperties(props: { color?: number; invMass?: number }): void {
    if (!this.haxballRoom?.setDiscProperties) return;

    const ballProps: Record<string, number> = {};
    if (props.color !== undefined) ballProps.color = props.color;
    if (props.invMass !== undefined) ballProps.invMass = props.invMass;

    void this.haxballRoom.setDiscProperties(0, ballProps).catch((error) => {
      this.logger.error('Error setting ball properties', error);
    });
  }

  private initializeBallProperties(): void {
    if (!this.originalBallProperties) return;
    
    this.setBallProperties({
      color: this.originalBallProperties.color,
      invMass: this.originalBallProperties.invMass
    });
  }

  private resetAllCooldowns(): void {
    this.state.playerCooldowns.clear();
  }

  private resetMatchUsage(): void {
    this.state.matchUsage.clear();
  }

  public getStatus(): any {
    return {
      mode: this.config.mode,
      enabled: this.config.mode !== PowershotMode.DISABLED,
      config: { ...this.config },
      state: {
        isActive: this.state.isActive,
        currentPlayer: this.state.currentPlayerId,
        counter: this.state.counter,
        threshold: this.state.activationThreshold,
        progress: this.state.activationThreshold > 0 ? (this.state.counter / this.state.activationThreshold) * 100 : 0
      },
      cooldowns: Array.from(this.state.playerCooldowns.entries()).map(([id, time]) => ({
        playerId: id,
        remainingMs: Math.max(0, time - Date.now())
      })),
      matchUsage: Array.from(this.state.matchUsage.entries()).map(([id, count]) => ({
        playerId: id,
        used: count,
        remaining: Math.max(0, this.config.maxPerMatch - count)
      }))
    };
  }

  public getDebugInfo(): any {
    return {
      ...this.getStatus(),
      description: this.getModeDescription(),
      availableModes: Object.values(PowershotMode),
      modeConfigs: PowershotManager.MODE_CONFIGS
    };
  }

  /**
   * Envía mensaje de debug al chat de Haxball
   */
  private sendDebugMessage(message: string): void {
    if (!this.haxballRoom?.sendMessage) return;
    
    try {
      // Enviar solo a admins o todos (cambiar según necesidad)
      this.haxballRoom.sendMessage(null, `[POWERSHOT] ${message}`, 0x00FFFF, 'small', 0);
    } catch (error) {
      // Ignorar errores de envío
    }
  }

  /**
   * Limpia todos los recursos del PowershotManager
   */
  public cleanup(): void {
    this.resetPowershot();
    this.resetAllCooldowns();
    this.resetMatchUsage();
    this.cleanupEventListeners();
    this.haxballRoom = null;
    this.logger.system('PowershotManager cleanup completed', { ruid: this.ruid });
  }
}