import { createLogger } from '../logger/Logger';

interface BallTouch {
  playerId: number;
  playerName: string;
  team: number;
  timestamp: number;
}

/**
 * Sistema de tracking de toques del balón para determinar goleador y asistente
 * Basado en el ballStack del haxbotron viejo
 */
export class BallTracker {
  private logger = createLogger('BallTracker');
  private ballStack: BallTouch[] = [];
  private readonly MAX_STACK_SIZE = 10;
  private readonly ASSIST_TIME_LIMIT = 10000; // 10 segundos

  /**
   * Registra un toque del balón
   */
  public recordBallTouch(playerId: number, playerName: string, team: number): void {
    const touch: BallTouch = {
      playerId,
      playerName,
      team,
      timestamp: Date.now()
    };

    // Agregar al inicio del stack
    this.ballStack.unshift(touch);

    // Mantener tamaño máximo
    if (this.ballStack.length > this.MAX_STACK_SIZE) {
      this.ballStack = this.ballStack.slice(0, this.MAX_STACK_SIZE);
    }

    this.logger.debug(`Ball touch recorded: ${playerName}#${playerId} (team ${team})`);
  }

  /**
   * Determina goleador y asistente basado en el último gol
   */
  public getGoalData(scoringTeam: number): { scorer: BallTouch | null; assist: BallTouch | null } {
    if (this.ballStack.length === 0) {
      return { scorer: null, assist: null };
    }

    // Filtrar solo toques del equipo que anotó
    const teamTouches = this.ballStack.filter(touch => touch.team === scoringTeam);

    if (teamTouches.length === 0) {
      return { scorer: null, assist: null };
    }

    // El goleador es el último toque del equipo
    const scorer = teamTouches[0];
    let assist: BallTouch | null = null;

    // Buscar asistente (penúltimo toque del mismo equipo, dentro del tiempo límite)
    if (teamTouches.length > 1) {
      const potentialAssist = teamTouches[1];
      
      // Verificar que sea diferente jugador y dentro del tiempo límite
      if (potentialAssist.playerId !== scorer.playerId && 
          (scorer.timestamp - potentialAssist.timestamp) <= this.ASSIST_TIME_LIMIT) {
        assist = potentialAssist;
      }
    }

    this.logger.info(`Goal data determined - Scorer: ${scorer.playerName}#${scorer.playerId}${assist ? `, Assist: ${assist.playerName}#${assist.playerId}` : ''}`);

    return { scorer, assist };
  }

  /**
   * Limpia el stack (usar al final del juego)
   */
  public clear(): void {
    this.ballStack = [];
    this.logger.debug('Ball stack cleared');
  }

  /**
   * Obtiene el estado actual del stack para debug
   */
  public getStackState(): BallTouch[] {
    return [...this.ballStack];
  }
}