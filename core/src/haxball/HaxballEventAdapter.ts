import { eventBus } from '../shared/events/EventBus';
import { 
  HAXBALL_EVENTS,
  HaxballPlayer,
  HaxballPlayerJoinEvent,
  HaxballPlayerLeaveEvent,
  HaxballGameStartEvent,
  HaxballGameStopEvent,
  HaxballTeamGoalEvent,
  HaxballPlayerChatEvent,
  HaxballPlayerTeamChangeEvent,
  HaxballPlayerAdminChangeEvent,
  HaxballPlayerActivityEvent,
  HaxballPlayerBallKickEvent,
  HaxballGamePauseEvent,
  HaxballGameUnpauseEvent,
  HaxballStadiumChangeEvent,
  HaxballPositionsResetEvent,
  HaxballPlayerKickedEvent,
  HaxballRoomLinkEvent,
  HaxballGameTickEvent,
  HaxballTeamVictoryEvent,
  HaxballKickRateLimitSetEvent
} from '../shared/events/HaxballEvents';
import { createLogger } from '../shared/logger/Logger';

/**
 * Adaptador que convierte eventos nativos de Haxball a eventos internos
 * Regla #18: Todos los eventos de Haxball deben pasar por el sistema centralizado
 */
export class HaxballEventAdapter {
  private logger = createLogger('HaxballEventAdapter');

  /**
   * Convierte un player nativo de Haxball a nuestro formato
   */
  private convertPlayer(player: any): HaxballPlayer {
    return {
      id: player.id,
      name: player.name,
      team: player.team,
      admin: player.admin,
      position: player.position,
      auth: player.auth,
      conn: player.conn
    };
  }

  /**
   * Registra todos los event listeners de Haxball
   */
  public setupEventListeners(room: any): void {
    this.logger.info('[HaxballEventAdapter] Setting up Haxball event listeners');

    // Eventos críticos (⭐⭐⭐⭐⭐)
    room.onPlayerJoin = (player: any) => {
      const event: HaxballPlayerJoinEvent = {
        player: this.convertPlayer(player),
        timestamp: Date.now()
      };
      eventBus.emitEvent(HAXBALL_EVENTS.PLAYER_JOIN, event);
    };

    room.onPlayerLeave = (player: any) => {
      const event: HaxballPlayerLeaveEvent = {
        player: this.convertPlayer(player),
        timestamp: Date.now()
      };
      eventBus.emitEvent(HAXBALL_EVENTS.PLAYER_LEAVE, event);
    };

    room.onGameStart = (byPlayer?: any) => {
      const event: HaxballGameStartEvent = {
        byPlayer: byPlayer ? this.convertPlayer(byPlayer) : undefined,
        timestamp: Date.now()
      };
      eventBus.emitEvent(HAXBALL_EVENTS.GAME_START, event);
    };

    room.onGameStop = (byPlayer?: any) => {
      const event: HaxballGameStopEvent = {
        byPlayer: byPlayer ? this.convertPlayer(byPlayer) : undefined,
        timestamp: Date.now()
      };
      eventBus.emitEvent(HAXBALL_EVENTS.GAME_STOP, event);
    };

    room.onTeamGoal = (team: number) => {
      const scores = room.getScores();
      const event: HaxballTeamGoalEvent = {
        team,
        scores: scores ? {
          red: scores.red,
          blue: scores.blue,
          time: scores.time,
          scoreLimit: scores.scoreLimit,
          timeLimit: scores.timeLimit
        } : { red: 0, blue: 0, time: 0, scoreLimit: 0, timeLimit: 0 },
        timestamp: Date.now()
      };
      eventBus.emitEvent(HAXBALL_EVENTS.TEAM_GOAL, event);
    };

    room.onPlayerChat = (player: any, message: string): boolean => {
      const event: HaxballPlayerChatEvent = {
        player: this.convertPlayer(player),
        message,
        timestamp: Date.now()
      };
      eventBus.emitEvent(HAXBALL_EVENTS.PLAYER_CHAT, event);
      
      // Bloquear TODOS los mensajes originales
      // El sistema de eventos se encarga de enviar los formateados
      return false;
    };

    // Eventos importantes (⭐⭐⭐)
    room.onPlayerTeamChange = (changedPlayer: any, byPlayer?: any) => {
      const event: HaxballPlayerTeamChangeEvent = {
        player: this.convertPlayer(changedPlayer),
        byPlayer: byPlayer ? this.convertPlayer(byPlayer) : undefined,
        oldTeam: 0, // TODO: Trackear equipo anterior
        newTeam: changedPlayer.team,
        timestamp: Date.now()
      };
      eventBus.emitEvent(HAXBALL_EVENTS.PLAYER_TEAM_CHANGE, event);
    };

    room.onPlayerAdminChange = (changedPlayer: any, byPlayer?: any) => {
      const event: HaxballPlayerAdminChangeEvent = {
        player: this.convertPlayer(changedPlayer),
        byPlayer: byPlayer ? this.convertPlayer(byPlayer) : undefined,
        isAdmin: changedPlayer.admin,
        timestamp: Date.now()
      };
      eventBus.emitEvent(HAXBALL_EVENTS.PLAYER_ADMIN_CHANGE, event);
    };

    room.onPlayerActivity = (player: any) => {
      const event: HaxballPlayerActivityEvent = {
        player: this.convertPlayer(player),
        timestamp: Date.now()
      };
      eventBus.emitEvent(HAXBALL_EVENTS.PLAYER_ACTIVITY, event);
    };

    room.onPlayerBallKick = (player: any) => {
      const event: HaxballPlayerBallKickEvent = {
        player: this.convertPlayer(player),
        timestamp: Date.now()
      };
      eventBus.emitEvent(HAXBALL_EVENTS.PLAYER_BALL_KICK, event);
    };

    // Eventos secundarios (⭐⭐)
    room.onGamePause = (byPlayer?: any) => {
      const event: HaxballGamePauseEvent = {
        byPlayer: byPlayer ? this.convertPlayer(byPlayer) : undefined,
        timestamp: Date.now()
      };
      eventBus.emitEvent(HAXBALL_EVENTS.GAME_PAUSE, event);
    };

    room.onGameUnpause = (byPlayer?: any) => {
      const event: HaxballGameUnpauseEvent = {
        byPlayer: byPlayer ? this.convertPlayer(byPlayer) : undefined,
        timestamp: Date.now()
      };
      eventBus.emitEvent(HAXBALL_EVENTS.GAME_UNPAUSE, event);
    };

    room.onStadiumChange = (newStadiumName: string, byPlayer?: any) => {
      const event: HaxballStadiumChangeEvent = {
        newStadiumName,
        byPlayer: byPlayer ? this.convertPlayer(byPlayer) : undefined,
        timestamp: Date.now()
      };
      eventBus.emitEvent(HAXBALL_EVENTS.STADIUM_CHANGE, event);
    };

    room.onPositionsReset = () => {
      const event: HaxballPositionsResetEvent = {
        timestamp: Date.now()
      };
      eventBus.emitEvent(HAXBALL_EVENTS.POSITIONS_RESET, event);
    };

    room.onPlayerKicked = (kickedPlayer: any, reason: string, ban: boolean, byPlayer?: any) => {
      const event: HaxballPlayerKickedEvent = {
        kickedPlayer: this.convertPlayer(kickedPlayer),
        reason,
        ban,
        byPlayer: byPlayer ? this.convertPlayer(byPlayer) : undefined,
        timestamp: Date.now()
      };
      eventBus.emitEvent(HAXBALL_EVENTS.PLAYER_KICKED, event);
    };

    room.onRoomLink = (url: string) => {
      const event: HaxballRoomLinkEvent = {
        url,
        timestamp: Date.now()
      };
      eventBus.emitEvent(HAXBALL_EVENTS.ROOM_LINK, event);
    };

    room.onGameTick = () => {
      const event: HaxballGameTickEvent = {
        timestamp: Date.now()
      };
      eventBus.emitEvent(HAXBALL_EVENTS.GAME_TICK, event);
    };

    room.onTeamVictory = (scores: any) => {
      const event: HaxballTeamVictoryEvent = {
        scores: {
          red: scores.red,
          blue: scores.blue,
          time: scores.time,
          scoreLimit: scores.scoreLimit,
          timeLimit: scores.timeLimit
        },
        timestamp: Date.now()
      };
      eventBus.emitEvent(HAXBALL_EVENTS.TEAM_VICTORY, event);
    };

    room.onKickRateLimitSet = (min: number, rate: number, burst: number, byPlayer?: any) => {
      const event: HaxballKickRateLimitSetEvent = {
        min,
        rate,
        burst,
        byPlayer: byPlayer ? this.convertPlayer(byPlayer) : undefined,
        timestamp: Date.now()
      };
      eventBus.emitEvent(HAXBALL_EVENTS.KICK_RATE_LIMIT_SET, event);
    };

    this.logger.info('[HaxballEventAdapter] All Haxball event listeners registered');
  }
}