import { createLogger } from '../logger/Logger';
import { eventBus } from '../events/EventBus';
import { GameLoop, LoopTransitionInfo } from './GameLoop';

/**
 * Game Loop Controller
 * 
 * Responsabilidades:
 * - Mantener registro de todos los loops disponibles
 * - Decidir qué loop activar según condiciones
 * - Manejar transiciones entre loops de forma segura
 * - Monitorear el estado del loop activo
 * - Proveer información de debug
 */
export class GameLoopController {
  private logger = createLogger('GameLoopController');
  private loops: Map<string, GameLoop> = new Map();
  private activeLoop: GameLoop | null = null;
  private transitionHistory: LoopTransitionInfo[] = [];
  private isTransitioning: boolean = false;
  private minPlayers: number;

  constructor(minPlayers: number = 4) {
    this.minPlayers = minPlayers;
    this.setupEventListeners();
  }

  /**
   * Registra un loop disponible
   */
  public registerLoop(name: string, loop: GameLoop): void {
    this.loops.set(name, loop);
    this.logger.info(`Loop registered: ${name}`);
  }

  /**
   * Obtiene un loop por nombre
   */
  public getLoop(name: string): GameLoop | undefined {
    return this.loops.get(name);
  }

  /**
   * Obtiene el loop activo actual
   */
  public getActiveLoop(): GameLoop | null {
    return this.activeLoop;
  }

  /**
   * Obtiene el nombre del loop activo
   */
  public getActiveLoopName(): string | null {
    if (!this.activeLoop) return null;
    
    for (const [name, loop] of this.loops.entries()) {
      if (loop === this.activeLoop) {
        return name;
      }
    }
    
    return null;
  }

  /**
   * Decide qué loop debe estar activo según la cantidad de jugadores
   */
  public decideLoop(playerCount: number): string {
    const availableLoops = Array.from(this.loops.keys());
    
    if (playerCount >= this.minPlayers && availableLoops.includes('match')) {
      return 'match';
    }
    
    return availableLoops.includes('training') ? 'training' : availableLoops[0] || 'training';
  }

  /**
   * Configura listeners de eventos
   */
  private setupEventListeners(): void {
    // Escuchar solicitudes de transición desde los loops
    eventBus.onEvent('loop.transition.request', async (data: any) => {
      const { from, to, reason } = data;
      this.logger.info(`Transition requested: ${from} → ${to} (${reason})`);
      
      await this.transitionTo(to, reason);
    });

    // Escuchar cambios en la cantidad de jugadores
    eventBus.onEvent('player.count.changed', async (data: any) => {
      const { count } = data;
      await this.handlePlayerCountChange(count);
    });
  }

  /**
   * Maneja cambios en la cantidad de jugadores
   */
  private async handlePlayerCountChange(playerCount: number): Promise<void> {
    if (this.isTransitioning || !this.activeLoop) {
      return;
    }

    const currentLoopName = this.getActiveLoopName();
    const requiredLoop = this.decideLoop(playerCount);

    // Si el loop requerido es diferente al actual, hacer transición
    if (currentLoopName !== requiredLoop) {
      this.logger.info(`Player count changed (${playerCount}) - transitioning from ${currentLoopName} to ${requiredLoop}`);
      await this.transitionTo(requiredLoop, `playerCountChange (${playerCount})`);
    }
  }

  /**
   * Realiza una transición segura a otro loop
   */
  public async transitionTo(targetLoopName: string, reason: string = 'manual'): Promise<void> {
    if (this.isTransitioning) {
      this.logger.warn('Already transitioning, ignoring request');
      return;
    }

    const targetLoop = this.loops.get(targetLoopName);
    if (!targetLoop) {
      this.logger.error(`Loop not found: ${targetLoopName}`);
      return;
    }

    // Si ya estamos en el loop target, no hacer nada
    if (this.activeLoop === targetLoop) {
      this.logger.debug(`Already in ${targetLoopName}, skipping transition`);
      return;
    }

    // Validar que el loop esté correctamente configurado
    if (!targetLoop.setHaxballRoom) {
      this.logger.error(`Loop ${targetLoopName} is not properly initialized`);
      return;
    }

    this.isTransitioning = true;
    const fromLoopName = this.getActiveLoopName() || 'none';

    try {
      this.logger.info(`🔄 Starting transition: ${fromLoopName} → ${targetLoopName}`);

      // Emitir evento de inicio de transición
      eventBus.emitEvent('loop.transition.started', {
        from: fromLoopName,
        to: targetLoopName,
        reason,
        timestamp: Date.now()
      });

      // 1. Detener loop actual si existe
      if (this.activeLoop) {
        this.logger.info(`Stopping ${fromLoopName}...`);
        await this.activeLoop.stop();
        // Pequeño delay para asegurar cleanup completo
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 2. Activar nuevo loop
      this.logger.info(`Starting ${targetLoopName}...`);
      this.activeLoop = targetLoop;
      await this.activeLoop.start();

      // 3. Registrar transición en historial
      const transitionInfo: LoopTransitionInfo = {
        from: fromLoopName,
        to: targetLoopName,
        reason,
        timestamp: Date.now(),
        playerCount: 0 // TODO: obtener el conteo real
      };
      this.transitionHistory.unshift(transitionInfo);

      // Mantener solo las últimas 50 transiciones
      if (this.transitionHistory.length > 50) {
        this.transitionHistory = this.transitionHistory.slice(0, 50);
      }

      this.logger.success(`✅ Transition completed: ${fromLoopName} → ${targetLoopName}`);

      // Emitir evento de transición completada
      eventBus.emitEvent('loop.transition.completed', {
        from: fromLoopName,
        to: targetLoopName,
        reason,
        timestamp: Date.now()
      });

    } catch (error) {
      this.logger.error(`❌ Transition failed: ${fromLoopName} → ${targetLoopName}`, error);

      // Emitir evento de error
      eventBus.emitEvent('loop.transition.error', {
        from: fromLoopName,
        to: targetLoopName,
        reason,
        error: error.message,
        timestamp: Date.now()
      });

      throw error;

    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * Inicializa el controller con un loop específico
   */
  public async initialize(initialLoopName: string = 'training'): Promise<void> {
    this.logger.info(`Initializing with ${initialLoopName} loop`);
    await this.transitionTo(initialLoopName, 'initialization');
  }

  /**
   * Obtiene información de debug completa
   */
  public getDebugInfo(): any {
    const activeLoopName = this.getActiveLoopName();
    
    return {
      controller: {
        isTransitioning: this.isTransitioning,
        minPlayers: this.minPlayers,
        availableLoops: Array.from(this.loops.keys())
      },
      activeLoop: activeLoopName ? {
        name: activeLoopName,
        state: this.activeLoop?.getState(),
        info: this.activeLoop?.getDebugInfo()
      } : null,
      transitions: {
        total: this.transitionHistory.length,
        recent: this.transitionHistory.slice(0, 10)
      }
    };
  }

  /**
   * Obtiene el historial completo de transiciones
   */
  public getTransitionHistory(): LoopTransitionInfo[] {
    return [...this.transitionHistory];
  }

  /**
   * Obtiene estadísticas del controller
   */
  public getStats(): any {
    const loopCounts: { [key: string]: number } = {};

    for (const transition of this.transitionHistory) {
      loopCounts[transition.to] = (loopCounts[transition.to] || 0) + 1;
    }

    const trainingLoop = this.loops.get('training');
    const matchLoop = this.loops.get('match');
    const trainingActivations = loopCounts['training'] || 0;
    const matchActivations = loopCounts['match'] || 0;

    return {
      totalTransitions: this.transitionHistory.length,
      loopActivations: loopCounts,
      currentLoop: this.getActiveLoopName(),
      isTransitioning: this.isTransitioning,
      training: {
        activations: trainingActivations,
        totalTime: trainingLoop?.getDebugInfo()?.uptime ?? 0
      },
      match: {
        activations: matchActivations,
        totalTime: matchLoop?.getDebugInfo()?.uptime ?? 0,
        matchesPlayed: matchActivations
      }
    };
  }

  /**
   * Limpia todos los recursos
   */
  public async cleanup(): Promise<void> {
    this.logger.info('Cleaning up GameLoopController');

    // Detener loop activo
    if (this.activeLoop) {
      await this.activeLoop.stop();
    }

    // Limpiar todos los loops
    for (const loop of this.loops.values()) {
      loop.cleanup();
    }

    this.loops.clear();
    this.activeLoop = null;
    this.transitionHistory = [];

    this.logger.info('GameLoopController cleaned up');
  }
}
