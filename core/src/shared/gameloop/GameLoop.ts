import { createLogger } from '../logger/Logger';
import { eventBus } from '../events/EventBus';
import { StadiumManager } from '../stadiums/StadiumManager';
import { PlayerCacheManager } from '../player/PlayerCacheManager';

/**
 * Estados posibles de un Game Loop
 */
export enum GameLoopState {
  IDLE = 'IDLE',
  STARTING = 'STARTING',
  RUNNING = 'RUNNING',
  STOPPING = 'STOPPING',
  ERROR = 'ERROR'
}

/**
 * Configuración base para todos los loops
 */
export interface GameLoopConfig {
  ruid: string;
  minPlayers: number;
  stadiumName: string;
  timeLimit: number;
  scoreLimit: number;
  teamLock: boolean;
}

/**
 * Información de transición entre loops
 */
export interface LoopTransitionInfo {
  from: string;
  to: string;
  reason: string;
  timestamp: number;
  playerCount: number;
}

/**
 * Clase base abstracta para todos los Game Loops
 * 
 * Un Game Loop maneja el ciclo completo de un modo de juego:
 * - Cargar estadio
 * - Aplicar configuraciones
 * - Iniciar/detener juego
 * - Manejar eventos críticos (gameStart, gameStop, teamVictory)
 * - Guardar estadísticas
 * - Reiniciar o transicionar a otro loop
 */
export abstract class GameLoop {
  protected logger: any;
  protected state: GameLoopState = GameLoopState.IDLE;
  protected config: GameLoopConfig;
  protected haxballRoom: any = null;
  protected stadiumManager: StadiumManager;
  protected startTime: number = 0;
  protected updateInterval: any = null;
  protected name: string;
  private eventListeners: Array<{ event: string; listener: (...args: any[]) => void }> = [];
  protected isStopping = false;

  constructor(name: string, config: GameLoopConfig) {
    this.name = name;
    this.config = config;
    this.logger = createLogger(`Loop:${name}`);
    this.stadiumManager = new StadiumManager();
    // NO configurar listeners en constructor - se configuran en start()
  }

  /**
   * Configura el HaxballRoom que este loop controlará
   */
  public setHaxballRoom(room: any): void {
    this.haxballRoom = room;
  }

  /**
   * Obtiene el estado actual del loop
   */
  public getState(): GameLoopState {
    return this.state;
  }

  /**
   * Obtiene información del loop para debug
   */
  public getDebugInfo(): any {
    return {
      name: this.name,
      state: this.state,
      uptime: this.startTime > 0 ? Date.now() - this.startTime : 0,
      config: this.config
    };
  }

  /**
   * Configura los listeners de eventos de Haxball
   */
  protected setupEventListeners(): void {
    this.cleanupEventListeners();
    
    const gameStartListener = (event: any) => {
      if (this.state !== GameLoopState.RUNNING || this.isStopping) return;
      return this.handleGameStart(event);
    };
    const gameStopListener = (event: any) => {
      if (this.state !== GameLoopState.RUNNING || this.isStopping) return;
      return this.handleGameStop(event);
    };
    const teamVictoryListener = (event: any) => {
      if (this.state !== GameLoopState.RUNNING || this.isStopping) return;
      return this.handleTeamVictory(event);
    };
    
    eventBus.onEvent('haxball.game.start', gameStartListener);
    eventBus.onEvent('haxball.game.stop', gameStopListener);
    eventBus.onEvent('haxball.team.victory', teamVictoryListener);
    
    this.eventListeners.push(
      { event: 'haxball.game.start', listener: gameStartListener },
      { event: 'haxball.game.stop', listener: gameStopListener },
      { event: 'haxball.team.victory', listener: teamVictoryListener }
    );
  }

  /**
   * Limpia los event listeners
   */
  private cleanupEventListeners(): void {
    this.eventListeners.forEach(({ event, listener }) => {
      eventBus.offEvent(event, listener);
    });
    this.eventListeners = [];
  }

  /**
   * Inicia el loop
   */
  public async start(): Promise<void> {
    if (this.state !== GameLoopState.IDLE && this.state !== GameLoopState.STOPPING) {
      this.logger.warn(`Cannot start loop - current state: ${this.state}`);
      return;
    }

    try {
      this.state = GameLoopState.STARTING;
      this.startTime = Date.now();
      this.isStopping = false;
      
      this.logger.info(`Starting ${this.name}`);
      
      // Configurar event listeners ANTES de onEnter
      this.setupEventListeners();
      
      await this.onEnter();
      
      this.state = GameLoopState.RUNNING;
      
      // Iniciar el ciclo de actualización
      this.startUpdateCycle();
      
      this.logger.success(`${this.name} started successfully`);
      
      eventBus.emitEvent('loop.started', {
        loop: this.name,
        timestamp: Date.now()
      });
      
    } catch (error) {
      this.state = GameLoopState.ERROR;
      this.logger.error(`Failed to start ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * Detiene el loop
   */
  public async stop(): Promise<void> {
    if (this.state === GameLoopState.IDLE || this.state === GameLoopState.STOPPING) {
      return;
    }

    try {
      this.state = GameLoopState.STOPPING;
      this.isStopping = true;
      
      this.logger.info(`Stopping ${this.name}`);
      
      // Detener ciclo de actualización inmediatamente
      this.stopUpdateCycle();
      
      // Limpiar event listeners ANTES de onExit
      this.cleanupEventListeners();
      
      await this.onExit();
      
      this.state = GameLoopState.IDLE;
      this.startTime = 0;
      this.isStopping = false;
      
      this.logger.success(`${this.name} stopped successfully`);
      
      eventBus.emitEvent('loop.stopped', {
        loop: this.name,
        timestamp: Date.now()
      });
      
    } catch (error) {
      this.state = GameLoopState.ERROR;
      this.isStopping = false;
      this.logger.error(`Failed to stop ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * Inicia el ciclo de actualización del loop
   */
  protected startUpdateCycle(): void {
    // Actualizar cada 3 segundos
    this.updateInterval = setInterval(() => {
      if (this.state === GameLoopState.RUNNING && !this.isStopping) {
        this.onUpdate();
      }
    }, 3000);
  }

  /**
   * Detiene el ciclo de actualización
   */
  protected stopUpdateCycle(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Solicita una transición a otro loop
   */
  protected requestTransition(targetLoop: string, reason: string): void {
    this.logger.info(`Requesting transition to ${targetLoop}: ${reason}`);
    
    eventBus.emitEvent('loop.transition.request', {
      from: this.name,
      to: targetLoop,
      reason,
      timestamp: Date.now()
    });
  }

  /**
   * Método helper para obtener el conteo de jugadores
   */
  protected getPlayerCount(): { total: number; red: number; blue: number } {
    const playerCache = PlayerCacheManager.getInstance();
    const counts = playerCache.getActiveTeamCounts();
    return {
      total: counts.red + counts.blue,
      red: counts.red,
      blue: counts.blue
    };
  }

  // ==================== MÉTODOS ABSTRACTOS ====================
  // Cada loop debe implementar estos métodos

  /**
   * Se ejecuta cuando el loop se activa
   * Debe configurar todo lo necesario: estadio, settings, etc
   */
  protected abstract onEnter(): Promise<void>;

  /**
   * Se ejecuta periódicamente mientras el loop está activo
   * Debe monitorear condiciones y solicitar transiciones si es necesario
   */
  protected abstract onUpdate(): void;

  /**
   * Se ejecuta cuando el loop se desactiva
   * Debe limpiar recursos y preparar para el siguiente loop
   */
  protected abstract onExit(): Promise<void>;

  /**
   * Maneja el evento de inicio de juego
   */
  protected abstract handleGameStart(event: any): Promise<void>;

  /**
   * Maneja el evento de fin de juego
   */
  protected abstract handleGameStop(event: any): Promise<void>;

  /**
   * Maneja el evento de victoria de equipo
   */
  protected abstract handleTeamVictory(event: any): Promise<void>;

  /**
   * Limpia todos los recursos del loop
   */
  public cleanup(): void {
    this.stopUpdateCycle();
    this.cleanupEventListeners();
  }
}
