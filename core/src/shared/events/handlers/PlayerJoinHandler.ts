import { eventBus } from '../EventBus';
import { HAXBALL_EVENTS, HaxballPlayerJoinEvent } from '../HaxballEvents';
import { PlayerIdentityManager } from '../../player/PlayerIdentityManager';
import { SanctionManager } from '../../sanctions/SanctionManager';
import { createLogger } from '../../logger/Logger';
import { ChatManager } from '../../../chat-manager/ChatManager';
import { MatchStatsManager } from '../../stats/MatchStatsManager';
import { PlayerCacheManager } from '../../player/PlayerCacheManager';
import { STRINGS } from '../../strings';

/**
 * Handler para eventos de jugador uniéndose
 * Basado en onPlayerJoinListener del sistema viejo
 */
export class PlayerJoinHandler {
  private logger = createLogger('PlayerJoinHandler');
  private playerIdentityManager = PlayerIdentityManager.getInstance();
  private sanctionManager: SanctionManager | null = null;
  public chatManager: ChatManager | null = null;
  private matchStatsManager: MatchStatsManager | null = null;
  private playerCache = PlayerCacheManager.getInstance();
  private haxballRoom: any = null;
  public ruid: string;
  private processingPlayers = new Set<string>(); // Cache para evitar duplicados

  constructor(chatManager?: ChatManager, ruid?: string, matchStatsManager?: MatchStatsManager) {
    this.chatManager = chatManager || null;
    this.matchStatsManager = matchStatsManager || null;
    this.ruid = ruid || '';
    if (ruid && ruid !== '') {
      this.sanctionManager = new SanctionManager(ruid);
    }
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.onEvent('haxball.player.join', this.handlePlayerJoin.bind(this));
  }

  private async handlePlayerJoin(event: HaxballPlayerJoinEvent): Promise<void> {
    const { player, timestamp } = event;
    
    // Crear clave única para el jugador
    const playerKey = `${player.conn}-${player.name}`;
    
    // Verificar si ya se está procesando este jugador
    if (this.processingPlayers.has(playerKey)) {
      this.logger.warn('Player join already being processed, skipping', {
        playerId: player.id,
        playerName: player.name,
        playerKey
      });
      return;
    }
    
    // Marcar como en proceso
    this.processingPlayers.add(playerKey);
    
    this.logger.player('joined', player.name, {
      playerId: player.id,
      auth: player.auth,
      conn: player.conn,
      team: player.team,
      admin: player.admin,
      timestamp: new Date(timestamp).toISOString()
    });

    try {
      // Validaciones básicas
      if (await this.validatePlayerName(player)) {
        this.logger.warn('Player kicked for invalid name', {
          playerId: player.id,
          playerName: player.name,
          reason: 'separator_not_allowed'
        });
        return; // Player kicked, stop processing
      }

      if (await this.checkDuplicateNickname(player)) {
        this.logger.warn('Player kicked for duplicate nickname', {
          playerId: player.id,
          playerName: player.name
        });
        return;
      }

      // Crear/actualizar identidad del jugador primero
      const identityId = await this.createOrUpdatePlayerIdentity(player, timestamp);
      
      // Poblar cache unificado con datos del jugador
      await this.playerCache.updatePlayer(player.id, {
        name: player.name,
        team: player.team,
        auth: player.auth,
        conn: player.conn,
        admin: player.admin,
        identityId,
        isAfk: false // Jugador recién conectado no puede estar AFK
      });
      
      // Verificar bans activos
      if (await this.checkActiveBans(identityId, player)) {
        return; // Player banned, stop processing
      }

      // Cachear estado de mute
      if (this.sanctionManager) {
        await this.sanctionManager.cacheMuteStatus(player.id, identityId);
      }

      // Enviar mensajes de bienvenida
      if (this.chatManager) {
        await this.chatManager.sendWelcomeSequence(player);
      }

      // Inicializar jugador en estadísticas del partido siempre (no solo si está activo)
      if (this.matchStatsManager && identityId) {
        await this.matchStatsManager.initializePlayer(player.id, player.name, identityId);
      }

      // Emitir evento interno para otros subsistemas
      eventBus.emitEvent('player.identity.created', {
        playerId: player.id,
        playerName: player.name,
        auth: player.auth,
        conn: player.conn,
        timestamp
      });

    } catch (error) {
      this.logger.error('Failed to process player join', error, {
        playerId: player.id,
        playerName: player.name,
        auth: player.auth,
        conn: player.conn,
        operation: 'handlePlayerJoin',
        timestamp: new Date(timestamp).toISOString()
      });
    } finally {
      // Limpiar del cache después de 5 segundos
      setTimeout(() => {
        this.processingPlayers.delete(playerKey);
      }, 5000);
    }
  }

  private async validatePlayerName(player: any): Promise<boolean> {
    if (player.name.includes('|,|')) {
      this.logger.info(`[PlayerJoin] ${player.name}#${player.id} kicked for separator`);
      if (this.haxballRoom) {
        await this.haxballRoom.kickPlayer(player.id, 'Separador no permitido', false);
      }
      return true;
    }
    return false;
  }

  private async checkDuplicateNickname(player: any): Promise<boolean> {
    const kickReason = STRINGS.onJoin.duplicatedNickname;

    if (this.playerCache.isNicknameTaken(player.name, player.id)) {
      if (this.haxballRoom) {
        await this.haxballRoom.kickPlayer(player.id, kickReason, false);
      }
      return true;
    }

    if (this.haxballRoom?.getCurrentPlayers) {
      try {
        const roomPlayers = await this.haxballRoom.getCurrentPlayers();
        const normalized = player.name.trim().toLowerCase();
        const duplicate = roomPlayers.some(
          (p: { id: number; name: string }) =>
            p.id !== player.id && p.name.trim().toLowerCase() === normalized
        );
        if (duplicate) {
          await this.haxballRoom.kickPlayer(player.id, kickReason, false);
          return true;
        }
      } catch (error) {
        this.logger.warn('Could not verify duplicate nickname via room list', error);
      }
    }

    return false;
  }

  private async checkActiveBans(identityId: string, player: any): Promise<boolean> {
    try {
      if (!this.sanctionManager) return false;
      
      const banInfo = await this.sanctionManager.checkBan(identityId);
      if (banInfo) {
        await this.sanctionManager.handleBannedPlayerJoin(identityId, player.id, player.name, banInfo);
        return true;
      }
      
      return false;
    } catch (error) {
      this.logger.warn(`[PlayerJoin] Failed to check ban for ${player.name}:`, error);
      return false;
    }
  }

  private async createOrUpdatePlayerIdentity(player: any, timestamp: number): Promise<string> {
    try {
      // Usar el ruid del constructor
      const identityId = await this.playerIdentityManager.identifyPlayer(this.ruid, player);
      return identityId;
    } catch (error) {
      this.logger.error(`[PlayerJoin] Failed to process identity for ${player.name}:`, error);
      throw error;
    }
  }

  /**
   * Configura el HaxballRoom en el SanctionManager
   */
  public setHaxballRoom(room: any): void {
    this.haxballRoom = room;
    if (this.sanctionManager) {
      this.sanctionManager.setHaxballRoom(room);
    }
  }

  /**
   * Obtiene el gestor de sanciones
   */
  public getSanctionManager(): SanctionManager | null {
    return this.sanctionManager;
  }

  /**
   * Configura el MatchStatsManager
   */
  public setMatchStatsManager(matchStatsManager: MatchStatsManager): void {
    this.matchStatsManager = matchStatsManager;
  }
}