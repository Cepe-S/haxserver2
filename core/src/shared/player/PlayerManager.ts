import { db } from '@mikuserverpro/database';
import { Logger } from '../logger/Logger';

export interface HaxballPlayer {
  id: number;
  name: string;
  auth: string;
  conn: string;
  admin: boolean;
  team: number;
}

export interface PlayerData {
  id: string;
  ruid: string;
  auth: string;
  conn: string;
  name: string;
  rating: number;
  totals: number;
  disconns: number;
  wins: number;
  goals: number;
  assists: number;
  ogs: number;
  losePoints: number;
  balltouch: number;
  passed: number;
  mute: boolean;
  muteExpire: number;
  banned: boolean;
  banExpire: number;
  banReason?: string;
  malActCount: number;
  rejoinCount: number;
  joinDate: number;
  leftDate: number;
}

export interface PlayerPermissions {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  grantedBy?: string;
}

export interface SanctionData {
  id: string;
  ruid: string;
  playerAuth: string;
  playerConn: string;
  playerName: string;
  type: 'ban' | 'mute' | 'kick' | 'warning';
  reason?: string;
  duration: number;
  adminAuth?: string;
  adminName?: string;
  isActive: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export class PlayerManager {
  private logger = new Logger('PlayerManager');

  /**
   * Save or update player data when they join
   */
  async savePlayer(ruid: string, haxPlayer: HaxballPlayer): Promise<PlayerData> {
    try {
      this.logger.debug('Saving player', { 
        ruid, 
        playerName: haxPlayer.name,
        hasAuth: !!haxPlayer.auth,
        hasConn: !!haxPlayer.conn
      });
      
      if (!haxPlayer.conn || !haxPlayer.name) {
        throw new Error('Missing required player fields: conn or name');
      }

      // Find or create player identity
      let identity = await db.playerIdentity.findFirst({
        where: haxPlayer.auth ? { primaryAuth: haxPlayer.auth } : { primaryConn: haxPlayer.conn }
      });

      if (!identity) {
        identity = await db.playerIdentity.create({
          data: {
            primaryAuth: haxPlayer.auth || null,
            primaryConn: haxPlayer.conn
          }
        });
      } else {
        await db.playerIdentity.update({
          where: { id: identity.id },
          data: { lastSeen: new Date() }
        });
      }

      // Create or get player stats
      let stats = await db.playerStats.findUnique({
        where: { ruid_playerId: { ruid, playerId: identity.id } }
      });

      if (!stats) {
        stats = await db.playerStats.create({
          data: {
            ruid,
            playerId: identity.id
          }
        });
      }

      // Connection is created by PlayerIdentityManager.identifyPlayer()

      this.logger.info(`Player saved: ${haxPlayer.name}`, { ruid, playerId: haxPlayer.id });
      return this.mapStatsToPlayerData(stats, identity);
    } catch (error) {
      this.logger.error('Failed to save player', { error: error.message, ruid, playerName: haxPlayer.name });
      throw error;
    }
  }

  /**
   * Get player data by auth
   */
  async getPlayer(ruid: string, auth: string): Promise<PlayerData | null> {
    try {
      const player = await db.playerIdentity.findFirst({
        where: {
          primaryAuth: auth
        }
      });

      if (!player) return null;
      
      // Get stats for this player
      const stats = await db.playerStats.findFirst({
        where: { playerId: player.id }
      });
      
      return stats ? this.mapStatsToPlayerData(stats, player) : null;
    } catch (error) {
      this.logger.error('Failed to get player', { error, ruid, auth });
      return null;
    }
  }

  /**
   * Get player permissions
   */
  async getPlayerPermissions(ruid: string, auth: string): Promise<PlayerPermissions> {
    try {
      const identity = await db.playerIdentity.findFirst({
        where: { primaryAuth: auth },
        include: { permissions: { where: { ruid } } }
      });
      const permissions = identity?.permissions?.[0];

      return {
        isAdmin: permissions?.isAdmin || false,
        isSuperAdmin: permissions?.isSuperAdmin || false,
        grantedBy: permissions?.grantedBy || undefined
      };
    } catch (error) {
      this.logger.error('Failed to get player permissions', { error, ruid, auth });
      return { isAdmin: false, isSuperAdmin: false };
    }
  }

  /**
   * Set player admin permissions
   */
  async setPlayerAdmin(ruid: string, targetAuth: string, grantedByAuth: string, isAdmin: boolean): Promise<void> {
    try {
      const identity = await db.playerIdentity.findFirst({
        where: { primaryAuth: targetAuth }
      });
      if (identity) {
        await db.playerPermission.upsert({
          where: {
            ruid_identityId: { ruid, identityId: identity.id }
          },
          update: {
            isAdmin,
            grantedBy: grantedByAuth,
            grantedAt: new Date()
          },
          create: {
            ruid,
            identityId: identity.id,
            isAdmin,
            grantedBy: grantedByAuth
          }
        });
      }

      this.logger.info(`Player admin status updated`, {
        ruid,
        targetAuth,
        isAdmin,
        grantedBy: grantedByAuth
      });
    } catch (error) {
      this.logger.error('Failed to set player admin', { error, ruid, targetAuth, isAdmin });
      throw error;
    }
  }

  /**
   * Set player super admin permissions
   */
  async setPlayerSuperAdmin(ruid: string, targetAuth: string, grantedByAuth: string, isSuperAdmin: boolean): Promise<void> {
    try {
      const identity = await db.playerIdentity.findFirst({
        where: { primaryAuth: targetAuth }
      });
      if (identity) {
        await db.playerPermission.upsert({
          where: {
            ruid_identityId: { ruid, identityId: identity.id }
          },
          update: {
            isSuperAdmin,
            grantedBy: grantedByAuth,
            grantedAt: new Date()
          },
          create: {
            ruid,
            identityId: identity.id,
            isSuperAdmin,
            grantedBy: grantedByAuth
          }
        });
      }

      this.logger.info(`Player super admin status updated`, {
        ruid,
        targetAuth,
        isSuperAdmin,
        grantedBy: grantedByAuth
      });
    } catch (error) {
      this.logger.error('Failed to set player super admin', { error, ruid, targetAuth, isSuperAdmin });
      throw error;
    }
  }

  /**
   * Update player statistics
   */
  async updatePlayerStats(ruid: string, auth: string, statsUpdate: Partial<PlayerData>): Promise<void> {
    try {
      const identity = await db.playerIdentity.findFirst({
        where: { primaryAuth: auth }
      });
      if (identity) {
        await db.playerStats.update({
          where: { ruid_playerId: { ruid, playerId: identity.id } },
          data: {
            goals: statsUpdate.goals,
            assists: statsUpdate.assists,
            ogs: statsUpdate.ogs,
            balltouch: statsUpdate.balltouch,
            rating: statsUpdate.rating,
            totals: statsUpdate.totals,
            wins: statsUpdate.wins
          }
        });
      }

      this.logger.debug(`Player stats updated`, { ruid, auth });
    } catch (error) {
      this.logger.error('Failed to update player stats', { error, ruid, auth });
      throw error;
    }
  }

  /**
   * Get all players for a room
   */
  async getRoomPlayers(ruid: string): Promise<PlayerData[]> {
    try {
      this.logger.debug('Getting room players', { ruid });
      
      const stats = await db.playerStats.findMany({
        where: { ruid },
        include: { player: true },
        orderBy: { rating: 'desc' }
      });
      
      this.logger.debug('Players retrieved', { count: stats.length, ruid });
      return stats.map(stat => this.mapStatsToPlayerData(stat, stat.player));
    } catch (error) {
      this.logger.error('Failed to get room players', { error: error.message, ruid });
      return [];
    }
  }

  /**
   * Ban a player
   */
  async banPlayer(ruid: string, playerAuth: string, adminAuth: string, duration: number = 0, reason?: string): Promise<void> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = duration > 0 ? new Date((now + duration * 60) * 1000) : null;
      
      const identity = await db.playerIdentity.findFirst({
        where: { primaryAuth: playerAuth }
      });
      if (identity) {
        // Create sanction record
        await db.playerSanction.create({
          data: {
            ruid,
            identityId: identity.id,
            type: 'ban',
            reason,
            duration,
            adminAuth,
            expiresAt
          }
        });
      }
      
      this.logger.info(`Player banned`, { ruid, playerAuth, duration, reason, adminAuth });
    } catch (error) {
      this.logger.error('Failed to ban player', { error, ruid, playerAuth });
      throw error;
    }
  }

  /**
   * Unban a player
   */
  async unbanPlayer(ruid: string, playerAuth: string, adminAuth: string): Promise<void> {
    try {
      const identity = await db.playerIdentity.findFirst({
        where: { primaryAuth: playerAuth }
      });
      if (identity) {
        // Deactivate ban sanctions
        await db.playerSanction.updateMany({
          where: {
            ruid,
            identityId: identity.id,
            type: 'ban',
            isActive: true
          },
          data: { isActive: false }
        });
      }
      
      this.logger.info(`Player unbanned`, { ruid, playerAuth, adminAuth });
    } catch (error) {
      this.logger.error('Failed to unban player', { error, ruid, playerAuth });
      throw error;
    }
  }

  /**
   * Get player sanctions
   */
  async getPlayerSanctions(ruid: string, playerAuth: string): Promise<SanctionData[]> {
    try {
      const identity = await db.playerIdentity.findFirst({
        where: { primaryAuth: playerAuth }
      });
      if (!identity) return [];
      
      const sanctions = await db.playerSanction.findMany({
        where: { ruid, identityId: identity.id },
        orderBy: { createdAt: 'desc' }
      });
      
      return sanctions.map(s => ({
        id: s.id,
        ruid: s.ruid,
        playerAuth: playerAuth,
        playerConn: '',
        playerName: '',
        type: s.type as 'ban' | 'mute' | 'kick' | 'warning',
        reason: s.reason || undefined,
        duration: s.duration,
        adminAuth: s.adminAuth || undefined,
        adminName: s.adminName || undefined,
        isActive: s.isActive,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt || undefined
      }));
    } catch (error) {
      this.logger.error('Failed to get player sanctions', { error, ruid, playerAuth });
      return [];
    }
  }

  /**
   * Map database stats to PlayerData interface
   */
  private mapStatsToPlayerData(stats: any, identity: any): PlayerData {
    return {
      id: identity.id,
      ruid: stats.ruid,
      auth: identity.primaryAuth || '',
      conn: identity.primaryConn,
      name: identity.primaryAuth || 'Unknown',
      rating: stats.rating,
      totals: stats.totals,
      disconns: 0,
      wins: stats.wins,
      goals: stats.goals,
      assists: stats.assists,
      ogs: stats.ogs,
      losePoints: 0,
      balltouch: stats.balltouch,
      passed: 0,
      mute: false,
      muteExpire: 0,
      banned: false,
      banExpire: 0,
      banReason: undefined,
      malActCount: 0,
      rejoinCount: 0,
      joinDate: Math.floor(stats.createdAt.getTime() / 1000),
      leftDate: 0
    };
  }
}