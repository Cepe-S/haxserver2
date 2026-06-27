import puppeteer from 'puppeteer';
import { existsSync } from 'fs';
import { join } from 'path';
import { appConfig } from '../shared/config/AppConfig';
import { createLogger } from '../shared/logger/Logger';
import { StadiumManager } from '../shared/stadiums/StadiumManager';
import { PlayerIdentityManager, HaxballPlayer } from '../shared/player/PlayerIdentityManager';
import { PlayerCacheManager } from '../shared/player/PlayerCacheManager';
import { EventManager } from '../shared/events/EventManager';
import { BalanceManager, BalanceMode, BalanceConfig } from '../shared/balance/BalanceManager';
import { PowershotManager, PowershotMode } from '../shared/powershot/PowershotManager';
import { ChatManager } from '../chat-manager/ChatManager';
import { MatchStatsManager } from '../shared/stats/MatchStatsManager';
import { GameEventHandlers } from '../shared/events/handlers/GameEventHandlers';
import { GameLoopController } from '../shared/gameloop/GameLoopController';
import { TrainingLoop } from '../shared/gameloop/TrainingLoop';
import { MatchLoop } from '../shared/gameloop/MatchLoop';
import { setupDebugReferences } from '../api/routes/debug';
import { db } from '@mikuserverpro/database';
import {
  resolveStadiumDefinitions,
  buildDefaultMapVoteConfig,
  StadiumSelector,
  MapVoteManager,
} from '../shared/stadiums';
import { MapVoteEventHandler } from '../shared/events/handlers/MapVoteEventHandler';

/**
 * Wrapper único para room de Haxball
 * Regla #18: Todos los eventos de Haxball deben pasar por el sistema centralizado
 */
const logger = createLogger('HAXBALL');

/** Chrome del sistema si Puppeteer no descargó el bundled (común en Windows). */
function resolveChromeExecutable(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  if (process.platform === 'win32') {
    const candidates = [
      join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe'),
      join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google\\Chrome\\Application\\chrome.exe'),
      join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    ];
    for (const p of candidates) {
      if (p && existsSync(p)) return p;
    }
  } else {
    const candidates = [
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium',
    ];
    for (const p of candidates) {
      if (existsSync(p)) return p;
    }
  }
  return undefined;
}

export class HaxballRoom {
  private browser: any | null = null;
  private page: any | null = null;
  private ruid: string;
  private playerIdentityManager: PlayerIdentityManager;
  private eventManager: EventManager;
  private balanceManager: BalanceManager;
  private powershotManager: PowershotManager;
  private chatManager: ChatManager;
  private matchStatsManager: MatchStatsManager;
  private gameEventHandlers: GameEventHandlers;
  private gameLoopController: GameLoopController | null = null;
  private mapVoteManager: MapVoteManager | null = null;
  private mapVoteEventHandler: MapVoteEventHandler | null = null;
  private config: any;

  constructor(ruid: string, config?: any) {
    this.config = config;
    this.ruid = ruid;
    this.playerIdentityManager = PlayerIdentityManager.getInstance();
    this.eventManager = EventManager.getInstance();
    
    // Initialize balance manager with config from server image
    const balanceConfig: BalanceConfig = {
      mode: config?.rules?.balanceMode === 'pro' ? BalanceMode.PRO : BalanceMode.JT,
      maxPlayersPerTeam: config?.settings?.balanceMaxPlayersPerTeam || 4,
      enabled: config?.settings?.balanceEnabled !== false
    };
    
    this.chatManager = new ChatManager(ruid);
    this.balanceManager = new BalanceManager(ruid, balanceConfig, this.chatManager);
    
    // Initialize powershot manager
    const powershotMode = config?.settings?.powershotMode || PowershotMode.CLASSIC;
    this.powershotManager = new PowershotManager(ruid, powershotMode);
    
    // Initialize match stats manager
    this.matchStatsManager = new MatchStatsManager(ruid);
    
    // Initialize game event handlers
    this.gameEventHandlers = new GameEventHandlers(ruid, this.chatManager, this);
  }

  /**
   * Inicializa el browser y crea la room
   */
  async initialize(): Promise<void> {
    try {
      // Configuración del browser basada en el sistema viejo
      const browserArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ];
      
      if (!appConfig.haxball.webrtcAnonym) {
        browserArgs.push('--disable-features=WebRtcHideLocalIpsWithMdns');
      }

      const launchOptions: Parameters<typeof puppeteer.launch>[0] = {
        headless: appConfig.haxball.headless,
        args: browserArgs,
      };

      const chromePath = resolveChromeExecutable();
      if (chromePath) {
        launchOptions.executablePath = chromePath;
        logger.debug('Using Chrome executable', { path: chromePath, ruid: this.ruid });
      }

      this.browser = await puppeteer.launch(launchOptions);

      this.page = await this.browser.newPage();

      // Setup console logging
      this.page.on('console', (msg) => {
        const text = msg.text();
        if (text.includes('[BROWSER]') && text.includes('ERROR')) {
          logger.error('Browser error', { message: text, ruid: this.ruid });
        }
      });

      this.page.on('pageerror', (error) => {
        logger.error('Browser page error', error, { ruid: this.ruid });
      });

      // Navigate to Haxball
      await this.page.goto('https://www.haxball.com/headless', {
        waitUntil: 'networkidle2'
      });

      // Wait for HBInit to be available
      await this.page.waitForFunction(() => typeof (window as any).HBInit === 'function', {
        timeout: 30000
      });

      // Connect managers to this room (except ChatManager, needs page ready)
      const playerCache = PlayerCacheManager.getInstance();
      playerCache.setRuid(this.ruid);
      playerCache.setHaxballRoom(this);
      this.balanceManager.setHaxballRoom(this);
      this.powershotManager.setHaxballRoom(this);
      
      // Connect GameEventHandlers with MatchStatsManager (instancia única)
      this.gameEventHandlers.setMatchStatsManager(this.matchStatsManager);
      
      // Balance manager se conecta directamente a eventos
      
      // Configurar eventos del balance manager
      this.setupBalanceEvents();
      
      logger.haxball('Room initialized', this.ruid);
    } catch (error) {
      logger.fail('Haxball room initialization', error, { ruid: this.ruid });
      throw error;
    }
  }

  /**
   * Inicializa el sistema de Game Loops (Training y Match)
   */
  private initializeGameLoops(): void {
    logger.info('🎮 Initializing Game Loop System', { ruid: this.ruid });
    
    const minPlayers = this.config?.rules?.requisite?.minimumPlayers || 4;
    
    // Config para TrainingLoop
    const trainingConfig = {
      ruid: this.ruid,
      minPlayers: minPlayers,
      stadiumName: this.config?.rules?.readyMapName || 'training',
      timeLimit: 0,
      scoreLimit: 0,
      teamLock: false
    };
    
    // Config para MatchLoop con fallbacks mejorados
    const matchConfig = {
      ruid: this.ruid,
      minPlayers: minPlayers,
      stadiumName: this.config?.rules?.defaultMapName || 'futx4',
      timeLimit: this.config?.rules?.requisite?.timeLimit || 10,
      scoreLimit: this.config?.rules?.requisite?.scoreLimit || 5,
      teamLock: this.config?.rules?.requisite?.teamLock ?? true
    };
    
    // Log de configuración para debugging
    logger.info('Game Loop configuration', {
      ruid: this.ruid,
      minPlayers,
      trainingConfig,
      matchConfig,
      originalConfig: {
        timeLimit: this.config?.rules?.requisite?.timeLimit,
        scoreLimit: this.config?.rules?.requisite?.scoreLimit,
        teamLock: this.config?.rules?.requisite?.teamLock
      }
    });
    
    // Crear TrainingLoop
    const trainingLoop = new TrainingLoop(trainingConfig);
    trainingLoop.setHaxballRoom(this);
    
    // Crear MatchLoop
    const matchLoop = new MatchLoop(matchConfig, this.chatManager);
    matchLoop.setHaxballRoom(this);
    matchLoop.setMatchStatsManager(this.matchStatsManager);

    const mapVoteConfig = this.config?.rules?.mapVote ?? buildDefaultMapVoteConfig();
    const stadiumDefs = resolveStadiumDefinitions(mapVoteConfig);
    const stadiumSelector = new StadiumSelector(stadiumDefs);
    matchLoop.setStadiumSelector(stadiumSelector);

    this.mapVoteManager = new MapVoteManager(
      stadiumSelector,
      this.chatManager,
      mapVoteConfig,
      () => this.gameLoopController?.getActiveLoopName() ?? null,
      () => matchLoop.getCurrentStadiumName()
    );
    matchLoop.setMapVoteManager(this.mapVoteManager);

    this.mapVoteEventHandler = new MapVoteEventHandler();
    this.mapVoteEventHandler.setMapVoteManager(this.mapVoteManager);
    this.mapVoteEventHandler.start();

    this.eventManager.registerMapVoteCommand(() => this.mapVoteManager);
    
    // Crear GameLoopController
    this.gameLoopController = new GameLoopController(minPlayers);
    
    // Registrar loops
    this.gameLoopController.registerLoop('training', trainingLoop);
    this.gameLoopController.registerLoop('match', matchLoop);
    
    // Inicializar en modo training
    this.gameLoopController.initialize('training').then(() => {
      logger.success('Game Loop System initialized in training mode', { ruid: this.ruid });
    }).catch((error) => {
      logger.error('Failed to initialize Game Loop System', error);
    });
  }

  /**
   * Crea la room con configuración básica
   */
  async createRoom(config: any): Promise<string> {
    if (!this.page) {
      throw new Error('Room not initialized');
    }

    if (!config._config?.token) {
      throw new Error('Haxball token is required');
    }

    // Preparar datos de estadios para el browser
    const stadiumCache = {
      'training': StadiumManager.loadStadiumData('training'),
      'futx2': StadiumManager.loadStadiumData('futx2'),
      'futx3': StadiumManager.loadStadiumData('futx3'),
      'futx4': StadiumManager.loadStadiumData('futx4'),
      'futx5': StadiumManager.loadStadiumData('futx5'),
      'futx7': StadiumManager.loadStadiumData('futx7')
    };
    
    config.stadiumCache = stadiumCache;
    
    // Log geolocation configuration from user interface
    if (config._config?.geo) {
      logger.system('Geolocation configuration from user interface', {
        code: config._config.geo.code,
        lat: config._config.geo.lat,
        lon: config._config.geo.lon,
        ruid: this.ruid
      });
    }
    
    // Configure powershot with ball properties from config
    if (config?.settings) {
      this.powershotManager.setOriginalBallProperties(config.settings);
    }
    
    // Crear room con token y configurar listener como en el sistema viejo
    await this.page.evaluate((roomConfig: any) => {
      try {
        if (!roomConfig._config.token) {
          throw new Error('Token is required');
        }
        
        if (!roomConfig._config.token.startsWith('thr1.')) {
          throw new Error('Invalid token format - must start with thr1.');
        }
        
        const roomOptions = {
          roomName: roomConfig._config.roomName || 'MikuServerPro',
          maxPlayers: roomConfig._config.maxPlayers || 20,
          public: roomConfig._config.public !== false,
          password: roomConfig._config.password || null,
          token: roomConfig._config.token,
          noPlayer: roomConfig._config.noPlayer !== false,
          geo: roomConfig._config.geo || null
        };
        
        console.log('Creating Haxball room with config:', {
          roomName: roomOptions.roomName,
          maxPlayers: roomOptions.maxPlayers,
          public: roomOptions.public,
          hasToken: !!roomOptions.token,
          tokenLength: roomOptions.token ? roomOptions.token.length : 0,
          geoOverride: roomOptions.geo ? `${roomOptions.geo.code} (${roomOptions.geo.lat}, ${roomOptions.geo.lon})` : 'none'
        });
        
        if (roomOptions.geo) {
          console.log('✅ [BROWSER] Geolocation will be applied:', roomOptions.geo);
        } else {
          console.log('❌ [BROWSER] No geolocation configuration found');
        }
        
        console.log('🚀 [BROWSER] Calling HBInit with options:', roomOptions);
        const room = (window as any).HBInit(roomOptions);
        console.log('📋 [BROWSER] HBInit result:', {
          hasRoom: !!room,
          roomType: typeof room,
          roomKeys: room ? Object.keys(room) : 'N/A'
        });
        
        if (!room) {
          throw new Error('HBInit returned null/undefined');
        }
        
        console.log('✅ [BROWSER] Room created successfully, configuring listeners...');
        
        // Configurar gameRoom ANTES de configurar el listener
        (window as any).gameRoom = {
          _room: room,
          link: '', // Inicialmente vacío
          config: roomConfig,
          pendingStadium: null // Para cargar mapa después
        };
        
        // Los eventos de Haxball serán manejados por el EventManager
        // Mantener colas temporales solo para compatibilidad con BD
        (window as any).playerJoinQueue = [];
        (window as any).playerLeaveQueue = [];
        
        // Configurar el listener onRoomLink EXACTAMENTE como en el sistema viejo
        room.onRoomLink = function(url) {
          console.log('🎉 [BROWSER] onRoomLink EVENT FIRED with URL:', url);
          console.log('🔗 [BROWSER] Room link obtained, starting stadium loading process...');
          (window as any).gameRoom.link = url; // Asignar a gameRoom.link como en el sistema viejo
          
          // Cargar mapa de TRAINING INMEDIATAMENTE después de obtener el link
          const trainingMap = roomConfig.rules?.readyMapName || 'training';
          console.log('🗺️ Loading training stadium:', trainingMap);
          
          // Inyectar datos de estadios en el cache del browser
          (window as any).stadiumDataCache = roomConfig.stadiumCache || {};
          
          // Cargar estadios directamente usando datos embebidos
          (window as any).loadStadiumData = function(mapName: string) {
            console.log('🗺️ [BROWSER] loadStadiumData called for:', mapName);
            
            // Usar datos embebidos directamente (sin XHR)
            const stadiumData = (window as any).stadiumDataCache[mapName];
            
            if (!stadiumData) {
              console.error('❌ [BROWSER] No stadium data found for:', mapName);
              return null;
            }
            
            console.log('✅ [BROWSER] Stadium loaded from cache, length:', stadiumData.length);
            return stadiumData;
          };
          
          console.log('🔄 [BROWSER] Attempting to load training stadium:', trainingMap);
          try {
            console.log('🔍 [BROWSER] Calling loadStadiumData function...');
            const stadiumData = (window as any).loadStadiumData(trainingMap);
            console.log('📊 [BROWSER] loadStadiumData result:', {
              hasData: !!stadiumData,
              dataLength: stadiumData?.length || 0,
              dataType: typeof stadiumData
            });
            
            if (stadiumData) {
              console.log('🏟️ [BROWSER] Setting custom stadium...');
              room.setCustomStadium(stadiumData);
              console.log('✅ [BROWSER] Training stadium loaded successfully:', trainingMap);
              
              // Emitir evento de cambio de estadio
              if ((window as any).emitHaxballEvent) {
                (window as any).emitHaxballEvent('STADIUM_CHANGE', {
                  newStadiumName: trainingMap,
                  byPlayer: undefined,
                  timestamp: Date.now()
                });
              }
              
              // Configurar propiedades de la pelota según configuración
              setTimeout(() => {
                try {
                  const ballConfig = roomConfig.settings;
                  if (ballConfig) {
                    const ballProps = {
                      radius: ballConfig.ballRadius || 6.4,
                      color: parseInt(ballConfig.ballColor || 'FFFFFF', 16),
                      bCoeff: ballConfig.ballBCoeff || 0.4,
                      invMass: ballConfig.ballInvMass || 1.5,
                      damping: ballConfig.ballDamping || 0.99
                    };
                    
                    room.setDiscProperties(0, ballProps);
                    console.log('⚽ [BROWSER] Ball properties configured:', ballProps);
                  }
                } catch (ballError) {
                  console.error('❌ [BROWSER] Error configuring ball properties:', ballError);
                }
              }, 500);
              
              // INICIAR JUEGO AUTOMÁTICAMENTE después de cargar training map
              setTimeout(() => {
                try {
                  room.startGame();
                  console.log('🎮 [BROWSER] Training game started automatically');
                  (window as any).gameRoom.trainingReady = true;
                } catch (startError) {
                  console.error('❌ [BROWSER] Error starting training game:', startError);
                  (window as any).gameRoom.trainingReady = true;
                }
              }, 1000);
            } else {
              console.error('❌ [BROWSER] Failed to load training stadium - no data returned');
            }
          } catch (error) {
            console.error('❌ [BROWSER] Error loading training stadium:', error);
          };
          
          console.log('🏋️ Training mode initialized with auto-start');
        };
        

        
        console.log('✅ [BROWSER] Room created and onRoomLink listener configured');
        console.log('⏳ [BROWSER] Waiting for onRoomLink event to fire...');
        
      } catch (error) {
        console.error('HBInit error details:', {
          message: error.message,
          name: error.name
        });
        throw error;
      }
    }, config);
    

    
    try {
      // Usar waitForFunction como en el sistema viejo
      await this.page.waitForFunction(() => {
        return (window as any).gameRoom && (window as any).gameRoom.link && (window as any).gameRoom.link.length > 0;
      }, {
        timeout: 30000 // 30 segundos como en el sistema viejo
      });
      
      // Obtener el link después de que el evento se dispare
      const finalLink = await this.page.evaluate(() => {
        return (window as any).gameRoom.link;
      });
      
      logger.haxball('room created', this.ruid, { link: finalLink });

      // Esperar a que el browser cargue training + startGame antes de loops/eventos
      try {
        await this.page.waitForFunction(
          () => (window as any).gameRoom?.trainingReady === true,
          { timeout: 15000 }
        );
        logger.info('Training stadium ready in browser', { ruid: this.ruid });
      } catch {
        logger.warn('Training ready signal timeout — continuing with game loop init', { ruid: this.ruid });
      }
      
      // AHORA configurar ChatManager con página lista
      this.chatManager.setHaxballRoom(this);
      
      // Inicializar sistema de eventos DESPUÉS de que ChatManager esté listo
      this.eventManager.initialize(this.chatManager, this.ruid);
      
      // Configurar eventos de Haxball a través del EventManager
      await this.setupHaxballEvents();
      
      // Iniciar procesamiento de eventos de jugadores después de obtener el link
      this.startPlayerEventProcessing();
      
      // Game Loop System solo cuando la sala está operativa en browser
      this.initializeGameLoops();
      
      // Setup debug API references
      setupDebugReferences(this.gameLoopController!, this.balanceManager, this);
      
      return finalLink;
      
    } catch (error) {
      throw new Error('Room link never appeared after 30 seconds. This usually means: 1) Invalid token, 2) Rate limiting, or 3) Token already in use.');
    }
  }

  /**
   * Cierra la room con cleanup completo
   */
  async close(): Promise<void> {
    logger.system('Starting room cleanup', { ruid: this.ruid });
    
    try {
      // 1. Detener game loops antes que otros subsistemas
      if (this.gameLoopController) {
        await this.gameLoopController.cleanup();
        this.gameLoopController = null;
        logger.debug('GameLoopController cleaned up');
      }

      if (this.mapVoteEventHandler) {
        this.mapVoteEventHandler.stop();
        this.mapVoteEventHandler = null;
      }
      this.mapVoteManager = null;

      // 2. Cleanup managers in proper order
      if (this.gameEventHandlers) {
        // GameEventHandlers cleanup (if needed)
        logger.debug('GameEventHandlers cleaned up');
      }
      
      if (this.matchStatsManager) {
        this.matchStatsManager.clearCache();
        logger.debug('MatchStatsManager cleaned up');
      }
      
      if (this.balanceManager) {
        this.balanceManager.cleanup();
        logger.debug('BalanceManager cleaned up');
      }
      
      if (this.powershotManager) {
        this.powershotManager.cleanup();
        logger.debug('PowershotManager cleaned up');
      }
      
      if (this.chatManager) {
        this.chatManager.destroy();
        logger.debug('ChatManager cleaned up');
      }
      
      // 3. Cleanup event system (reset singleton para próxima sala)
      EventManager.resetInstance();
      logger.debug('EventManager reset');
      
      // 4. Close browser resources
      if (this.page) {
        try {
          await this.page.close();
          logger.debug('Browser page closed');
        } catch (error) {
          logger.debug('Page already closed or error closing', { error: error.message });
        }
        this.page = null;
      }
      
      if (this.browser) {
        try {
          await this.browser.close();
          logger.debug('Browser closed');
        } catch (error) {
          logger.debug('Browser already closed or error closing', { error: error.message });
        }
        this.browser = null;
      }
      
      logger.haxball('room closed', this.ruid);
      
    } catch (error) {
      logger.error('Error during room cleanup', error, { ruid: this.ruid });
      // Continue cleanup even if there are errors
    }
  }

  /**
   * Procesa eventos de jugadores desde el browser (solo para BD)
   */
  async processPlayerEvents(): Promise<void> {
    if (!this.page) return;

    try {
      // Procesar jugadores que se unieron (solo para BD)
      const joinedPlayers = await this.page.evaluate(() => {
        const queue = (window as any).playerJoinQueue || [];
        (window as any).playerJoinQueue = [];
        return queue;
      });

      // Player identification is handled by PlayerJoinHandler through events
      // No need to process here to avoid duplicates

      // Procesar jugadores que se fueron (solo para BD)
      const leftPlayers = await this.page.evaluate(() => {
        const queue = (window as any).playerLeaveQueue || [];
        (window as any).playerLeaveQueue = [];
        return queue;
      });

      for (const player of leftPlayers) {
        try {
          await db.connection.updateMany({
            where: { ruid: this.ruid, haxballId: player.id, leftAt: null },
            data: { leftAt: new Date() }
          });

        } catch (error) {
          logger.error('Failed to update player leave time', { error, player: player.name });
        }
      }
    } catch (error) {
      logger.error('Error processing player events', { error, ruid: this.ruid });
    }
  }

  /**
   * Configura los eventos de Haxball a través del EventManager
   */
  private async setupHaxballEvents(): Promise<void> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    try {
      // Configurar eventos de Haxball en el contexto del browser
      await this.page.evaluate(() => {
        if (!(window as any).gameRoom?._room) {
          throw new Error('Haxball room not found');
        }

        const room = (window as any).gameRoom._room;
        
        // ADAPTADOR PURO - Solo convertir eventos nativos
        room.onPlayerJoin = function(player) {
          if ((window as any).emitHaxballEvent) {
            (window as any).emitHaxballEvent('PLAYER_JOIN', {
              player: {
                id: player.id,
                name: player.name,
                auth: player.auth,
                conn: player.conn,
                admin: player.admin,
                team: player.team
              },
              timestamp: Date.now()
            });
          }
        };
        
        room.onPlayerLeave = function(player) {
          // Solo para BD
          (window as any).playerLeaveQueue = (window as any).playerLeaveQueue || [];
          (window as any).playerLeaveQueue.push({
            id: player.id,
            name: player.name,
            auth: player.auth,
            conn: player.conn,
            admin: player.admin,
            team: player.team
          });
          
          if ((window as any).emitHaxballEvent) {
            (window as any).emitHaxballEvent('PLAYER_LEAVE', {
              player: {
                id: player.id,
                name: player.name,
                auth: player.auth,
                conn: player.conn,
                admin: player.admin,
                team: player.team
              },
              timestamp: Date.now()
            });
          }
        };
        
        room.onGameStart = function(byPlayer) {
          if ((window as any).emitHaxballEvent) {
            (window as any).emitHaxballEvent('GAME_START', {
              byPlayer: byPlayer ? {
                id: byPlayer.id,
                name: byPlayer.name,
                auth: byPlayer.auth,
                conn: byPlayer.conn,
                admin: byPlayer.admin,
                team: byPlayer.team
              } : undefined,
              timestamp: Date.now()
            });
          }
        };
        
        room.onGameStop = function(byPlayer) {
          if ((window as any).emitHaxballEvent) {
            (window as any).emitHaxballEvent('GAME_STOP', {
              byPlayer: byPlayer ? {
                id: byPlayer.id,
                name: byPlayer.name,
                auth: byPlayer.auth,
                conn: byPlayer.conn,
                admin: byPlayer.admin,
                team: byPlayer.team
              } : undefined,
              timestamp: Date.now()
            });
          }
        };
        
        room.onTeamVictory = function(scores) {
          if ((window as any).emitHaxballEvent) {
            (window as any).emitHaxballEvent('TEAM_VICTORY', {
              scores: {
                red: scores.red,
                blue: scores.blue,
                time: scores.time,
                scoreLimit: scores.scoreLimit,
                timeLimit: scores.timeLimit
              },
              timestamp: Date.now()
            });
          }
        };
        
        room.onTeamGoal = function(team) {
          const scores = room.getScores();
          if ((window as any).emitHaxballEvent) {
            (window as any).emitHaxballEvent('TEAM_GOAL', {
              team,
              scores: scores ? {
                red: scores.red,
                blue: scores.blue,
                time: scores.time,
                scoreLimit: scores.scoreLimit,
                timeLimit: scores.timeLimit
              } : { red: 0, blue: 0, time: 0, scoreLimit: 0, timeLimit: 0 },
              timestamp: Date.now()
            });
          }
        };
        
        room.onPlayerBallKick = function(player) {
          if ((window as any).emitHaxballEvent) {
            (window as any).emitHaxballEvent('PLAYER_BALL_KICK', {
              player: {
                id: player.id,
                name: player.name,
                auth: player.auth,
                conn: player.conn,
                admin: player.admin,
                team: player.team
              },
              timestamp: Date.now()
            });
          }
        };
        
        room.onGameTick = function() {
          if ((window as any).emitHaxballEvent) {
            (window as any).emitHaxballEvent('GAME_TICK', {
              timestamp: Date.now()
            });
          }
        };
        
        room.onPlayerChat = function(player, message) {
          if ((window as any).emitHaxballEvent) {
            (window as any).emitHaxballEvent('PLAYER_CHAT', {
              player: {
                id: player.id,
                name: player.name,
                auth: player.auth,
                conn: player.conn,
                admin: player.admin,
                team: player.team
              },
              message,
              timestamp: Date.now()
            });
          }
          return false; // Bloquear mensaje original
        };
        
        room.onPlayerTeamChange = function(changedPlayer, byPlayer) {
          if ((window as any).emitHaxballEvent) {
            (window as any).emitHaxballEvent('PLAYER_TEAM_CHANGE', {
              player: {
                id: changedPlayer.id,
                name: changedPlayer.name,
                auth: changedPlayer.auth,
                conn: changedPlayer.conn,
                admin: changedPlayer.admin,
                team: changedPlayer.team
              },
              byPlayer: byPlayer ? {
                id: byPlayer.id,
                name: byPlayer.name,
                auth: byPlayer.auth,
                conn: byPlayer.conn,
                admin: byPlayer.admin,
                team: byPlayer.team
              } : undefined,
              newTeam: changedPlayer.team,
              timestamp: Date.now()
            });
          }
        };
        

      });

      // Configurar función para emitir eventos desde el browser
      await this.page.exposeFunction('emitHaxballEvent', (eventName: string, eventData: any) => {
        // Convertir nombres de eventos del browser al formato esperado por handlers
        const eventNameMap = {
          'PLAYER_JOIN': 'haxball.player.join',
          'PLAYER_LEAVE': 'haxball.player.leave', 
          'PLAYER_CHAT': 'haxball.player.chat',
          'GAME_START': 'haxball.game.start',
          'GAME_STOP': 'haxball.game.stop',
          'TEAM_GOAL': 'haxball.team.goal',
          'TEAM_VICTORY': 'haxball.team.victory',
          'PLAYER_BALL_KICK': 'haxball.player.ballKick',
          'PLAYER_TEAM_CHANGE': 'haxball.player.teamChange',
          'GAME_TICK': 'haxball.game.tick',
          'STADIUM_CHANGE': 'haxball.stadium.change'
        };
        
        const mappedEventName = eventNameMap[eventName] || `haxball.${eventName.toLowerCase()}`;
        this.eventManager.emitCustomEvent(mappedEventName, eventData);
      });
      
      // Registrar GameEventHandlers en EventManager (evita duplicación)
      this.eventManager.registerGameEventHandlers(this.gameEventHandlers);
      
      // Configurar el EventManager para procesar eventos
      this.eventManager.setupHaxballEvents(this, this.chatManager);
      
      // Conectar PlayerJoinHandler con MatchStatsManager
      this.connectPlayerJoinHandler();
      
      logger.system('Haxball event adapters configured', { ruid: this.ruid });
      
    } catch (error) {
      logger.error('Failed to setup Haxball events', { error, ruid: this.ruid });
      throw error;
    }
  }

  /**
   * Inicia el procesamiento periódico de eventos de jugadores
   */
  startPlayerEventProcessing(): void {
    // Procesar eventos cada 2 segundos (solo para BD, no balance)
    setInterval(() => {
      this.processPlayerEvents();
      // NO procesar balance events - causan eventos fantasma
    }, 2000);
    
    logger.system('Player event processing started', { ruid: this.ruid });
  }

  // Método eliminado - causaba eventos fantasma del BalanceManager

  /**
   * Obtiene información básica de la room
   */
  async getRoomInfo(): Promise<any> {
    if (!this.page) {
      throw new Error('Room not initialized');
    }

    return await this.page.evaluate(() => {
      if ((window as any).gameRoom) {
        return {
          roomName: (window as any).gameRoom.config._config.roomName,
          onlinePlayers: (window as any).gameRoom.playerList?.size || 0
        };
      }
      return null;
    });
  }

  /**
   * Obtiene estadísticas del sistema de eventos
   */
  getEventStats(): any {
    return this.eventManager.getEventStats();
  }

  /**
   * Obtiene el balance manager
   */
  getBalanceManager(): BalanceManager {
    return this.balanceManager;
  }

  /**
   * Obtiene el powershot manager
   */
  getPowershotManager(): PowershotManager {
    return this.powershotManager;
  }

  /**
   * Obtiene el game loop controller
   */
  getGameLoopController(): GameLoopController | null {
    return this.gameLoopController;
  }

  getMapVoteManager(): MapVoteManager | null {
    return this.mapVoteManager;
  }

  getMatchStatsManager(): MatchStatsManager {
    return this.matchStatsManager;
  }

  /**
   * Obtiene datos de debug del balance
   */
  getBalanceDebugData(): any {
    return this.balanceManager.getDebugData();
  }

  /**
   * Obtiene el estado del balance
   */
  getBalanceStatus(): any {
    return this.balanceManager.getStatus();
  }

  /**
   * Fuerza un rebalanceo
   */
  async triggerBalance(): Promise<void> {
    await this.balanceManager.forceBalance();
  }

  /**
   * Obtiene la lista de jugadores actuales
   */
  async getCurrentPlayers(): Promise<HaxballPlayer[]> {
    if (!this.page) {
      throw new Error('Room not initialized');
    }

    return await this.page.evaluate(() => {
      if ((window as any).gameRoom && (window as any).gameRoom._room) {
        const playerList = (window as any).gameRoom._room.getPlayerList();
        return playerList.map((p: any) => ({
          id: p.id,
          name: p.name,
          auth: p.auth,
          conn: p.conn,
          admin: p.admin,
          team: p.team
        }));
      }
      return [];
    });
  }

  /**
   * Mueve un jugador a un equipo específico
   */
  async setPlayerTeam(playerId: number, team: number): Promise<void> {
    if (!this.page) {
      throw new Error('Room not initialized');
    }

    try {
      logger.debug('🔄 Attempting to move player to team', { playerId, team, ruid: this.ruid });
      
      const result = await this.page.evaluate((pId: number, t: number) => {
        console.log('🔄 [BROWSER] setPlayerTeam called', { playerId: pId, team: t });
        
        if ((window as any).gameRoom?._room) {
          const room = (window as any).gameRoom._room;
          
          // Verificar que el jugador existe
          const player = room.getPlayerList().find((p: any) => p.id === pId);
          if (!player) {
            console.error('❌ [BROWSER] Player not found', { playerId: pId });
            return { success: false, error: 'Player not found' };
          }
          
          console.log('✅ [BROWSER] Player found, moving to team', { 
            playerId: pId, 
            playerName: player.name,
            currentTeam: player.team,
            targetTeam: t 
          });
          
          room.setPlayerTeam(pId, t);
          
          console.log('✅ [BROWSER] setPlayerTeam executed successfully');
          return { success: true };
        } else {
          console.error('❌ [BROWSER] gameRoom._room not available');
          return { success: false, error: 'Room not available' };
        }
      }, playerId, team);
      
      if (result.success) {
        logger.debug('✅ Player moved successfully', { playerId, team, ruid: this.ruid });
      } else {
        logger.error('❌ Failed to move player', { playerId, team, error: result.error, ruid: this.ruid });
        throw new Error(result.error || 'Unknown error moving player');
      }

    } catch (error) {
      logger.error('Failed to move player to team', { error, playerId, team, ruid: this.ruid });
      throw error;
    }
  }

  /**
   * Cambia el estadio
   */
  async setStadium(stadiumName: string): Promise<void> {
    if (!this.page) {
      throw new Error('Room not initialized');
    }

    try {
      await this.page.evaluate((mapName: string) => {
        console.log('🏟️ [BROWSER] setStadium evaluate called for:', mapName);
        if ((window as any).gameRoom?._room && (window as any).loadStadiumData) {
          console.log('🔍 [BROWSER] Room and loadStadiumData available, loading stadium...');
          const stadiumData = (window as any).loadStadiumData(mapName);
          if (stadiumData) {
            console.log('🏟️ [BROWSER] Setting custom stadium with data length:', stadiumData.length);
            (window as any).gameRoom._room.setCustomStadium(stadiumData);
            console.log('✅ [BROWSER] Stadium changed to:', mapName);
          } else {
            console.error('❌ [BROWSER] No stadium data returned for:', mapName);
          }
        } else {
          console.error('❌ [BROWSER] Room or loadStadiumData not available');
        }
      }, stadiumName);
      
      logger.system('Stadium changed', { stadiumName, ruid: this.ruid });
    } catch (error) {
      logger.error('Failed to change stadium', { error, stadiumName, ruid: this.ruid });
      throw error;
    }
  }

  /**
   * Inicia el juego
   */
  async startGame(): Promise<void> {
    if (!this.page) {
      throw new Error('Room not initialized');
    }

    try {
      const result = await this.page.evaluate(() => {
        console.log('🎮 [BROWSER] Attempting to start game...');
        
        if (!(window as any).gameRoom?._room) {
          console.error('❌ [BROWSER] Room not available for startGame');
          return { success: false, error: 'Room not available' };
        }
        
        try {
          const room = (window as any).gameRoom._room;
          
          // Verificar estado antes de iniciar
          const currentScores = room.getScores();
          console.log('📊 [BROWSER] Current game state before start:', {
            gameRunning: currentScores !== null,
            scores: currentScores
          });
          
          // Intentar iniciar
          room.startGame();
          console.log('✅ [BROWSER] startGame() called successfully');
          
          // Verificar que inició
          setTimeout(() => {
            const newScores = room.getScores();
            console.log('📊 [BROWSER] Game state after start:', {
              gameRunning: newScores !== null,
              scores: newScores
            });
          }, 500);
          
          return { success: true };
          
        } catch (error) {
          console.error('❌ [BROWSER] startGame() failed:', error);
          return { success: false, error: error.message };
        }
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error starting game');
      }
      
      logger.haxball('game started', this.ruid);
      
    } catch (error) {
      logger.error('Failed to start game', { error, ruid: this.ruid });
      throw error;
    }
  }

  /**
   * Para el juego
   */
  async stopGame(): Promise<void> {
    if (!this.page) {
      throw new Error('Room not initialized');
    }

    try {
      await this.page.evaluate(() => {
        if ((window as any).gameRoom?._room) {
          (window as any).gameRoom._room.stopGame();
          console.log('🛑 Game stopped');
        }
      });
      
      logger.haxball('game stopped', this.ruid);
    } catch (error) {
      logger.error('Failed to stop game', { error, ruid: this.ruid });
      throw error;
    }
  }

  /**
   * Obtiene el estado del juego
   */
  async getGameState(): Promise<any> {
    if (!this.page) {
      throw new Error('Room not initialized');
    }

    return await this.page.evaluate(() => {
      if ((window as any).gameRoom?._room) {
        const room = (window as any).gameRoom._room;
        const scores = room.getScores();
        const playerList = room.getPlayerList();
        
        console.log('📊 [BROWSER] Game state check:', {
          gameRunning: scores !== null,
          scores: scores,
          playerCount: playerList ? playerList.length : 0
        });
        
        return {
          gameRunning: scores !== null,
          scores: scores || { red: 0, blue: 0, time: 0 },
          playerCount: playerList ? playerList.length : 0
        };
      }
      
      console.log('❌ [BROWSER] Room not available for game state check');
      return { gameRunning: false, scores: { red: 0, blue: 0, time: 0 }, playerCount: 0 };
    });
  }

  /**
   * Envía un mensaje usando la API de Haxball
   */
  async sendMessage(playerId: number | null, message: string, color?: number, style?: string, sound?: number): Promise<void> {
    if (!this.page) {
      throw new Error('Room not initialized');
    }

    try {
      await this.page.evaluate((pId: number | null, msg: string, c: number, s: string, snd: number) => {
        if ((window as any).gameRoom?._room) {
          console.log(`[BROWSER] Sending message to ${pId || 'all'}: ${msg}`);
          (window as any).gameRoom._room.sendAnnouncement(msg, pId, c, s, snd);
        } else {
          console.error('[BROWSER] Room not available for sending message');
        }
      }, playerId, message, color || 0x00AAFF, style || 'normal', sound || 0);
      

    } catch (error) {
      logger.error('Failed to send message', { error, playerId, message });
      throw error;
    }
  }

  /**
   * Obtiene el chat manager
   */
  getChatManager(): ChatManager {
    return this.chatManager;
  }

  /**
   * Obtiene la posición de la pelota
   */
  async getBallPosition(): Promise<any> {
    if (!this.page) {
      throw new Error('Room not initialized');
    }

    return await this.page.evaluate(() => {
      if ((window as any).gameRoom?._room) {
        return (window as any).gameRoom._room.getBallPosition();
      }
      return null;
    });
  }

  /**
   * Obtiene información de un jugador específico
   */
  async getPlayer(playerId: number): Promise<any> {
    if (!this.page) {
      throw new Error('Room not initialized');
    }

    return await this.page.evaluate((id: number) => {
      if ((window as any).gameRoom?._room) {
        return (window as any).gameRoom._room.getPlayer(id);
      }
      return null;
    }, playerId);
  }

  /**
   * Kickea a un jugador
   */
  async kickPlayer(playerId: number, reason: string, ban: boolean = false): Promise<void> {
    if (!this.page) {
      throw new Error('Room not initialized');
    }

    try {
      await this.page.evaluate((id: number, kickReason: string, banPlayer: boolean) => {
        if ((window as any).gameRoom?._room) {
          (window as any).gameRoom._room.kickPlayer(id, kickReason, banPlayer);
          console.log(`[BROWSER] Player ${id} kicked: ${kickReason}`);
        }
      }, playerId, reason, ban);
      
      logger.system('Player kicked', { playerId, reason, ban, ruid: this.ruid });
    } catch (error) {
      logger.error('Failed to kick player', { error, playerId, reason, ruid: this.ruid });
      throw error;
    }
  }

  /**
   * Establece propiedades de un disco (pelota o jugador)
   */
  async setDiscProperties(discIndex: number, properties: any): Promise<void> {
    if (!this.page) {
      throw new Error('Room not initialized');
    }

    try {
      await this.page.evaluate((index: number, props: any) => {
        if ((window as any).gameRoom?._room) {
          (window as any).gameRoom._room.setDiscProperties(index, props);
        }
      }, discIndex, properties);
    } catch (error) {
      logger.error('Failed to set disc properties', error, { discIndex });
      throw error;
    }
  }

  /**
   * Establece los colores de un equipo
   */
  async setTeamColors(team: number, angle: number, textColor: number, colors: number[]): Promise<void> {
    if (!this.page) {
      throw new Error('Room not initialized');
    }

    try {
      await this.page.evaluate((t: number, a: number, tc: number, c: number[]) => {
        if ((window as any).gameRoom?._room) {
          (window as any).gameRoom._room.setTeamColors(t, a, tc, c);
          console.log(`[BROWSER] Team ${t} colors set:`, { angle: a, textColor: tc, colors: c });
        }
      }, team, angle, textColor, colors);
      

    } catch (error) {
      logger.error('Failed to set team colors', { error, team, angle, textColor, colors, ruid: this.ruid });
      throw error;
    }
  }

  /**
   * Expone la página para uso del BalanceManager
   */
  get browserPage() {
    return this.page;
  }

  /**
   * Configura eventos específicos para el balance manager
   */
  private setupBalanceEvents(): void {
    // Escuchar eventos de jugadores para el balance
    this.eventManager.onCustomEvent('player.balance.update', (data) => {
      // El balance manager ya está configurado para escuchar eventos del EventBus
    });
    
    logger.system('Balance events configured', { ruid: this.ruid });
  }
  
  /**
   * Conecta PlayerJoinHandler con MatchStatsManager
   */
  private connectPlayerJoinHandler(): void {
    // Buscar PlayerJoinHandler en EventManager y conectar MatchStatsManager
    const eventManager = this.eventManager as any;
    if (eventManager.handlers) {
      const joinHandler = eventManager.handlers.find((h: any) => h.constructor.name === 'PlayerJoinHandler');
      if (joinHandler && joinHandler.setMatchStatsManager) {
        joinHandler.setMatchStatsManager(this.matchStatsManager);
        logger.system('PlayerJoinHandler connected with MatchStatsManager', { ruid: this.ruid });
      } else {
        logger.warn('PlayerJoinHandler not found or missing setMatchStatsManager method');
      }
    } else {
      logger.warn('EventManager handlers not available');
    }
  }
}