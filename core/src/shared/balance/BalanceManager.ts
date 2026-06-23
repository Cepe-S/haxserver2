import { createLogger } from '../logger/Logger';
import { eventBus } from '../events/EventBus';
import { ChatManager } from '../../chat-manager/ChatManager';
import { PlayerCacheManager } from '../player/PlayerCacheManager';
import { AfkCommand } from '../../chat-manager/commands/handlers/AfkCommand';

export enum BalanceMode {
  JT = "jt",
  PRO = "pro"
}

export interface BalanceConfig {
  mode: BalanceMode;
  maxPlayersPerTeam: number;
  enabled: boolean;
}

export interface BalanceAction {
  timestamp: number;
  action: string;
  playerId: number;
  playerName: string;
  fromTeam: number;
  toTeam: number;
  reason: string;
  mode: BalanceMode;
  redCount: number;
  blueCount: number;
  queueLength?: number;
}

export interface QueueEntry {
  playerId: number;
  playerAuth: string;
  playerName: string;
  joinTime: number;
  rating: number;
}

export class BalanceManager {
  private logger = createLogger('BALANCE');
  private config: BalanceConfig;
  private queue: QueueEntry[] = [];
  private actions: BalanceAction[] = [];
  private isProcessing = false;
  private ruid: string;
  private haxballRoom: any = null;
  private playerCache = PlayerCacheManager.getInstance();
  private chatManager: ChatManager | null = null;
  // JT rebalance cooldown to avoid immediate repeated attempts when AFK players block moves
  private lastJTAttempt = 0;
  private jtCooldownMs = 5000; // 5 seconds default cooldown

  constructor(ruid: string, config: BalanceConfig, chatManager?: ChatManager) {
    this.ruid = ruid;
    this.config = config;
    this.chatManager = chatManager || null;
    this.setupEventListeners();
  }

  public setHaxballRoom(room: any): void {
    this.haxballRoom = room;
    this.playerCache.setHaxballRoom(room);
  }

  private setupEventListeners(): void {
    eventBus.onEvent('haxball.player.join', async (event) => {
      await this.onPlayerJoin(event.player);
    });

    eventBus.onEvent('haxball.player.leave', async (event) => {
      await this.onPlayerLeave(event.player.id);
    });

    eventBus.onEvent('haxball.player.teamChange', async (event) => {
      await this.onPlayerTeamChange(event.player, event.newTeam);
    });

    eventBus.onEvent('player.afk.set', (event) => {
      this.onPlayerAfkSet(event);
    });

    eventBus.onEvent('player.afk.unset', (event) => {
      this.onPlayerAfkUnset(event);
    });
  }

  public setConfig(newConfig: Partial<BalanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logAction(
      "CONFIG_CHANGE",
      0,
      "System",
      0,
      0,
      `Mode: ${this.config.mode}, MaxPerTeam: ${this.config.maxPlayersPerTeam}, Enabled: ${this.config.enabled}`
    );
  }

  public getConfig(): BalanceConfig {
    return { ...this.config };
  }

  public async onPlayerJoin(player: any): Promise<void> {
    if (!this.config.enabled || this.isProcessing) return;

    this.isProcessing = true;
    
    try {
      await this.updatePlayerCache();
      const counts = this.getTeamCounts();
      
      if (this.config.mode === BalanceMode.JT) {
        await this.handleJTMode(player, counts.red, counts.blue);
      } else {
        await this.handlePROMode(player, counts.red, counts.blue);
      }

      // Emitir evento de cambio de jugadores para el GameLoopController
      eventBus.emitEvent('player.count.changed', {
        count: counts.red + counts.blue,
        red: counts.red,
        blue: counts.blue,
        timestamp: Date.now()
      });
      
      // Verificar desbalances después de que se una un jugador
      setTimeout(async () => {
        await this.checkAndFixTeamImbalance();
      }, 200);
      
    } finally {
      this.isProcessing = false;
    }
  }

  public async onPlayerLeave(playerId: number): Promise<void> {
    if (!this.config.enabled) return;

    this.queue = this.queue.filter(entry => entry.playerId !== playerId);

    this.logAction(
      "PLAYER_LEAVE",
      playerId,
      `Player#${playerId}`,
      0,
      0,
      "Player disconnected"
    );

    await this.triggerRebalanceAfterLeave();
    await this.checkAndFixTeamImbalance();
    
    // Emitir evento de cambio de jugadores
    await this.updatePlayerCache();
    const counts = this.getTeamCounts();
    eventBus.emitEvent('player.count.changed', {
      count: counts.red + counts.blue,
      red: counts.red,
      blue: counts.blue,
      timestamp: Date.now()
    });
  }

  public async onPlayerTeamChange(player: any, newTeam: number): Promise<void> {
    if (!this.config.enabled) return;

    this.logger.debug('🔄 PlayerTeamChange event - updating cache', {
      playerId: player.id,
      playerName: player.name,
      newTeam
    });

    // Actualizar cache unificado - ÚNICO PUNTO DE ACTUALIZACIÓN
    await this.playerCache.updatePlayer(player.id, {
      name: player.name,
      team: newTeam,
      auth: player.auth,
      conn: player.conn,
      admin: player.admin
    });
    
    const counts = this.getTeamCounts();
    
    this.logger.debug('Cache updated after team change', {
      playerId: player.id,
      newTeam,
      redCount: counts.red,
      blueCount: counts.blue
    });
    
    if (this.config.mode === BalanceMode.PRO && newTeam !== 0) {
      const wouldCreateImbalance = newTeam === 1 ? 
        counts.red > counts.blue + 1 : counts.blue > counts.red + 1;
        
      if (counts[newTeam === 1 ? 'red' : 'blue'] > this.config.maxPlayersPerTeam || wouldCreateImbalance) {
        // Move back to spectators and add to queue
        await this.movePlayerToTeam(player.id, 0);
        this.addToQueue(player);
        
        this.logAction(
          "TEAM_CHANGE_BLOCKED",
          player.id,
          player.name,
          newTeam,
          0,
          "Team full or would create imbalance"
        );
        return;
      }
    }
    
    // Verificar inmediatamente si hay desbalance y corregir
    await this.checkAndFixTeamImbalance();
  }

  private async handleJTMode(player: any, redCount: number, blueCount: number): Promise<void> {
    let targetTeam: number;
    
    if (redCount < blueCount) {
      targetTeam = 1; // Red
    } else if (blueCount < redCount) {
      targetTeam = 2; // Blue
    } else {
      // Teams are equal, assign to random team if both have space
      if (redCount < this.config.maxPlayersPerTeam) {
        targetTeam = Math.random() < 0.5 ? 1 : 2;
      } else {
        return; // Both teams are full
      }
    }
    
    // Final validation before assignment
    await this.updatePlayerCache();
    const currentCounts = this.getTeamCounts();
    if (currentCounts[targetTeam === 1 ? 'red' : 'blue'] >= this.config.maxPlayersPerTeam) {
      return;
    }
    
    const moveSuccessful = await this.movePlayerToTeam(player.id, targetTeam);
    
    if (moveSuccessful) {
      this.logAction(
        "JT_ASSIGN",
        player.id,
        player.name,
        0,
        targetTeam,
        `Assigned to ${targetTeam === 1 ? 'Red' : 'Blue'}`
      );
    } else {
      this.logger.warn(`Failed to assign player ${player.name}#${player.id} to team ${targetTeam} in JT mode`);
    }
  }

  private async handlePROMode(player: any, redCount: number, blueCount: number): Promise<void> {
    const totalPlayers = redCount + blueCount;
    const maxTotal = this.config.maxPlayersPerTeam * 2;
    const isBalanced = Math.abs(redCount - blueCount) <= 1;
    const hasSpace = totalPlayers < maxTotal;

    if (hasSpace && isBalanced && redCount < this.config.maxPlayersPerTeam && blueCount < this.config.maxPlayersPerTeam) {
      const targetTeam = redCount <= blueCount ? 1 : 2;
      
      // Final validation
      await this.updatePlayerCache();
      const currentCounts = this.getTeamCounts();
      if (currentCounts[targetTeam === 1 ? 'red' : 'blue'] < this.config.maxPlayersPerTeam) {
        const moveSuccessful = await this.movePlayerToTeam(player.id, targetTeam);
        
        if (moveSuccessful) {
          this.logAction(
            "PRO_ASSIGN",
            player.id,
            player.name,
            0,
            targetTeam,
            "Direct assignment (balanced)"
          );
          return;
        } else {
          this.logger.warn(`Failed to assign player ${player.name}#${player.id} to team ${targetTeam} in PRO mode - adding to queue`);
        }
      }
    }
    
    this.addToQueue(player);
    
    this.logAction(
      "PRO_QUEUE",
      player.id,
      player.name,
      0,
      0,
      "Added to queue"
    );
  }

  private addToQueue(player: any): void {
    // Remove if already in queue
    this.queue = this.queue.filter(entry => entry.playerId !== player.id);
    
    // Add to queue
    this.queue.push({
      playerId: player.id,
      playerAuth: player.auth || 'unknown',
      playerName: player.name,
      joinTime: Date.now(),
      rating: 1000 // TODO: Get real rating from database
    });
  }

  private async triggerRebalanceAfterLeave(): Promise<void> {
    if (this.config.mode === BalanceMode.PRO) {
      await this.rebalanceFromQueue();
    } else if (this.config.mode === BalanceMode.JT) {
      await this.updatePlayerCache();
      const counts = this.getTeamCounts();
      if (Math.abs(counts.red - counts.blue) > 1) {
        // Respect cooldown to avoid repeated immediate JT attempts
        const now = Date.now();
        if (now - this.lastJTAttempt < this.jtCooldownMs) {
          this.logger.debug('Skipping JT rebalance due to cooldown', { since: now - this.lastJTAttempt });
          return;
        }

        await this.forceJTBalance();
      }
    }
  }

  private async rebalanceFromQueue(): Promise<void> {
    if (this.config.mode !== BalanceMode.PRO || this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    
    try {
      await this.updatePlayerCache();
      const counts = this.getTeamCounts();
      const isBalanced = Math.abs(counts.red - counts.blue) <= 1;
      const hasSpace = counts.red < this.config.maxPlayersPerTeam || counts.blue < this.config.maxPlayersPerTeam;
      
      if (isBalanced && hasSpace) {
        const nextPlayer = this.queue.shift();
        if (nextPlayer) {
          const targetTeam = counts.red <= counts.blue ? 1 : 2;
          
          if (counts[targetTeam === 1 ? 'red' : 'blue'] < this.config.maxPlayersPerTeam) {
            const moveSuccessful = await this.movePlayerToTeam(nextPlayer.playerId, targetTeam);
            
            if (moveSuccessful) {
              // Anunciar balanceo desde cola solo si el movimiento fue exitoso
              if (this.chatManager) {
                await this.chatManager.sendBalance({ id: nextPlayer.playerId, name: nextPlayer.playerName }, 0, targetTeam);
              }
              
              this.logAction(
                "PRO_REBALANCE",
                nextPlayer.playerId,
                nextPlayer.playerName,
                0,
                targetTeam,
                "Moved from queue"
              );
            } else {
              // Si el movimiento falló, devolver el jugador a la cola
              this.queue.unshift(nextPlayer);
              this.logger.warn(`Failed to move player ${nextPlayer.playerName}#${nextPlayer.playerId} from queue`, {
                playerId: nextPlayer.playerId,
                targetTeam
              });
            }
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async forceJTBalance(): Promise<void> {
    // mark attempt time to prevent immediate retries if this run can't fully fix imbalance
    this.lastJTAttempt = Date.now();

    await this.updatePlayerCache();
    const counts = this.getTeamCounts();
    const difference = Math.abs(counts.red - counts.blue);
    
    if (difference <= 1) {
      this.logger.debug('JT teams already balanced, no action needed');
      return;
    }
    
    const biggerTeam = counts.red > counts.blue ? 1 : 2;
    const smallerTeam = counts.red > counts.blue ? 2 : 1;
    const playersToMove = Math.floor(difference / 2); // Mover la mitad del exceso
    
    // Get players from bigger team
    const playersInBiggerTeam = this.getPlayersInTeam(biggerTeam);
    
    this.logger.info(`🔄 JT Balance: Moving ${playersToMove} players from team ${biggerTeam} to team ${smallerTeam}`);
    
    let movedCount = 0;
    for (let i = 0; movedCount < playersToMove && i < playersInBiggerTeam.length; i++) {
      const playerToMove = playersInBiggerTeam[playersInBiggerTeam.length - 1 - i];
      
      // ✅ VALIDAR SI EL JUGADOR ESTÁ AFK
      if (AfkCommand.isPlayerAfk(playerToMove.haxballId)) {
        this.logger.debug(`Skipping AFK player ${playerToMove.name}#${playerToMove.haxballId} for JT balance`);
        continue; // Saltar este jugador y continuar con el siguiente
      }
      
      // Intentar mover el jugador - solo anunciar si el movimiento fue exitoso
      const moveSuccessful = await this.movePlayerToTeam(playerToMove.haxballId, smallerTeam);
      
      if (moveSuccessful) {
        // Anunciar balanceo solo si el movimiento fue exitoso
        if (this.chatManager) {
          await this.chatManager.sendBalance({ id: playerToMove.haxballId, name: playerToMove.name }, biggerTeam, smallerTeam);
        }
        
        this.logAction(
          "JT_REBALANCE",
          playerToMove.haxballId,
          playerToMove.name,
          biggerTeam,
          smallerTeam,
          `Auto-moved to balance teams (${counts.red}v${counts.blue})`
        );
        
        movedCount++; // Solo incrementar cuando realmente movemos un jugador
        
        // Pequeño delay entre movimientos
        if (movedCount < playersToMove) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } else {
        this.logger.warn(`Failed to move player ${playerToMove.name}#${playerToMove.haxballId} - skipping`, {
          playerId: playerToMove.haxballId,
          targetTeam: smallerTeam
        });
      }
    }
    
    if (movedCount < playersToMove) {
      this.logger.warn(`JT Balance: Only moved ${movedCount}/${playersToMove} players (some were AFK)`, {
        biggerTeam,
        totalPlayersInTeam: playersInBiggerTeam.length,
        targetMoves: playersToMove,
        actualMoves: movedCount
      });
      // If we couldn't move enough players, set a short cooldown before next JT attempt
      this.lastJTAttempt = Date.now();
    }
  }

  /**
   * Verifica y corrige automáticamente desbalances de equipos (2+ jugadores de diferencia)
   */
  public async checkAndFixTeamImbalance(): Promise<void> {
    // Forzar actualización del cache para tener datos frescos
    await this.updatePlayerCache();
    const counts = this.getTeamCounts();
    const difference = Math.abs(counts.red - counts.blue);
    const totalPlayers = counts.red + counts.blue;
    
    // Actuar si hay desbalance de 2+ jugadores (sin mínimo de jugadores para ser más agresivo)
    if (difference >= 2) {
      this.logger.warn('Team imbalance detected - auto-fixing', { 
        red: counts.red, 
        blue: counts.blue, 
        difference 
      });
      
      // Prevenir procesamiento concurrente solo durante la corrección
      if (this.isProcessing) {
        return;
      }
      
      this.isProcessing = true;
      
      try {
        if (this.config.mode === BalanceMode.JT) {
          // Respect cooldown to avoid repeated JT attempts when previous run couldn't fully fix
          const now = Date.now();
          if (now - this.lastJTAttempt < this.jtCooldownMs) {
            this.logger.debug('Skipping JT rebalance in checkAndFixTeamImbalance due to cooldown', { since: now - this.lastJTAttempt });
          } else {
            await this.forceJTBalance();
          }
        } else if (this.config.mode === BalanceMode.PRO) {
          await this.fixPROImbalance(counts);
        }
        
        // Verificar resultado
        await this.updatePlayerCache();
        const newCounts = this.getTeamCounts();
        const newDifference = Math.abs(newCounts.red - newCounts.blue);
        
        if (newDifference < difference) {
          this.logger.success('Balance corrected', { 
            before: `${counts.red}v${counts.blue}`, 
            after: `${newCounts.red}v${newCounts.blue}` 
          });
        } else {
          this.logger.warn('Balance correction may have failed', { 
            before: `${counts.red}v${counts.blue}`, 
            after: `${newCounts.red}v${newCounts.blue}` 
          });
        }
      } finally {
        this.isProcessing = false;
      }
    }
  }

  /**
   * Corrige desbalances en modo PRO moviendo jugadores del equipo más grande a espectadores
   */
  private async fixPROImbalance(counts: { red: number; blue: number }): Promise<void> {
    const difference = Math.abs(counts.red - counts.blue);
    const biggerTeam = counts.red > counts.blue ? 1 : 2;
    const playersToMove = Math.floor(difference / 2); // Mover la mitad del exceso
    
    const playersInBiggerTeam = this.getPlayersInTeam(biggerTeam);
    
    this.logger.info(`🔄 PRO imbalance fix: moving ${playersToMove} players from team ${biggerTeam} to queue`);
    
    let movedCount = 0;
    for (let i = 0; movedCount < playersToMove && i < playersInBiggerTeam.length; i++) {
      const playerToMove = playersInBiggerTeam[playersInBiggerTeam.length - 1 - i];
      
      // ✅ VALIDAR SI EL JUGADOR ESTÁ AFK
      if (AfkCommand.isPlayerAfk(playerToMove.haxballId)) {
        this.logger.debug(`Skipping AFK player ${playerToMove.name}#${playerToMove.haxballId} for PRO balance`);
        continue; // Saltar este jugador y continuar con el siguiente
      }
      
      // Intentar mover a espectadores - solo continuar si el movimiento fue exitoso
      const moveSuccessful = await this.movePlayerToTeam(playerToMove.haxballId, 0);
      
      if (moveSuccessful) {
        this.addToQueue({ id: playerToMove.haxballId, name: playerToMove.name, auth: playerToMove.auth, conn: playerToMove.conn });
        
        // Anunciar balanceo solo si el movimiento fue exitoso
        if (this.chatManager) {
          await this.chatManager.sendBalance({ id: playerToMove.haxballId, name: playerToMove.name }, biggerTeam, 0);
        }
        
        this.logAction(
          "PRO_IMBALANCE_FIX",
          playerToMove.haxballId,
          playerToMove.name,
          biggerTeam,
          0,
          `Auto-moved to fix imbalance (${counts.red}v${counts.blue})`
        );
        
        movedCount++; // Solo incrementar cuando realmente movemos un jugador
        
        // Pequeño delay entre movimientos
        if (movedCount < playersToMove) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } else {
        this.logger.warn(`Failed to move player ${playerToMove.name}#${playerToMove.haxballId} - skipping`, {
          playerId: playerToMove.haxballId,
          targetTeam: 0
        });
      }
    }
    
    if (movedCount < playersToMove) {
      this.logger.warn(`PRO Balance: Only moved ${movedCount}/${playersToMove} players (some were AFK)`, {
        biggerTeam,
        totalPlayersInTeam: playersInBiggerTeam.length,
        targetMoves: playersToMove,
        actualMoves: movedCount
      });
    }
    
    // Intentar rebalancear desde la cola inmediatamente
    await this.rebalanceFromQueue();
  }

  public async forceBalance(): Promise<void> {
    await this.updatePlayerCache();
    if (this.config.mode === BalanceMode.PRO) {
      await this.rebalanceFromQueue();
    } else if (this.config.mode === BalanceMode.JT) {
      await this.forceJTBalance();
    }
  }

  private getTeamCounts(): { red: number; blue: number } {
    try {
      return this.playerCache.getActiveTeamCounts();
    } catch (error) {
      this.logger.error('Failed to get team counts', error);
      return { red: 0, blue: 0 };
    }
  }

  private getPlayersInTeam(team: number): any[] {
    try {
      return this.playerCache.getPlayersInTeam(team);
    } catch (error) {
      this.logger.error('Failed to get players in team', error);
      return [];
    }
  }

  private async movePlayerToTeam(playerId: number, team: number): Promise<boolean> {
    if (!this.haxballRoom) {
      this.logger.warn('Cannot move player: Haxball room not available');
      return false;
    }

    // ✅ VALIDAR SI EL JUGADOR ESTÁ AFK (excepto si lo movemos a espectador)
    if (team !== 0 && AfkCommand.isPlayerAfk(playerId)) {
      this.logger.warn(`Attempted to move AFK player ${playerId} to team ${team} - skipping`, {
        playerId,
        targetTeam: team,
        isAfk: true
      });
      return false;
    }

    try {
      // Use HaxballRoom method to move player
      await this.haxballRoom.setPlayerTeam(playerId, team);
      
      this.logger.debug(`Moved player ${playerId} to team ${team}`, {
        playerId,
        team,
        wasAfk: AfkCommand.isPlayerAfk(playerId)
      });
      
      return true;
    } catch (error) {
      this.logger.error('Failed to move player to team', error);
      return false;
    }
  }

  private async changeStadium(stadiumName: string): Promise<void> {
    if (!this.haxballRoom) {
      this.logger.warn('Cannot change stadium: Haxball room not available');
      return;
    }

    try {
      // Use HaxballRoom method to change stadium
      await this.haxballRoom.setStadium(stadiumName);
      
      // Settings will be applied by checkStadiumState
      
      this.logger.info(`Changed stadium to ${stadiumName}`);
    } catch (error) {
      this.logger.error('Failed to change stadium', error);
    }
  }

  private logAction(
    action: string,
    playerId: number,
    playerName: string,
    fromTeam: number,
    toTeam: number,
    reason: string
  ): void {
    const counts = this.getTeamCounts();
    
    const balanceAction: BalanceAction = {
      timestamp: Date.now(),
      action,
      playerId,
      playerName,
      fromTeam,
      toTeam,
      reason,
      mode: this.config.mode,
      redCount: counts.red,
      blueCount: counts.blue,
      queueLength: this.queue.length
    };

    this.actions.unshift(balanceAction);
    
    if (this.actions.length > 200) {
      this.actions = this.actions.slice(0, 200);
    }

    this.logger.info(`${action}: ${playerName} (${fromTeam}->${toTeam}) - ${reason} [R:${counts.red} B:${counts.blue} Q:${this.queue.length}]`);
  }

  public getStatus() {
    const counts = this.getTeamCounts();
    return {
      enabled: this.config.enabled,
      mode: this.config.mode,
      teamCounts: {
        red: counts.red,
        blue: counts.blue,
        total: counts.red + counts.blue
      },
      config: this.config,
      debugActions: this.actions.slice(0, 50),
      isProcessing: this.isProcessing,
      queue: this.queue
    };
  }

  public getDebugData() {
    return {
      config: this.config,
      redCount: this.getTeamCounts().red,
      blueCount: this.getTeamCounts().blue,
      queueLength: this.queue.length,
      queue: this.queue,
      recentActions: this.actions.slice(0, 20),
      isProcessing: this.isProcessing
    };
  }

  /**
   * Método legacy - ahora usa PlayerCacheManager
   */
  private async updatePlayerCache(): Promise<void> {
    await this.playerCache.forceRefresh();
  }

  /**
   * Fuerza la actualización del cache de jugadores
   */
  public async forceUpdatePlayerCache(): Promise<void> {
    await this.playerCache.forceRefresh();
  }

  /**
   * Maneja cuando un jugador se pone AFK
   */
  public async onPlayerAfkSet(event: any): Promise<void> {
    this.logger.info(`💤 Player ${event.playerName}#${event.playerId} went AFK from team ${event.previousTeam}`);
    
    this.logAction(
      "PLAYER_AFK_SET",
      event.playerId,
      event.playerName,
      event.previousTeam,
      0,
      `AFK: ${event.reason || 'No reason'}`
    );
    
    this.logger.debug('AFK event received - cache will be updated by onPlayerTeamChange', {
      playerId: event.playerId,
      playerName: event.playerName,
      previousTeam: event.previousTeam
    });
    
    // Cache será actualizado automáticamente por onPlayerTeamChange cuando el jugador se mueva a espectador
    // Verificar si necesitamos rebalancear después de que se actualice el cache
    setTimeout(async () => {
      await this.checkAndFixTeamImbalance();
    }, 500);
  }

  /**
   * Maneja cuando un jugador sale de AFK
   */
  public async onPlayerAfkUnset(event: any): Promise<void> {
    this.logger.info(`🔄 Player ${event.playerName}#${event.playerId} returned from AFK (was team ${event.previousTeam})`);
    
    this.logAction(
      "PLAYER_AFK_UNSET",
      event.playerId,
      event.playerName,
      0,
      0,
      "Returned from AFK - reassigning team"
    );
    
    this.logger.debug('AFK unset event received - cache will be updated by onPlayerTeamChange', {
      playerId: event.playerId,
      playerName: event.playerName,
      previousTeam: event.previousTeam
    });
    
    // Simular que el jugador se unió de nuevo para que el balance lo asigne
    const mockPlayer = {
      id: event.playerId,
      name: event.playerName,
      auth: 'unknown', // No tenemos el auth aquí
      team: 0 // Está en espectadores
    };
    
    // Cache será actualizado automáticamente por onPlayerTeamChange cuando el sistema de balance asigne equipo
    // Usar el sistema de balance normal para asignar equipo
    setTimeout(async () => {
      await this.onPlayerJoin(mockPlayer);
    }, 200);
  }

  /**
   * Valida la consistencia del cache usando PlayerCacheManager
   */
  public async validateCacheConsistency(): Promise<boolean> {
    const validation = this.playerCache.validateConsistency();
    
    if (!validation.isConsistent) {
      this.logger.warn('Cache inconsistency detected!', {
        totalIssues: validation.issues.length,
        issues: validation.issues,
        cacheStats: this.playerCache.getStats()
      });
      
      // Log cada issue individualmente para mejor debugging
      validation.issues.forEach((issue, index) => {
        this.logger.warn(`Cache Issue #${index + 1}: ${issue}`);
      });
      
      // Forzar actualización del cache
      await this.playerCache.forceRefresh();
    }
    
    return validation.isConsistent;
  }

  /**
   * Limpia todos los recursos del BalanceManager
   */
  public cleanup(): void {
    this.haxballRoom = null;
    this.logger.info('BalanceManager cleanup completed', { ruid: this.ruid });
  }
}