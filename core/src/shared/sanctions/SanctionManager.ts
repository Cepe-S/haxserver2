import { createLogger } from '../logger/Logger';
import { db } from '@mikuserverpro/database';
import { PlayerCacheManager } from '../player/PlayerCacheManager';

export interface SanctionInfo {
  id: string;
  type: 'ban' | 'mute';
  reason?: string;
  duration: number; // minutos (0 = permanente)
  isActive: boolean;
  createdAt: Date;
  expiresAt?: Date;
  adminAuth?: string;
  adminName?: string;
}

export interface BanAttempt {
  identityId: string;
  attempts: number;
  lastAttempt: Date;
}

/**
 * Gestor de sanciones - Bans y muteos
 */
export class SanctionManager {
  private logger = createLogger('SanctionManager');
  private banAttempts = new Map<string, BanAttempt>(); // identityId -> attempts
  private playerCache = PlayerCacheManager.getInstance();
  private haxballRoom: any = null;

  constructor(private ruid: string) {}

  /**
   * Configura la referencia al HaxballRoom
   */
  public setHaxballRoom(room: any): void {
    this.haxballRoom = room;
  }

  /**
   * Verifica si un jugador está baneado
   */
  public async checkBan(identityId: string): Promise<SanctionInfo | null> {
    try {
      const activeBan = await db.playerSanction.findFirst({
        where: {
          identityId,
          ruid: this.ruid,
          type: 'ban',
          isActive: true,
          OR: [
            { expiresAt: null }, // Ban permanente
            { expiresAt: { gt: new Date() } } // Ban no expirado
          ]
        }
      });

      if (!activeBan) return null;

      return {
        id: activeBan.id,
        type: 'ban',
        reason: activeBan.reason || undefined,
        duration: activeBan.duration,
        isActive: activeBan.isActive,
        createdAt: activeBan.createdAt,
        expiresAt: activeBan.expiresAt || undefined,
        adminAuth: activeBan.adminAuth || undefined,
        adminName: activeBan.adminName || undefined
      };
    } catch (error) {
      this.logger.error('Error checking ban:', error);
      return null;
    }
  }

  /**
   * Maneja intento de conexión de jugador baneado
   */
  public async handleBannedPlayerJoin(identityId: string, playerId: number, playerName: string, banInfo: SanctionInfo): Promise<void> {
    // Obtener intentos previos
    const attempts = this.banAttempts.get(identityId) || { identityId, attempts: 0, lastAttempt: new Date(0) };
    
    // Incrementar intentos
    attempts.attempts++;
    attempts.lastAttempt = new Date();
    this.banAttempts.set(identityId, attempts);

    let kickMessage = '';
    let kickSuccess = false;
    const timeLeft = banInfo.expiresAt ? this.formatTimeRemaining(banInfo.expiresAt) : 'permanente';
    
    if (attempts.attempts === 1) {
      // Primera vez
      kickMessage = `🚫 Estás baneado. Razón: ${banInfo.reason || 'No especificada'}. Tiempo restante: ${timeLeft}. Puedes apelar en nuestro Discord.`;
      kickSuccess = await this.kickPlayer(playerId, kickMessage);
    } else if (attempts.attempts === 2) {
      // Segunda vez - advertencia
      kickMessage = `⚠️ ADVERTENCIA: Estás baneado. Si intentas entrar una vez más serás PERMABANEADO. Tiempo restante: ${timeLeft}. Apela en Discord.`;
      kickSuccess = await this.kickPlayer(playerId, kickMessage);
    } else {
      // Tercera vez - permabanear con sistema nativo
      kickMessage = `🔒 PERMABANEADO por intentos repetidos de evasión de ban.`;
      
      // Aplicar ban nativo de Haxball
      kickSuccess = await this.applyNativeBan(playerId, playerName);
      
      if (kickSuccess) {
        // Registrar permabanear en BD solo si el kick fue exitoso
        await this.createSanction(identityId, 'ban', 0, 'Evasión de ban - Permabanear automático', 'SYSTEM', 'AutoBan');
      }
    }
    
    this.logger.info(`Banned player join attempt: ${playerName} (attempt ${attempts.attempts}, kick ${kickSuccess ? 'successful' : 'failed'})`, { identityId, banInfo });
  }

  /**
   * Verifica si un jugador está muteado
   */
  public isPlayerMuted(playerId: number): SanctionInfo | null {
    return this.playerCache.isPlayerMuted(playerId);
  }

  /**
   * Cachea el estado de mute de un jugador al conectarse
   */
  public async cacheMuteStatus(playerId: number, identityId: string): Promise<void> {
    try {
      const activeMute = await db.playerSanction.findFirst({
        where: {
          identityId,
          ruid: this.ruid,
          type: 'mute',
          isActive: true,
          OR: [
            { expiresAt: null }, // Mute permanente
            { expiresAt: { gt: new Date() } } // Mute no expirado
          ]
        }
      });

      if (activeMute) {
        const muteInfo: SanctionInfo = {
          id: activeMute.id,
          type: 'mute',
          reason: activeMute.reason || undefined,
          duration: activeMute.duration,
          isActive: activeMute.isActive,
          createdAt: activeMute.createdAt,
          expiresAt: activeMute.expiresAt || undefined,
          adminAuth: activeMute.adminAuth || undefined,
          adminName: activeMute.adminName || undefined
        };
        
        this.playerCache.updateMuteStatus(playerId, muteInfo);
      }
    } catch (error) {
      this.logger.error('Error caching mute status:', error);
    }
  }

  /**
   * Crea una nueva sanción
   */
  public async createSanction(
    identityId: string,
    type: 'ban' | 'mute',
    durationMinutes: number,
    reason?: string,
    adminAuth?: string,
    adminName?: string
  ): Promise<string> {
    try {
      const expiresAt = durationMinutes > 0 ? new Date(Date.now() + durationMinutes * 60 * 1000) : null;

      const sanction = await db.playerSanction.create({
        data: {
          identityId,
          ruid: this.ruid,
          type,
          reason,
          duration: durationMinutes,
          adminAuth,
          adminName,
          expiresAt
        }
      });

      this.logger.info(`Sanction created: ${type} for ${identityId}`, { 
        duration: durationMinutes, 
        reason, 
        adminName 
      });

      return sanction.id;
    } catch (error) {
      this.logger.error('Error creating sanction:', error);
      throw error;
    }
  }

  /**
   * Parsea tiempo en formato string (ej: "60*24" = 1440 minutos)
   */
  public parseTimeString(timeStr: string): number {
    try {
      // Evaluar expresión matemática simple
      const result = Function(`"use strict"; return (${timeStr})`)();
      return typeof result === 'number' && result >= 0 ? Math.floor(result) : 0;
    } catch {
      // Si no es una expresión válida, intentar parsear como número
      const num = parseInt(timeStr);
      return isNaN(num) ? 0 : Math.max(0, num);
    }
  }

  /**
   * Encuentra jugador por ID o auth
   */
  public async findPlayerByIdOrAuth(identifier: string): Promise<{ identityId: string; currentPlayer?: any } | null> {
    try {
      // Limpiar identificador (remover #, espacios, etc.)
      const cleanIdentifier = identifier.replace(/[#\s]/g, '');
      
      // Intentar como ID de Haxball primero
      const playerId = parseInt(cleanIdentifier);
      if (!isNaN(playerId)) {
        const connection = await db.connection.findFirst({
          where: {
            haxballId: playerId,
            ruid: this.ruid,
            leftAt: null // Conexión activa
          }
        });
        
        if (connection) {
          return { 
            identityId: connection.playerId, 
            currentPlayer: { id: playerId, name: connection.name } 
          };
        }
        
        // Si no se encuentra en conexiones activas, buscar en conexiones recientes
        const recentConnection = await db.connection.findFirst({
          where: {
            haxballId: playerId,
            ruid: this.ruid,
            leftAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } // Últimos 5 minutos
          },
          orderBy: { leftAt: 'desc' }
        });
        
        if (recentConnection) {
          return { 
            identityId: recentConnection.playerId, 
            currentPlayer: { id: playerId, name: recentConnection.name } 
          };
        }
      }

      // Intentar como auth
      const authRecord = await db.playerAuth.findUnique({
        where: { auth: cleanIdentifier }
      });

      if (authRecord) {
        return { identityId: authRecord.identityId };
      }

      this.logger.warn(`Player not found with identifier: ${identifier}`);
      return null;
    } catch (error) {
      this.logger.error('Error finding player:', error);
      return null;
    }
  }

  /**
   * Formatea tiempo restante
   */
  private formatTimeRemaining(expiresAt: Date): string {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return 'expirado';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} días`;
    if (hours > 0) return `${hours} horas`;
    return `${minutes} minutos`;
  }

  /**
   * Kickea un jugador inmediatamente
   */
  public async kickPlayerNow(playerId: number, reason: string): Promise<boolean> {
    if (!this.haxballRoom?.browserPage) {
      this.logger.error(`Cannot kick player ${playerId}: HaxballRoom not available`);
      return false;
    }

    try {
      const result = await this.haxballRoom.browserPage.evaluate((pId: number, msg: string) => {
        if ((window as any).gameRoom?._room) {
          try {
            (window as any).gameRoom._room.kickPlayer(pId, msg, false);
            console.log(`[BROWSER] Player ${pId} kicked: ${msg}`);
            return { success: true };
          } catch (error) {
            console.error(`[BROWSER] Failed to kick player ${pId}:`, error);
            return { success: false, error: error.message };
          }
        }
        return { success: false, error: 'Room not available' };
      }, playerId, reason);

      if (result.success) {
        this.logger.info(`Player ${playerId} kicked: ${reason}`);
        return true;
      } else {
        this.logger.error(`Failed to kick player ${playerId}:`, result.error);
        return false;
      }
    } catch (error) {
      this.logger.error('Failed to kick player:', error);
      return false;
    }
  }

  /**
   * Kickea un jugador (método privado para bans)
   */
  private async kickPlayer(playerId: number, reason: string): Promise<boolean> {
    return await this.kickPlayerNow(playerId, reason);
  }

  /**
   * Aplica ban nativo de Haxball
   */
  private async applyNativeBan(playerId: number, playerName: string): Promise<boolean> {
    if (!this.haxballRoom?.browserPage) {
      this.logger.error(`Cannot apply native ban to player ${playerId}: HaxballRoom not available`);
      return false;
    }

    try {
      const result = await this.haxballRoom.browserPage.evaluate((pId: number, msg: string) => {
        if ((window as any).gameRoom?._room) {
          try {
            (window as any).gameRoom._room.kickPlayer(pId, msg, true); // true = ban
            console.log(`[BROWSER] Player ${pId} permanently banned`);
            return { success: true };
          } catch (error) {
            console.error(`[BROWSER] Failed to ban player ${pId}:`, error);
            return { success: false, error: error.message };
          }
        }
        return { success: false, error: 'Room not available' };
      }, playerId, `PERMABANEADO por evasión de ban`);

      if (result.success) {
        this.logger.info(`Player ${playerId} (${playerName}) permanently banned with native system`);
        return true;
      } else {
        this.logger.error(`Failed to apply native ban to player ${playerId}:`, result.error);
        return false;
      }
    } catch (error) {
      this.logger.error('Failed to apply native ban:', error);
      return false;
    }
  }

  /**
   * Desbanea un jugador por auth
   */
  public async unbanPlayer(auth: string, adminAuth?: string, adminName?: string): Promise<{ success: boolean; message: string }> {
    try {
      // Buscar identityId por auth
      const authRecord = await db.playerAuth.findUnique({
        where: { auth }
      });

      if (!authRecord) {
        return { success: false, message: 'Auth no encontrado' };
      }

      // Desactivar bans activos
      const result = await db.playerSanction.updateMany({
        where: {
          identityId: authRecord.identityId,
          ruid: this.ruid,
          type: 'ban',
          isActive: true
        },
        data: { isActive: false }
      });

      if (result.count === 0) {
        return { success: false, message: 'Jugador no está baneado' };
      }

      this.logger.info(`Player unbanned: ${auth}`, { adminName, count: result.count });
      return { success: true, message: `Jugador desbaneado (${result.count} bans removidos)` };
    } catch (error) {
      this.logger.error('Error unbanning player:', error);
      return { success: false, message: 'Error al desbanear jugador' };
    }
  }

  /**
   * Obtiene lista de jugadores baneados
   */
  public async getBannedPlayers(): Promise<Array<{ auth: string; name: string; reason?: string; createdAt: Date; adminName?: string }>> {
    try {
      const bans = await db.playerSanction.findMany({
        where: {
          ruid: this.ruid,
          type: 'ban',
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        include: {
          identity: {
            include: {
              auths: {
                orderBy: { lastSeen: 'desc' },
                take: 1
              },
              names: {
                orderBy: { lastSeen: 'desc' },
                take: 1
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return bans.map(ban => ({
        auth: ban.identity.auths[0]?.auth || 'Sin auth',
        name: ban.identity.names[0]?.name || 'Desconocido',
        reason: ban.reason,
        createdAt: ban.createdAt,
        adminName: ban.adminName
      }));
    } catch (error) {
      this.logger.error('Error getting banned players:', error);
      return [];
    }
  }

  /**
   * Desmutea un jugador por haxballId
   */
  public async unmutePlayer(haxballId: number, adminAuth?: string, adminName?: string): Promise<{ success: boolean; message: string }> {
    try {
      // Obtener identityId del cache
      const cachedPlayer = this.playerCache.getPlayerByHaxballId(haxballId);
      if (!cachedPlayer) {
        return { success: false, message: 'Jugador no encontrado en sala' };
      }

      // Desactivar mutes activos
      const result = await db.playerSanction.updateMany({
        where: {
          identityId: cachedPlayer.identityId,
          ruid: this.ruid,
          type: 'mute',
          isActive: true
        },
        data: { isActive: false }
      });

      if (result.count === 0) {
        return { success: false, message: 'Jugador no está muteado' };
      }

      // Actualizar cache
      this.playerCache.updateMuteStatus(haxballId, null);

      this.logger.info(`Player unmuted: ${cachedPlayer.name}#${haxballId}`, { adminName, count: result.count });
      return { success: true, message: `${cachedPlayer.name} ha sido desmuteado` };
    } catch (error) {
      this.logger.error('Error unmuting player:', error);
      return { success: false, message: 'Error al desmutear jugador' };
    }
  }

  /**
   * Limpia intentos de ban antiguos (llamar periódicamente)
   */
  public cleanupBanAttempts(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    for (const [identityId, attempt] of this.banAttempts.entries()) {
      if (attempt.lastAttempt < oneHourAgo) {
        this.banAttempts.delete(identityId);
      }
    }
  }
}