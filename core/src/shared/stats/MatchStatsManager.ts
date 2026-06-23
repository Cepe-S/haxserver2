import { createLogger } from '../logger/Logger';
import { db } from '@mikuserverpro/database';
import { PlayerCacheManager } from '../player/PlayerCacheManager';

interface PlayerMatchStats {
  haxballId: number;
  identityId: string;
  playerName: string;
  goals: number;
  assists: number;
  ownGoals: number;
  saves: number;
  ballTouches: number;
}

/**
 * Gestor de estadísticas del partido en memoria
 * Se guarda en BD al final del juego y se limpia el cache
 */
export class MatchStatsManager {
  private logger = createLogger('MatchStatsManager');
  private matchStats: Map<string, PlayerMatchStats> = new Map(); // Key: identityId
  private playerCache = PlayerCacheManager.getInstance();
  private ruid: string;
  private matchStartTime: Date | null = null;

  constructor(ruid: string) {
    this.ruid = ruid;
  }

  /**
   * Inicializa un jugador en las estadísticas del partido
   */
  public async initializePlayer(haxballId: number, playerName: string, identityId: string): Promise<void> {
    if (!this.matchStats.has(identityId)) {
      this.matchStats.set(identityId, {
        haxballId,
        identityId,
        playerName,
        goals: 0,
        assists: 0,
        ownGoals: 0,
        saves: 0,
        ballTouches: 0
      });
      // Cache unificado maneja el mapeo automáticamente
      this.logger.info(`🎮 PLAYER INITIALIZED: ${playerName}#${haxballId} → ${identityId}`);
      this.logger.info(`   Mapping created: haxballId ${haxballId} → identityId ${identityId}`);
    } else {
      this.logger.warn(`Player already initialized: ${playerName}#${haxballId} (${identityId})`);
    }
  }

  /**
   * Registra un gol usando haxballId
   */
  public recordGoal(haxballId: number): void {
    const player = this.playerCache.getPlayerByHaxballId(haxballId);
    if (player) {
      let stats = this.matchStats.get(player.identityId);
      if (!stats) {
        // Auto-initialize if not found
        this.matchStats.set(player.identityId, {
          haxballId,
          identityId: player.identityId,
          playerName: player.name,
          goals: 0,
          assists: 0,
          ownGoals: 0,
          saves: 0,
          ballTouches: 0
        });
        stats = this.matchStats.get(player.identityId)!;
        this.logger.debug(`Auto-initialized stats for ${player.name}#${haxballId}`);
      }
      stats.goals++;
      this.logger.debug(`Goal recorded for ${stats.playerName}#${haxballId} → ${player.identityId} (total: ${stats.goals})`);
    } else {
      this.logger.warn(`No player found in cache for haxballId: ${haxballId}`);
    }
  }

  /**
   * Registra una asistencia usando haxballId
   */
  public recordAssist(haxballId: number): void {
    const player = this.playerCache.getPlayerByHaxballId(haxballId);
    if (player) {
      const stats = this.matchStats.get(player.identityId);
      if (stats) {
        stats.assists++;
        this.logger.debug(`Assist recorded for ${stats.playerName}#${haxballId} → ${player.identityId} (total: ${stats.assists})`);
      } else {
        this.logger.warn(`No stats found for identityId: ${player.identityId} (haxballId: ${haxballId})`);
      }
    } else {
      this.logger.warn(`No player found in cache for haxballId: ${haxballId}`);
    }
  }

  /**
   * Registra un gol en contra usando haxballId
   */
  public recordOwnGoal(haxballId: number): void {
    const player = this.playerCache.getPlayerByHaxballId(haxballId);
    if (player) {
      const stats = this.matchStats.get(player.identityId);
      if (stats) {
        stats.ownGoals++;
        this.logger.debug(`Own goal recorded for ${stats.playerName}#${haxballId} → ${player.identityId} (total: ${stats.ownGoals})`);
      } else {
        this.logger.warn(`No stats found for identityId: ${player.identityId} (haxballId: ${haxballId})`);
      }
    } else {
      this.logger.warn(`No player found in cache for haxballId: ${haxballId}`);
    }
  }

  /**
   * Registra un toque del balón usando haxballId
   */
  public recordBallTouch(haxballId: number): void {
    const player = this.playerCache.getPlayerByHaxballId(haxballId);
    if (player) {
      let stats = this.matchStats.get(player.identityId);
      if (!stats) {
        // Auto-initialize if not found
        this.matchStats.set(player.identityId, {
          haxballId,
          identityId: player.identityId,
          playerName: player.name,
          goals: 0,
          assists: 0,
          ownGoals: 0,
          saves: 0,
          ballTouches: 0
        });
        stats = this.matchStats.get(player.identityId)!;
      }
      stats.ballTouches++;
      // No log para evitar spam
    }
  }

  /**
   * Inicia el tracking del partido
   */
  public startMatch(): void {
    this.matchStartTime = new Date();
    this.logger.info('Match stats tracking started');
  }

  /**
   * Finaliza el partido y guarda estadísticas en BD
   */
  public async endMatch(): Promise<void> {
    if (!this.matchStartTime) {
      this.logger.warn('Match was not started, skipping stats save');
      return;
    }

    try {
      // Guardar estadísticas de cada jugador en la BD
      for (const [identityId, stats] of this.matchStats) {
        await this.savePlayerStats(stats);
      }

      this.logger.info(`Match stats saved for ${this.matchStats.size} players`);
      
      // Limpiar cache
      this.clearCache();
      
    } catch (error) {
      this.logger.error('Failed to save match stats', error);
    }
  }

  /**
   * Guarda las estadísticas de un jugador en la BD
   */
  private async savePlayerStats(stats: PlayerMatchStats): Promise<void> {
    try {
      // Actualizar estadísticas acumuladas usando el identityId directamente
      const result = await db.playerStats.upsert({
        where: {
          ruid_playerId: { ruid: this.ruid, playerId: stats.identityId }
        },
        update: {
          goals: { increment: stats.goals },
          assists: { increment: stats.assists },
          ogs: { increment: stats.ownGoals },
          balltouch: { increment: stats.ballTouches },
          totals: { increment: 1 }
        },
        create: {
          ruid: this.ruid,
          playerId: stats.identityId,
          goals: stats.goals,
          assists: stats.assists,
          ogs: stats.ownGoals,
          balltouch: stats.ballTouches,
          totals: 1
        }
      });

      this.logger.info(`📊 STATS SAVED: ${stats.playerName}#${stats.haxballId} → ${stats.identityId}`);
      this.logger.info(`   Match: ${stats.goals}G ${stats.assists}A ${stats.ownGoals}OG ${stats.ballTouches}T`);
      this.logger.info(`   Total: ${result.goals}G ${result.assists}A ${result.ogs}OG ${result.balltouch}T (${result.totals} matches)`);
      this.logger.info(`   RUID: ${this.ruid}`);
      
    } catch (error) {
      this.logger.error(`Failed to save stats for ${stats.playerName}`, error);
    }
  }

  /**
   * Obtiene las estadísticas actuales de un jugador por haxballId
   */
  public getPlayerStats(haxballId: number): PlayerMatchStats | null {
    const player = this.playerCache.getPlayerByHaxballId(haxballId);
    return player ? this.matchStats.get(player.identityId) || null : null;
  }

  /**
   * Obtiene todas las estadísticas del partido
   */
  public getAllStats(): PlayerMatchStats[] {
    return Array.from(this.matchStats.values());
  }

  /**
   * Limpia el cache de estadísticas
   */
  public clearCache(): void {
    this.matchStats.clear();
    this.matchStartTime = null;
    this.logger.debug('Match stats cache cleared');
  }

  /**
   * Verifica si el partido está activo
   */
  public isMatchActive(): boolean {
    return this.matchStartTime !== null;
  }

  /**
   * Obtiene el identityId de un jugador por su haxballId
   */
  public getIdentityId(haxballId: number): string | undefined {
    const player = this.playerCache.getPlayerByHaxballId(haxballId);
    return player?.identityId;
  }

  /**
   * Obtiene el estado del mapeo para debugging
   */
  public getMappingState(): { haxballId: number; identityId: string; playerName: string }[] {
    return this.playerCache.getAllMappings();
  }
}