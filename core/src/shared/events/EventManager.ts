import { eventBus } from './EventBus';
import { HaxballEventAdapter } from '../../haxball/HaxballEventAdapter';
import { PlayerJoinHandler } from './handlers/PlayerJoinHandler';
import { PlayerLeaveHandler } from './handlers/PlayerLeaveHandler';
import { PlayerChatHandler } from './handlers/PlayerChatHandler';
import { GameEventHandlers } from './handlers/GameEventHandlers';
import { BalanceEventHandler } from './handlers/BalanceEventHandler';
import { createLogger } from '../logger/Logger';

/**
 * Gestor central de eventos que coordina todos los handlers
 * Regla #4: Separación de responsabilidades con comunicación por eventos
 */
export class EventManager {
  private static instance: EventManager;
  private logger = createLogger('EventManager');
  private haxballAdapter: HaxballEventAdapter;
  private handlers: any[] = [];
  private balanceEventHandler: BalanceEventHandler;
  private isInitialized = false;

  private constructor() {
    this.haxballAdapter = new HaxballEventAdapter();
    this.balanceEventHandler = new BalanceEventHandler();
  }

  public static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  /** Limpia y destruye el singleton (nueva sala = instancia nueva) */
  public static resetInstance(): void {
    if (EventManager.instance) {
      EventManager.instance.cleanup();
      EventManager.instance = undefined as unknown as EventManager;
    }
  }

  /**
   * Inicializa todos los event handlers
   */
  public initialize(chatManager?: any, ruid?: string): void {
    if (this.isInitialized) {
      this.logger.warn('[EventManager] Already initialized');
      return;
    }

    this.logger.info('[EventManager] Initializing event system');

    try {
      // Inicializar handlers en orden de prioridad
      this.initializeCriticalHandlers(chatManager, ruid);
      this.initializeImportantHandlers();
      this.initializeSecondaryHandlers();

      this.isInitialized = true;
      this.logger.info('[EventManager] Event system initialized successfully');

    } catch (error) {
      this.logger.error('[EventManager] Failed to initialize event system:', error);
      throw error;
    }
  }

  /**
   * Configura los event listeners de Haxball
   */
  public setupHaxballEvents(haxballRoom: any, chatManager?: any): void {
    if (!this.isInitialized) {
      throw new Error('EventManager must be initialized before setting up Haxball events');
    }

    this.logger.info('[EventManager] Setting up Haxball event listeners');
    
    // NO crear GameEventHandlers aquí - ya se creó en HaxballRoom constructor
    // Solo configurar HaxballRoom en handlers existentes
    this.handlers.forEach(handler => {
      if (handler.setHaxballRoom) {
        handler.setHaxballRoom(haxballRoom);
      }
      if (handler.constructor.name === 'PlayerChatHandler' && handler.playerJoinHandler) {
        // Asegurar que PlayerChatHandler tenga acceso al PlayerJoinHandler correcto
        const joinHandler = this.handlers.find(h => h.constructor.name === 'PlayerJoinHandler');
        if (joinHandler) {
          handler.playerJoinHandler = joinHandler;
        }
      }
    });
    
    // Configurar contraseñas de admin
    this.configureAdminPasswords(haxballRoom, chatManager);
  }

  /**
   * Inicializa handlers críticos (⭐⭐⭐⭐⭐)
   */
  private initializeCriticalHandlers(chatManager?: any, ruid?: string, haxballRoom?: any): void {
    this.logger.info('[EventManager] Initializing critical handlers');

    // Crear handlers una sola vez con parámetros iniciales
    const joinHandler = new PlayerJoinHandler(chatManager, ruid);
    const chatHandler = new PlayerChatHandler(chatManager, ruid, haxballRoom, joinHandler);
    const leaveHandler = new PlayerLeaveHandler();
    
    // Balance se maneja directamente en BalanceManager
    
    // Handler de victoria de equipo
    const { TeamVictoryHandler } = require('./handlers/TeamVictoryHandler');
    const victoryHandler = new TeamVictoryHandler(chatManager);
    
    // GameEventHandlers (se creará en HaxballRoom y se agregará después)
    // NO crear aquí para evitar duplicación
    
    // Agregar todos los handlers críticos
    this.handlers.push(joinHandler, chatHandler, leaveHandler, victoryHandler);
    
    this.logger.info(`[EventManager] Initialized ${this.handlers.length} critical handlers`);
  }

  /**
   * Inicializa handlers importantes (⭐⭐⭐)
   */
  private initializeImportantHandlers(): void {
    this.logger.info('[EventManager] Initializing important handlers');

    // Handlers de jugadores importantes
    const { PlayerTeamChangeHandler } = require('./handlers/PlayerTeamChangeHandler');
    const { PlayerAdminChangeHandler } = require('./handlers/PlayerAdminChangeHandler');
    const { PlayerActivityHandler } = require('./handlers/PlayerActivityHandler');
    const { PlayerBallKickHandler } = require('./handlers/PlayerBallKickHandler');
    
    this.handlers.push(new PlayerTeamChangeHandler());
    this.handlers.push(new PlayerAdminChangeHandler());
    this.handlers.push(new PlayerActivityHandler());
    this.handlers.push(new PlayerBallKickHandler());
  }

  /**
   * Inicializa handlers secundarios (⭐⭐)
   */
  private initializeSecondaryHandlers(): void {
    this.logger.info('[EventManager] Initializing secondary handlers');

    // Handlers de juego secundarios
    const { GamePauseHandler } = require('./handlers/GamePauseHandler');
    const { GameUnpauseHandler } = require('./handlers/GameUnpauseHandler');
    const { GameTickHandler } = require('./handlers/GameTickHandler');
    const { StadiumChangeHandler } = require('./handlers/StadiumChangeHandler');
    const { PositionsResetHandler } = require('./handlers/PositionsResetHandler');
    const { PlayerKickedHandler } = require('./handlers/PlayerKickedHandler');
    const { RoomLinkHandler } = require('./handlers/RoomLinkHandler');
    const { KickRateLimitSetHandler } = require('./handlers/KickRateLimitSetHandler');
    
    this.handlers.push(new GamePauseHandler());
    this.handlers.push(new GameUnpauseHandler());
    this.handlers.push(new GameTickHandler());
    this.handlers.push(new StadiumChangeHandler());
    this.handlers.push(new PositionsResetHandler());
    this.handlers.push(new PlayerKickedHandler());
    this.handlers.push(new RoomLinkHandler());
    this.handlers.push(new KickRateLimitSetHandler());
  }

  /**
   * Obtiene estadísticas del sistema de eventos
   */
  public getEventStats(): any {
    const eventNames = eventBus.eventNames();
    const stats = {
      totalEvents: eventNames.length,
      totalHandlers: this.handlers.length,
      isInitialized: this.isInitialized,
      events: eventNames.map(eventName => ({
        name: eventName,
        listenerCount: eventBus.listenerCount(eventName as string)
      }))
    };

    return stats;
  }

  /**
   * Limpia todos los event listeners (para testing o shutdown)
   */
  public cleanup(): void {
    this.logger.info('[EventManager] Cleaning up event system');
    
    eventBus.removeAllListeners();
    this.handlers = [];
    this.isInitialized = false;
    
    this.logger.info('[EventManager] Event system cleaned up');
  }

  /**
   * Emite un evento personalizado
   */
  public emitCustomEvent(eventName: string, data?: any): void {
    eventBus.emitEvent(eventName, data);
  }

  /**
   * Registra un listener personalizado
   */
  public onCustomEvent(eventName: string, listener: (...args: any[]) => void): void {
    eventBus.onEvent(eventName, listener);
  }

  /**
   * Reinicializa handlers con ChatManager
   */
  private reinitializeHandlersWithChat(chatManager: any, ruid?: string): void {
    // No limpiar handlers, solo agregar los que faltan
    // GameEventHandlers ya se agregó arriba con el ruid correcto
    
    this.logger.info('[EventManager] Handlers reinitialized with ChatManager');
  }



  /**
   * Registra GameEventHandlers desde HaxballRoom (evita duplicación)
   */
  public registerGameEventHandlers(gameEventHandlers: any): void {
    // Verificar que no esté ya registrado
    const existingHandler = this.handlers.find(h => h.constructor.name === 'GameEventHandlers');
    if (!existingHandler) {
      this.handlers.push(gameEventHandlers);
      this.logger.info('[EventManager] GameEventHandlers registered');
    } else {
      this.logger.warn('[EventManager] GameEventHandlers already registered, skipping');
    }
  }

  /**
   * Configura las contraseñas de admin desde la configuración del servidor
   */
  private async configureAdminPasswords(haxballRoom: any, chatManager: any): Promise<void> {
    try {
      // Buscar PlayerChatHandler en los handlers
      const chatHandler = this.handlers.find(h => h.constructor.name === 'PlayerChatHandler');
      
      if (chatHandler) {
        // Cargar contraseñas desde la base de datos
        await this.loadAdminPasswordsFromDB(haxballRoom, chatHandler);
      }
    } catch (error) {
      this.logger.error('[EventManager] Failed to configure admin passwords:', error);
    }
  }

  /**
   * Carga las contraseñas de admin desde la base de datos
   */
  private async loadAdminPasswordsFromDB(haxballRoom: any, chatHandler: any): Promise<void> {
    const ruid: string = haxballRoom.ruid;
    const serverImageId: string | undefined = haxballRoom.config?._meta?.serverImageId;

    const defaultPasswords = [
      { password: 'admin123', description: 'Admin por defecto', level: 'admin' },
      { password: 'super123', description: 'Super admin por defecto', level: 'superadmin' }
    ];

    const applyPasswords = (records: Array<{ password: string; description: string; level: string }>, source: string) => {
      const passwords = records.map((pwd) => ({
        password: pwd.password,
        description: pwd.description,
        level: pwd.level
      }));
      chatHandler.setAdminPasswords(passwords);
      this.logger.info(`[EventManager] Loaded ${passwords.length} admin passwords from database (${source})`);
    };

    try {
      const { db } = require('@mikuserverpro/database');

      if (serverImageId) {
        const byImageId = await db.adminPassword.findMany({
          where: { serverImageId, isActive: true }
        });
        if (byImageId.length > 0) {
          applyPasswords(byImageId, `serverImageId=${serverImageId}`);
          return;
        }
      }

      const serverImage = await db.serverImage.findFirst({
        where: { ruid },
        include: {
          adminPasswords: {
            where: { isActive: true }
          }
        }
      });

      if (serverImage?.adminPasswords?.length > 0) {
        applyPasswords(serverImage.adminPasswords, `ruid=${ruid}`);
        return;
      }

      chatHandler.setAdminPasswords(defaultPasswords);
      this.logger.info('[EventManager] Using default admin passwords (no DB config found)');
    } catch (error) {
      this.logger.error('[EventManager] Failed to load admin passwords from DB:', error);
      chatHandler.setAdminPasswords(defaultPasswords);
      this.logger.info('[EventManager] Using default admin passwords (DB error fallback)');
    }
  }
}