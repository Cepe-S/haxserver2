import { createLogger } from '../../shared/logger/Logger';
import { PermissionLevel } from './types/CommandTypes';
import { db } from '@mikuserverpro/database';
import { PlayerCacheManager } from '../../shared/player/PlayerCacheManager';

/**
 * Gestor de permisos para comandos
 */
export class PermissionManager {
  private logger = createLogger('PermissionManager');
  private adminCache = new Map<string, PermissionLevel>(); // cacheKey -> level
  private cacheExpiry = new Map<string, number>(); // cacheKey -> timestamp
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  /**
   * Obtiene el nivel de permisos de un jugador
   */
  public async getPermissionLevel(player: any, ruid: string, adminManager?: any): Promise<PermissionLevel> {
    if (adminManager && adminManager.isLoggedAdmin(player.id)) {
      return PermissionLevel.ADMIN;
    }

    if (player.admin) {
      return PermissionLevel.ADMIN;
    }

    const cachedPlayer = PlayerCacheManager.getInstance().getPlayerByHaxballId(player.id);
    if (cachedPlayer?.identityId) {
      const level = await this.getPermissionForIdentity(cachedPlayer.identityId, ruid);
      if (level !== PermissionLevel.PLAYER) {
        return level;
      }
    }

    if (!player.auth) {
      return PermissionLevel.PLAYER;
    }

    const cached = this.getCachedPermission(`auth:${player.auth}`);
    if (cached !== null) {
      return cached;
    }

    try {
      const authRecord = await db.playerAuth.findUnique({
        where: { auth: player.auth },
        include: {
          identity: {
            include: {
              permissions: {
                where: { ruid }
              }
            }
          }
        }
      });

      const level = this.levelFromPermissions(authRecord?.identity?.permissions?.[0]);
      this.setCachedPermission(`auth:${player.auth}`, level);
      if (authRecord?.identityId) {
        this.setCachedPermission(`id:${authRecord.identityId}`, level);
      }

      return level;
    } catch (error) {
      this.logger.error('Failed to get permission level', error);
      return PermissionLevel.PLAYER;
    }
  }

  /**
   * Verifica si un jugador tiene permisos suficientes
   */
  public async hasPermission(player: any, requiredLevel: PermissionLevel, ruid: string, adminManager?: any): Promise<boolean> {
    const playerLevel = await this.getPermissionLevel(player, ruid, adminManager);
    return playerLevel >= requiredLevel;
  }

  /**
   * Otorga permisos de admin por auth Haxball (requiere identidad existente)
   */
  public async grantAdmin(targetAuth: string, ruid: string, isSuperAdmin = false): Promise<boolean> {
    try {
      const authRecord = await db.playerAuth.findUnique({
        where: { auth: targetAuth }
      });

      if (!authRecord) {
        this.logger.warn('Cannot grant admin: auth not linked to any identity', { targetAuth });
        return false;
      }

      return this.grantAdminByIdentityId(authRecord.identityId, ruid, isSuperAdmin);
    } catch (error) {
      this.logger.error('Failed to grant admin', error);
      return false;
    }
  }

  /**
   * Otorga permisos de admin por identityId (fuente de verdad on-line)
   */
  public async grantAdminByIdentityId(identityId: string, ruid: string, isSuperAdmin = false): Promise<boolean> {
    try {
      const identity = await db.playerIdentity.findUnique({ where: { id: identityId } });
      if (!identity) {
        this.logger.warn('Cannot grant admin: identity not found', { identityId });
        return false;
      }

      await db.playerPermission.upsert({
        where: {
          ruid_identityId: {
            ruid,
            identityId
          }
        },
        update: {
          isAdmin: true,
          isSuperAdmin,
          grantedAt: new Date()
        },
        create: {
          ruid,
          identityId,
          isAdmin: true,
          isSuperAdmin,
          grantedAt: new Date()
        }
      });

      this.clearCacheForIdentity(identityId, identity.primaryAuth);
      this.logger.info(`Admin granted to identity ${identityId}`, { ruid, isSuperAdmin });
      return true;
    } catch (error) {
      this.logger.error('Failed to grant admin by identity', error);
      return false;
    }
  }

  /**
   * Revoca permisos de admin a un jugador
   */
  public async revokeAdmin(targetAuth: string, ruid: string): Promise<boolean> {
    try {
      const authRecord = await db.playerAuth.findUnique({
        where: { auth: targetAuth }
      });

      if (!authRecord) {
        return false;
      }

      await db.playerPermission.deleteMany({
        where: {
          ruid,
          identityId: authRecord.identityId
        }
      });

      this.clearCacheForIdentity(authRecord.identityId, targetAuth);
      this.logger.info(`Admin revoked from ${targetAuth}`, { ruid });
      return true;
    } catch (error) {
      this.logger.error('Failed to revoke admin', error);
      return false;
    }
  }

  private async getPermissionForIdentity(identityId: string, ruid: string): Promise<PermissionLevel> {
    const cacheKey = `id:${identityId}`;
    const cached = this.getCachedPermission(cacheKey);
    if (cached !== null) {
      return cached;
    }

    try {
      const perm = await db.playerPermission.findUnique({
        where: {
          ruid_identityId: { ruid, identityId }
        }
      });

      const level = this.levelFromPermissions(perm);
      this.setCachedPermission(cacheKey, level);
      return level;
    } catch (error) {
      this.logger.error('Failed to get permission for identity', error);
      return PermissionLevel.PLAYER;
    }
  }

  private levelFromPermissions(perm?: { isSuperAdmin: boolean; isAdmin: boolean } | null): PermissionLevel {
    if (!perm) return PermissionLevel.PLAYER;
    if (perm.isSuperAdmin) return PermissionLevel.SUPER_ADMIN;
    if (perm.isAdmin) return PermissionLevel.ADMIN;
    return PermissionLevel.PLAYER;
  }

  private getCachedPermission(cacheKey: string): PermissionLevel | null {
    const expiry = this.cacheExpiry.get(cacheKey);
    if (!expiry || Date.now() > expiry) {
      this.adminCache.delete(cacheKey);
      this.cacheExpiry.delete(cacheKey);
      return null;
    }

    return this.adminCache.get(cacheKey) ?? null;
  }

  private setCachedPermission(cacheKey: string, level: PermissionLevel): void {
    this.adminCache.set(cacheKey, level);
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);
  }

  private clearCacheForIdentity(identityId: string, primaryAuth?: string | null): void {
    this.adminCache.delete(`id:${identityId}`);
    this.cacheExpiry.delete(`id:${identityId}`);
    if (primaryAuth) {
      this.adminCache.delete(`auth:${primaryAuth}`);
      this.cacheExpiry.delete(`auth:${primaryAuth}`);
    }
  }

  public clearAllCache(): void {
    this.adminCache.clear();
    this.cacheExpiry.clear();
  }
}
