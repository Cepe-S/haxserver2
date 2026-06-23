import { createLogger } from '../shared/logger/Logger';
import { STRINGS, interpolateString } from '../shared/strings';
import { SendMessageOptions, ScheduledMessage, COLORS } from './MessageTypes';

/**
 * SISTEMA DE CHAT OPTIMIZADO
 * - Una sola función para enviar mensajes
 * - Scheduler eficiente para mensajes periódicos
 */
export class ChatManager {
  private logger = createLogger('CHAT');
  private haxballRoom: any = null;
  private scheduledMessages: Map<string, ScheduledMessage> = new Map();
  private schedulerInterval: NodeJS.Timeout | null = null;
  private ruid: string;

  constructor(ruid: string) {
    this.ruid = ruid;
    this.startScheduler();
  }

  public setHaxballRoom(room: any): void {
    this.haxballRoom = room;
    this.logger.info('ChatManager connected to HaxballRoom');
  }

  /**
   * FUNCIÓN ÚNICA PARA ENVIAR MENSAJES
   * Maneja todos los casos: individual, múltiple, broadcast, con delay, etc.
   */
  public async send(
    message: string, 
    options: SendMessageOptions = {}
  ): Promise<void> {
    if (!this.haxballRoom) {
      this.logger.warn('Cannot send message: Haxball room not available');
      return;
    }

    const {
      target = null,
      color = COLORS.INFO,
      style = 'normal',
      sound = 0,
      delay = 0,
      params = {}
    } = options;

    // Interpolación de parámetros
    const finalMessage = Object.keys(params).length > 0 
      ? interpolateString(message, params) 
      : message;

    const sendFn = async () => {
      if (!this.haxballRoom?.browserPage) {
        this.logger.error('Cannot send message: browserPage not available');
        return;
      }

      try {
        await this.haxballRoom.browserPage.evaluate((pId: number | null, msg: string, c: number, s: string, snd: number) => {
          if ((window as any).gameRoom?._room) {
            (window as any).gameRoom._room.sendAnnouncement(msg, pId, c, s, snd);
          }
        }, target, finalMessage, color, style, sound);
      } catch (error) {
        this.logger.error('Failed to send message', error);
      }
    };

    if (delay > 0) {
      setTimeout(sendFn, delay);
    } else {
      sendFn();
    }
  }

  /**
   * Envía mensaje usando string del sistema con interpolación
   */
  public async sendString(
    stringPath: string,
    options: SendMessageOptions = {}
  ): Promise<void> {
    const message = this.getString(stringPath);
    await this.send(message, options);
  }

  /**
   * SECUENCIA DE BIENVENIDA OPTIMIZADA
   */
  public async sendWelcomeSequence(player: any): Promise<void> {
    const playerId = player.id;
    
    // 1. ASCII Art Banner (inmediato)
    await this.send(STRINGS.welcomeSystem.asciiWelcomeBanners[0], {
      target: playerId,
      color: COLORS.INFO,
      style: 'small'
    });

    // 2. Mensaje de bienvenida (1.5s)
    await this.sendString('onJoin.welcome', {
      target: playerId,
      color: COLORS.WELCOME,
      style: 'bold',
      delay: 1500,
      params: { playerName: player.name, playerID: player.id }
    });

    // 3. Mensaje motivacional (2s) 
    const motivationalMsg = this.getMotivationalMessage(player);
    await this.send(motivationalMsg, {
      target: playerId,
      color: COLORS.GOLD,
      delay: 2000
    });

    // 4. Discord (2.5s)
    await this.sendString('scheduler.advertise', {
      target: playerId,
      color: COLORS.DISCORD,
      delay: 2500
    });

    // 5. Stats si tiene (3s) - Temporalmente deshabilitado hasta que se implemente correctamente
    // TODO: Implementar carga de stats desde PlayerStats table
    /*
    if (player.stats?.totals > 0) {
      const statsMsg = `📊 Tus estadísticas: ${player.stats.totals} partidos, ${player.stats.wins} victorias (${Math.round((player.stats.wins / player.stats.totals) * 100)}%), Rating: ${Math.round(player.stats.rating)} pts`;
      await this.send(statsMsg, {
        target: playerId,
        color: COLORS.SUCCESS,
        delay: 3000
      });
    }
    */
  }

  /**
   * MENSAJES DE JUEGO
   */
  public async sendGoal(scorer: any, assist?: any): Promise<void> {
    if (assist) {
      const message = interpolateString(STRINGS.onGoal.goalWithAssist, {
        scorerName: scorer.name,
        scorerID: scorer.id,
        assistName: assist.name,
        assistID: assist.id
      });
      await this.send(message, {
        color: COLORS.GOAL,
        style: 'bold',
        sound: 1
      });
    } else {
      const message = interpolateString(STRINGS.onGoal.goal, {
        scorerName: scorer.name,
        scorerID: scorer.id
      });
      await this.send(message, {
        color: COLORS.GOAL,
        style: 'bold',
        sound: 1
      });
    }
  }

  public async sendVictory(scores: any, streak?: any): Promise<void> {
    await this.sendString('onVictory.victory', {
      color: COLORS.SUCCESS,
      style: 'bold',
      sound: 2,
      params: {
        redScore: scores.red,
        blueScore: scores.blue
      }
    });

    if (streak && streak.count >= 3) {
      await this.sendString('onVictory.burning', {
        color: 0xFF6600,
        style: 'bold',
        delay: 1000,
        params: {
          streakTeamName: streak.teamName,
          streakTeamCount: streak.count
        }
      });
    }
  }

  /**
   * MENSAJES DEL SISTEMA
   */
  public async sendBalance(player: any, fromTeam: number, toTeam: number): Promise<void> {
    const teamName = toTeam === 1 ? 'Rojo' : toTeam === 2 ? 'Azul' : 'Espectador';
    const message = `⚖️ ${player.name}#${player.id} fue movido al equipo ${teamName} para balancear los equipos.`;
    
    await this.send(message, {
      color: COLORS.BALANCE,
      style: 'bold'
    });
  }

  public async sendMute(player: any, duration: number = 180): Promise<void> {
    await this.sendString('command.mute.successMute', {
      color: COLORS.MUTE,
      style: 'bold',
      params: {
        targetName: player.name,
        ticketTarget: player.id
      }
    });
  }

  /**
   * SCHEDULER OPTIMIZADO PARA MENSAJES PERIÓDICOS
   */
  public addScheduledMessage(
    id: string,
    message: string,
    interval: number,
    options: SendMessageOptions = {}
  ): void {
    this.scheduledMessages.set(id, {
      id,
      message,
      options,
      interval,
      lastSent: 0,
      enabled: true
    });
  }

  public removeScheduledMessage(id: string): void {
    this.scheduledMessages.delete(id);
  }

  private startScheduler(): void {
    // Scheduler eficiente que corre cada 30 segundos
    this.schedulerInterval = setInterval(() => {
      const now = Date.now();
      
      for (const [id, scheduled] of this.scheduledMessages) {
        if (!scheduled.enabled) continue;
        
        if (now - scheduled.lastSent >= scheduled.interval) {
          this.send(scheduled.message, scheduled.options);
          scheduled.lastSent = now;
        }
      }
    }, 30000); // Check cada 30 segundos, no cada segundo
  }

  /**
   * UTILIDADES
   */
  private getString(path: string): string {
    const keys = path.split('.');
    let current: any = STRINGS;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return `[Missing: ${path}]`;
      }
    }
    
    return typeof current === 'string' ? current : `[Invalid: ${path}]`;
  }

  private getMotivationalMessage(player: any): string {
    // Temporalmente usar mensaje por defecto hasta que se implemente carga de stats
    return STRINGS.welcomeSystem.motivationalMessages.tierNew.replace('{remainingMatches}', '10');
  }

  /**
   * Método de prueba para verificar que los mensajes se envían
   */
  public async testMessage(): Promise<void> {
    if (!this.haxballRoom) {
      this.logger.error('No HaxballRoom available for test');
      return;
    }
    
    await this.send('🧪 Test message from ChatManager', {
      color: COLORS.INFO,
      style: 'bold'
    });
  }

  public getRuid(): string {
    return this.ruid;
  }

  public destroy(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    this.scheduledMessages.clear();
  }
}