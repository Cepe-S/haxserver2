import { db } from '@mikuserverpro/database';
import { Logger } from '../logger/Logger';
import { GeoLocationService } from '../services/GeoLocationService';

export interface HaxballPlayer {
  id: number;
  name: string;
  auth: string;
  conn: string;
  admin: boolean;
  team: number;
}

export interface PlayerIdentityData {
  id: string;
  primaryAuth?: string;
  primaryConn: string;
  firstSeen: Date;
  lastSeen: Date;
  allAuths: string[];
  allNames: string[];
  allConnections: string[];
  currentConnection?: ConnectionData;
}

export interface ConnectionData {
  id: string;
  ruid: string;
  haxballId: number;
  auth?: string;
  conn: string;
  name: string;
  joinedAt: Date;
  leftAt?: Date;
  ipAddress?: string;
  country?: string;
}

export class PlayerIdentityManager {
  private static instance: PlayerIdentityManager;
  private logger = new Logger('PlayerIdentity');
  private geoService = new GeoLocationService();
  private processingPlayers = new Set<string>(); // Evitar procesamiento duplicado

  private constructor() {} // Constructor privado para singleton

  public static getInstance(): PlayerIdentityManager {
    if (!PlayerIdentityManager.instance) {
      PlayerIdentityManager.instance = new PlayerIdentityManager();
    }
    return PlayerIdentityManager.instance;
  }

  /**
   * ALGORITMO SÓLIDO DE IDENTIFICACIÓN:
   * 1. Si auth existe, buscar por auth
   * 2. Si no, buscar por conn
   * 3. Si no existe, crear nueva identidad
   * 4. Actualizar todos los datos asociados
   */
  async identifyPlayer(ruid: string, haxPlayer: HaxballPlayer): Promise<string> {
    const playerKey = `${haxPlayer.conn}-${haxPlayer.name}`;
    
    // Evitar procesamiento duplicado
    if (this.processingPlayers.has(playerKey)) {
      this.logger.warn('Player identification already in progress, skipping', {
        playerKey,
        ruid,
        name: haxPlayer.name
      });
      // Esperar un poco y devolver el resultado existente
      await new Promise(resolve => setTimeout(resolve, 100));
      // Buscar la identidad existente
      const existing = await this.findPlayerByAny(haxPlayer.conn);
      if (existing) return existing;
    }
    
    this.processingPlayers.add(playerKey);
    
    try {
      // DEBUGGING: Rastrear todas las llamadas
      const stack = new Error().stack?.split('\n').slice(1, 4).join(' | ') || 'unknown';
      this.logger.debug('Starting player identification', {
        ruid,
        name: haxPlayer.name,
        hasAuth: !!haxPlayer.auth,
        hasConn: !!haxPlayer.conn,
        callStack: stack
      });

      // Validar datos básicos
      if (!haxPlayer.conn || !haxPlayer.name) {
        throw new Error('Missing required fields: conn or name');
      }

      let identityId: string | undefined;

      // 1. Buscar por auth si existe
      if (haxPlayer.auth) {
        const authRecord = await db.playerAuth.findUnique({
          where: { auth: haxPlayer.auth }
        });
        if (authRecord) {
          identityId = authRecord.identityId;
          this.logger.debug('Found existing identity by auth', { identityId });
          await this.updatePlayerData(identityId, haxPlayer);
        }
      }

      // 2. Buscar por conn si no se encontró por auth
      if (!identityId) {
        const connRecord = await db.playerConnection.findUnique({
          where: { conn: haxPlayer.conn }
        });
        if (connRecord) {
          identityId = connRecord.identityId;
          this.logger.debug('Found existing identity by conn', { identityId });
          
          // Agregar auth si no existe
          if (haxPlayer.auth) {
            await this.addAuthToIdentity(identityId, haxPlayer.auth);
          }
          
          await this.updatePlayerData(identityId, haxPlayer);
        }
      }

      // 3. Crear nueva identidad si no se encontró
      if (!identityId) {
        identityId = await this.createNewIdentity(haxPlayer);
        this.logger.debug('Created new identity', { identityId });
      }
      
      // 4. Crear conexión UNA SOLA VEZ (solo si ruid es válido)
      if (ruid && ruid.trim() !== '') {
        await this.createGameConnection(identityId, ruid, haxPlayer);
      } else {
        this.logger.debug('Skipping game connection - no valid ruid provided', { ruid, identityId });
      }
      
      this.logger.info('Player identification completed', { identityId });
      return identityId;

    } catch (error) {
      this.logger.error('Failed to identify player', { 
        error: error.message, 
        stack: error.stack,
        ruid, 
        playerName: haxPlayer.name,
        hasAuth: !!haxPlayer.auth,
        hasConn: !!haxPlayer.conn
      });
      throw error;
    } finally {
      // Limpiar del cache
      this.processingPlayers.delete(playerKey);
    }
  }

  /**
   * Crear nueva identidad de jugador
   */
  private async createNewIdentity(haxPlayer: HaxballPlayer): Promise<string> {
    try {
      const identity = await db.playerIdentity.create({
        data: {
          primaryAuth: haxPlayer.auth || null,
          primaryConn: haxPlayer.conn
        }
      });
      
      return await this.setupNewIdentity(identity.id, haxPlayer);
    } catch (error) {
      // Si falla por unique constraint, buscar la identidad existente
      if (error.code === 'P2002') {
        this.logger.debug('Identity already exists, finding existing one');
        const existing = await db.playerIdentity.findFirst({
          where: {
            OR: [
              { primaryAuth: haxPlayer.auth },
              { primaryConn: haxPlayer.conn }
            ]
          }
        });
        if (existing) {
          return existing.id;
        }
      }
      throw error;
    }
  }

  /**
   * Configurar nueva identidad con registros asociados
   */
  private async setupNewIdentity(identityId: string, haxPlayer: HaxballPlayer): Promise<string> {

    // Crear registros asociados
    if (haxPlayer.auth) {
      await db.playerAuth.create({
        data: {
          identityId,
          auth: haxPlayer.auth
        }
      });
    }

    // Crear conexión con geolocalización SOLO para la tabla PlayerConnection (no Connection)
    const ipAddress = this.decodeHexConn(haxPlayer.conn);
    const geoData = await this.geoService.getLocationData(ipAddress);
    
    await db.playerConnection.create({
      data: {
        identityId,
        conn: haxPlayer.conn,
        ipAddress,
        country: geoData.country,
        region: geoData.region,
        city: geoData.city,
        timezone: geoData.timezone,
        isp: geoData.isp,
        isVpn: geoData.isVpn,
        isProxy: geoData.isProxy,
        isTor: geoData.isTor,
        threatLevel: geoData.threatLevel
      }
    });

    await db.playerName.create({
      data: {
        identityId,
        name: haxPlayer.name
      }
    });

    return identityId;
  }

  /**
   * Agregar auth a identidad existente
   */
  private async addAuthToIdentity(identityId: string, auth: string): Promise<void> {
    if (!auth) return;

    try {
      await db.playerAuth.create({
        data: {
          identityId,
          auth
        }
      });

      // Actualizar primaryAuth si no existe
      await db.playerIdentity.update({
        where: { id: identityId },
        data: {
          primaryAuth: auth,
          lastSeen: new Date()
        }
      });

      this.logger.debug('Auth added to existing identity', { identityId, auth });
    } catch (error) {
      // Auth ya existe, solo actualizar lastSeen
      await db.playerAuth.update({
        where: { auth },
        data: { lastSeen: new Date() }
      });
    }
  }

  /**
   * Actualizar datos del jugador (nombres, conexiones)
   */
  private async updatePlayerData(identityId: string, haxPlayer: HaxballPlayer): Promise<void> {
    const now = new Date();

    // Actualizar identidad principal
    await db.playerIdentity.update({
      where: { id: identityId },
      data: { lastSeen: now }
    });

    // Actualizar o crear nombre (unique identityId + name en BD)
    const existingName = await db.playerName.findFirst({
      where: { identityId, name: haxPlayer.name }
    });

    if (existingName) {
      await db.playerName.update({
        where: { id: existingName.id },
        data: {
          lastSeen: now,
          useCount: { increment: 1 }
        }
      });
    } else {
      await db.playerName.create({
        data: { identityId, name: haxPlayer.name }
      });
    }

    // Actualizar conexión
    await db.playerConnection.updateMany({
      where: {
        identityId,
        conn: haxPlayer.conn
      },
      data: {
        lastSeen: now,
        useCount: { increment: 1 }
      }
    });
  }

  /**
   * Única función para crear conexiones de juego en tabla Connection
   */
  private async createGameConnection(identityId: string, ruid: string, haxPlayer: HaxballPlayer): Promise<void> {
    // Verificar si ya existe una conexión activa para este jugador en esta sala
    const existingConnection = await db.connection.findFirst({
      where: {
        ruid,
        playerId: identityId,
        leftAt: null
      }
    });

    if (existingConnection) {
      // ERROR: Jugador se unió sin haber salido de la conexión anterior
      this.logger.warn('Player joined without proper leave - closing previous connection', {
        identityId,
        ruid,
        haxballId: haxPlayer.id,
        previousConnectionId: existingConnection.id
      });
      
      // Cerrar la conexión anterior
      await db.connection.update({
        where: { id: existingConnection.id },
        data: { leftAt: new Date() }
      });
    }

    const ipAddress = this.decodeHexConn(haxPlayer.conn);
    const geoData = await this.geoService.getLocationData(ipAddress);
    
    await db.connection.create({
      data: {
        ruid,
        playerId: identityId,
        haxballId: haxPlayer.id,
        auth: haxPlayer.auth || null,
        conn: haxPlayer.conn,
        name: haxPlayer.name,
        ipAddress,
        country: geoData.country,
        region: geoData.region,
        city: geoData.city,
        isp: geoData.isp,
        isVpn: geoData.isVpn,
        isProxy: geoData.isProxy,
        threatLevel: geoData.threatLevel
      }
    });

    this.logger.debug('Connection created', { identityId, ruid, haxballId: haxPlayer.id });
  }

  /**
   * Obtener identidad completa del jugador
   */
  async getPlayerIdentity(identityId: string): Promise<PlayerIdentityData | null> {
    try {
      const identity = await db.playerIdentity.findUnique({
        where: { id: identityId },
        include: {
          auths: true,
          names: true,
          connections: true,
          gameConnections: {
            orderBy: { joinedAt: 'desc' },
            take: 1
          }
        }
      });

      if (!identity) return null;

      return {
        id: identity.id,
        primaryAuth: identity.primaryAuth || undefined,
        primaryConn: identity.primaryConn,
        firstSeen: identity.firstSeen,
        lastSeen: identity.lastSeen,
        allAuths: identity.auths.map(a => a.auth),
        allNames: identity.names.map(n => n.name),
        allConnections: identity.connections.map(c => c.conn),
        currentConnection: identity.gameConnections[0] ? {
          id: identity.gameConnections[0].id,
          ruid: identity.gameConnections[0].ruid,
          haxballId: identity.gameConnections[0].haxballId,
          auth: identity.gameConnections[0].auth || undefined,
          conn: identity.gameConnections[0].conn,
          name: identity.gameConnections[0].name,
          joinedAt: identity.gameConnections[0].joinedAt,
          leftAt: identity.gameConnections[0].leftAt || undefined,
          ipAddress: identity.gameConnections[0].ipAddress || undefined,
          country: identity.gameConnections[0].country || undefined
        } : undefined
      };
    } catch (error) {
      this.logger.error('Failed to get player identity', { error: error.message, identityId });
      return null;
    }
  }

  /**
   * Buscar jugador por cualquier identificador
   */
  async findPlayerByAny(identifier: string): Promise<string | null> {
    try {
      // Buscar por auth
      const authRecord = await db.playerAuth.findUnique({
        where: { auth: identifier }
      });
      if (authRecord) return authRecord.identityId;

      // Buscar por conn
      const connRecord = await db.playerConnection.findUnique({
        where: { conn: identifier }
      });
      if (connRecord) return connRecord.identityId;

      // Buscar por nombre
      const nameRecord = await db.playerName.findFirst({
        where: { name: identifier }
      });
      if (nameRecord) return nameRecord.identityId;

      return null;
    } catch (error) {
      this.logger.error('Failed to find player', { error: error.message, identifier });
      return null;
    }
  }

  /**
   * Obtener jugadores de una sala
   */
  async getRoomPlayers(ruid: string): Promise<PlayerIdentityData[]> {
    try {
      this.logger.debug('Getting room players', { ruid });
      
      // Test basic query first
      const connectionCount = await db.connection.count({ where: { ruid } });
      this.logger.debug('Connection count for room', { ruid, connectionCount });
      
      if (connectionCount === 0) {
        this.logger.debug('No connections found for room', { ruid });
        return [];
      }
      
      // Obtener conexiones activas y recientes (últimas 24 horas)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const connections = await db.connection.findMany({
        where: {
          ruid,
          OR: [
            { leftAt: null }, // Conexiones activas
            { leftAt: { gte: oneDayAgo } } // Conexiones recientes
          ]
        },
        orderBy: { joinedAt: 'desc' }
      });
      
      this.logger.debug('Found active connections', { count: connections.length });
      
      const result: PlayerIdentityData[] = [];
      
      for (const connection of connections) {
        try {
          const identity = await db.playerIdentity.findUnique({
            where: { id: connection.playerId },
            include: {
              auths: true,
              names: true,
              connections: true
            }
          });
          
          if (identity) {
            result.push({
              id: identity.id,
              primaryAuth: identity.primaryAuth || undefined,
              primaryConn: identity.primaryConn,
              firstSeen: identity.firstSeen,
              lastSeen: identity.lastSeen,
              allAuths: identity.auths.map(a => a.auth),
              allNames: identity.names.map(n => n.name),
              allConnections: identity.connections.map(c => c.conn),
              currentConnection: {
                id: connection.id,
                ruid: connection.ruid,
                haxballId: connection.haxballId,
                auth: connection.auth || undefined,
                conn: connection.conn,
                name: connection.name,
                joinedAt: connection.joinedAt,
                leftAt: connection.leftAt || undefined,
                ipAddress: connection.ipAddress || undefined,
                country: connection.country || undefined
              }
            });
          }
        } catch (connectionError) {
          this.logger.error('Error processing connection', { 
            error: connectionError.message,
            connectionId: connection.id
          });
        }
      }
      
      return result;
    } catch (error) {
      this.logger.error('Failed to get room players', { 
        error: error.message, 
        stack: error.stack,
        ruid 
      });
      return [];
    }
  }



  /**
   * Decodificar conexión hex a IP
   */
  private decodeHexConn(hexConn: string): string {
    try {
      let ascii = '';
      for (let i = 0; i < hexConn.length; i += 2) {
        ascii += String.fromCharCode(parseInt(hexConn.substr(i, 2), 16));
      }
      return ascii;
    } catch {
      return 'Unknown';
    }
  }
}