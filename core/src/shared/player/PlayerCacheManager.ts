import { createLogger } from '../logger/Logger';
import { AfkCommand } from '../../chat-manager/commands/handlers/AfkCommand';

export interface SanctionInfo {
  id: string;
  type: 'ban' | 'mute';
  reason?: string;
  duration: number;
  isActive: boolean;
  createdAt: Date;
  expiresAt?: Date;
  adminAuth?: string;
  adminName?: string;
}

export interface CachedPlayer {
  // Datos de Haxball (tiempo real)
  haxballId: number;
  name: string;
  team: number;
  auth?: string;
  conn: string;
  admin: boolean;
  
  // Datos de BD (persistentes)
  identityId: string;
  
  // Estados especiales
  isAfk: boolean;
  isMuted: boolean;
  muteInfo?: SanctionInfo;
  
  // Metadatos
  lastUpdate: number;
}

/**
 * Gestor unificado de cache de jugadores
 * Única fuente de verdad para BalanceManager, MatchStatsManager y SanctionManager
 */
export class PlayerCacheManager {
  private static instance: PlayerCacheManager;
  private logger = createLogger('PlayerCache');
  private players: Map<number, CachedPlayer> = new Map(); // Key: haxballId
  private identityToHaxball: Map<string, number> = new Map(); // Key: identityId
  private haxballRoom: any = null;
  private lastGlobalUpdate = 0;
  private loggedWarnings = new Set<string>(); // Track already logged warnings

  private constructor() {}

  public static getInstance(): PlayerCacheManager {
    if (!PlayerCacheManager.instance) {
      PlayerCacheManager.instance = new PlayerCacheManager();
    }
    return PlayerCacheManager.instance;
  }

  public setHaxballRoom(room: any): void {
    this.haxballRoom = room;
  }

  /**
   * MÉTODOS PARA BALANCEMANAGER
   */
  public getActivePlayers(): CachedPlayer[] {
    return Array.from(this.players.values()).filter(p => !p.isAfk);
  }

  public getAllPlayers(): CachedPlayer[] {
    return Array.from(this.players.values());
  }

  /** Comprueba si otro jugador en sala ya usa el mismo nick (case-insensitive). */
  public isNicknameTaken(name: string, excludeHaxballId?: number): boolean {
    const normalized = name.trim().toLowerCase();
    for (const p of this.players.values()) {
      if (excludeHaxballId !== undefined && p.haxballId === excludeHaxballId) continue;
      if (p.name.trim().toLowerCase() === normalized) return true;
    }
    return false;
  }

  public getPlayersInTeam(team: number): CachedPlayer[] {
    return Array.from(this.players.values()).filter(p => p.team === team && !p.isAfk);
  }

  public getActiveTeamCounts(): { red: number; blue: number } {
    const activePlayers = this.getActivePlayers();
    return {
      red: activePlayers.filter(p => p.team === 1).length,
      blue: activePlayers.filter(p => p.team === 2).length
    };
  }

  /**
   * MÉTODOS PARA MATCHSTATSMANAGER
   */
  public getPlayerByHaxballId(haxballId: number): CachedPlayer | null {
    return this.players.get(haxballId) || null;
  }

  public getPlayerByIdentityId(identityId: string): CachedPlayer | null {
    // Con identityId duplicados, devolver el último mapeado
    const haxballId = this.identityToHaxball.get(identityId);
    return haxballId ? this.players.get(haxballId) || null : null;
  }
  
  public getAllPlayersByIdentityId(identityId: string): CachedPlayer[] {
    // Devolver TODOS los jugadores con el mismo identityId
    const players: CachedPlayer[] = [];
    for (const player of this.players.values()) {
      if (player.identityId === identityId) {
        players.push(player);
      }
    }
    return players;
  }

  public getAllMappings(): { haxballId: number; identityId: string; playerName: string }[] {
    return Array.from(this.players.values()).map(p => ({
      haxballId: p.haxballId,
      identityId: p.identityId,
      playerName: p.name
    }));
  }

  /**
   * MÉTODOS PARA SANCTIONMANAGER
   */
  public isPlayerMuted(haxballId: number): SanctionInfo | null {
    const player = this.players.get(haxballId);
    if (!player || !player.isMuted || !player.muteInfo) return null;

    // Verificar si el mute expiró
    if (player.muteInfo.expiresAt && player.muteInfo.expiresAt <= new Date()) {
      this.updateMuteStatus(haxballId, null);
      return null;
    }

    return player.muteInfo;
  }

  public updateMuteStatus(haxballId: number, muteInfo: SanctionInfo | null): void {
    const player = this.players.get(haxballId);
    if (player) {
      player.isMuted = !!muteInfo;
      player.muteInfo = muteInfo || undefined;
      player.lastUpdate = Date.now();
      
      this.logger.debug(`Mute status updated for ${player.name}#${haxballId}`, {
        isMuted: player.isMuted,
        muteExpires: muteInfo?.expiresAt
      });
    }
  }

  /**
   * ACTUALIZACIÓN CENTRALIZADA
   */
  public async updatePlayer(haxballId: number, updates: Partial<CachedPlayer>): Promise<void> {
    // REGLA CRÍTICA: Nunca permitir duplicar haxballId
    if (this.players.has(haxballId)) {
      // Actualizar jugador existente
      const existing = this.players.get(haxballId)!;
      const updated = { ...existing, ...updates, lastUpdate: Date.now() };
      
      // Verificar si cambió el identityId
      if (updates.identityId && updates.identityId !== existing.identityId) {
        // Actualizar mapeo inverso
        this.identityToHaxball.delete(existing.identityId);
        this.identityToHaxball.set(updates.identityId, haxballId);
      }
      
      this.players.set(haxballId, updated);
      this.logger.debug(`Player updated: ${updated.name}#${haxballId}`, updates);
      
    } else if (updates.identityId) {
      // Crear nuevo jugador
      const newPlayer: CachedPlayer = {
        haxballId,
        name: updates.name || 'Unknown',
        team: updates.team || 0,
        auth: updates.auth,
        conn: updates.conn || '',
        admin: updates.admin || false,
        identityId: updates.identityId,
        isAfk: updates.isAfk || AfkCommand.isPlayerAfk(haxballId),
        isMuted: updates.isMuted || false,
        muteInfo: updates.muteInfo,
        lastUpdate: Date.now()
      };
      
      // Verificar si ya existe otro jugador con el mismo identityId
      const existingWithSameIdentity = this.identityToHaxball.get(updates.identityId);
      if (existingWithSameIdentity && existingWithSameIdentity !== haxballId) {
        const existingPlayer = this.players.get(existingWithSameIdentity);
        this.logger.warn(`⚠️ DUPLICATE IDENTITY: Player ${newPlayer.name}#${haxballId} has same identityId as ${existingPlayer?.name}#${existingWithSameIdentity}`, {
          newPlayer: { name: newPlayer.name, haxballId },
          existingPlayer: { name: existingPlayer?.name, haxballId: existingWithSameIdentity },
          identityId: updates.identityId
        });
      }
      
      this.players.set(haxballId, newPlayer);
      // Actualizar mapeo (el último gana)
      this.identityToHaxball.set(newPlayer.identityId, haxballId);
      
      this.logger.info(`Player cached: ${newPlayer.name}#${haxballId} → ${newPlayer.identityId}`);
    }
  }

  public removePlayer(haxballId: number): void {
    const player = this.players.get(haxballId);
    if (player) {
      this.players.delete(haxballId);
      this.identityToHaxball.delete(player.identityId);
      
      this.logger.debug(`Player removed from cache: ${player.name}#${haxballId}`);
    }
  }

  public async forceRefresh(): Promise<void> {
    if (!this.haxballRoom) return;

    try {
      const realPlayers = await this.haxballRoom.getCurrentPlayers();
      const now = Date.now();
      
      // Marcar todos como obsoletos
      const existingIds = new Set(this.players.keys());
      
      // Actualizar/agregar jugadores actuales
      for (const realPlayer of realPlayers) {
        const cached = this.players.get(realPlayer.id);
        
        if (cached) {
          // Actualizar datos de Haxball
          cached.name = realPlayer.name;
          cached.team = realPlayer.team;
          cached.auth = realPlayer.auth;
          cached.conn = realPlayer.conn;
          cached.admin = realPlayer.admin;
          cached.isAfk = AfkCommand.isPlayerAfk(realPlayer.id);
          cached.lastUpdate = now;
          
          existingIds.delete(realPlayer.id);
        } else {
          const warningKey = `MISSING_IDENTITY_${realPlayer.id}_${realPlayer.name}`;
          if (!this.loggedWarnings.has(warningKey)) {
            this.loggedWarnings.add(warningKey);
            this.logger.warn(`Player ${realPlayer.name}#${realPlayer.id} in room but not in cache - needs identity`);
          }
        }
      }
      
      // Remover jugadores que ya no están
      for (const obsoleteId of existingIds) {
        this.removePlayer(obsoleteId);
      }
      
      this.lastGlobalUpdate = now;
      this.logger.debug(`Cache refreshed: ${this.players.size} players`);
      
    } catch (error) {
      this.logger.error('Failed to refresh cache', error);
    }
  }

  /**
   * MÉTODOS DE DEBUG Y ESTADO
   */
  public getStats(): any {
    const activePlayers = this.getActivePlayers();
    const teamCounts = this.getActiveTeamCounts();
    
    return {
      totalCached: this.players.size,
      activePlayers: activePlayers.length,
      afkPlayers: this.players.size - activePlayers.length,
      teamCounts,
      lastGlobalUpdate: new Date(this.lastGlobalUpdate).toISOString(),
      mappings: this.getAllMappings()
    };
  }

  public validateConsistency(): { isConsistent: boolean; issues: string[] } {
    const issues: string[] = [];
    const warnings: string[] = [];
    
    // CRÍTICO: Verificar haxballId duplicados (NUNCA permitido)
    const haxballIds = new Set<number>();
    for (const [haxballId, player] of this.players) {
      if (haxballIds.has(haxballId)) {
        issues.push(`CRITICAL_DUPLICATE_HAXBALL_ID: Multiple players with haxballId ${haxballId}`);
      }
      haxballIds.add(haxballId);
    }
    
    // WARN: Verificar identityId duplicados (permitido pero advertir)
    const identityGroups = new Map<string, number[]>();
    for (const [haxballId, player] of this.players) {
      if (!identityGroups.has(player.identityId)) {
        identityGroups.set(player.identityId, []);
      }
      identityGroups.get(player.identityId)!.push(haxballId);
    }
    
    for (const [identityId, haxballIds] of identityGroups) {
      if (haxballIds.length > 1) {
        const playerNames = haxballIds.map(id => {
          const player = this.players.get(id);
          return `${player?.name}#${id}`;
        }).join(', ');
        warnings.push(`DUPLICATE_IDENTITY: Identity ${identityId} shared by: ${playerNames}`);
      }
    }
    
    // Verificar mapeo inverso
    for (const [identityId, haxballId] of this.identityToHaxball) {
      const player = this.players.get(haxballId);
      if (!player) {
        issues.push(`ORPHAN_MAPPING: Identity ${identityId} maps to haxballId ${haxballId} but no player exists`);
      } else if (player.identityId !== identityId) {
        issues.push(`REVERSE_MAPPING: HaxballId ${haxballId} maps to identity ${identityId} but player has identity ${player.identityId}`);
      }
    }
    
    // Verificar estados AFK
    for (const [haxballId, player] of this.players) {
      const realAfkStatus = AfkCommand.isPlayerAfk(haxballId);
      if (player.isAfk !== realAfkStatus) {
        issues.push(`AFK_STATUS: Player ${player.name}#${haxballId} cached_afk=${player.isAfk} real_afk=${realAfkStatus} team=${player.team}`);
      }
    }
    
    // Verificar jugadores sin identityId
    for (const [haxballId, player] of this.players) {
      if (!player.identityId || player.identityId.trim() === '') {
        issues.push(`MISSING_IDENTITY: Player ${player.name}#${haxballId} has no identityId`);
      }
    }
    
    // Log warnings separately (only new ones)
    if (warnings.length > 0) {
      const newWarnings = warnings.filter(w => !this.loggedWarnings.has(w));
      if (newWarnings.length > 0) {
        newWarnings.forEach(w => this.loggedWarnings.add(w));
        this.logger.warn(`Cache warnings (${newWarnings.length} new):`, newWarnings);
      }
    }
    
    return {
      isConsistent: issues.length === 0,
      issues: [...issues, ...warnings.map(w => `WARN: ${w}`)]
    };
  }

  public cleanup(): void {
    this.players.clear();
    this.identityToHaxball.clear();
    this.loggedWarnings.clear();
    this.haxballRoom = null;
    this.logger.debug('PlayerCacheManager cleaned up');
  }
}