/**
 * Definición de tipos para eventos de Haxball
 * Basado en el sistema del haxbotron viejo pero adaptado a nuestra arquitectura
 */

export interface HaxballPlayer {
  id: number;
  name: string;
  team: number;
  admin: boolean;
  position?: { x: number; y: number };
  auth?: string;
  conn?: string;
}

export interface HaxballScores {
  red: number;
  blue: number;
  time: number;
  scoreLimit: number;
  timeLimit: number;
}

/**
 * Eventos críticos de Haxball (Prioridad ⭐⭐⭐⭐⭐)
 */
export interface HaxballPlayerJoinEvent {
  player: HaxballPlayer;
  timestamp: number;
}

export interface HaxballPlayerLeaveEvent {
  player: HaxballPlayer;
  timestamp: number;
}

export interface HaxballGameStartEvent {
  byPlayer?: HaxballPlayer;
  timestamp: number;
}

export interface HaxballGameStopEvent {
  byPlayer?: HaxballPlayer;
  timestamp: number;
}

export interface HaxballTeamGoalEvent {
  team: number;
  scorer?: HaxballPlayer;
  assist?: HaxballPlayer;
  scores: HaxballScores;
  timestamp: number;
}

export interface HaxballPlayerChatEvent {
  player: HaxballPlayer;
  message: string;
  timestamp: number;
}

/**
 * Eventos importantes (Prioridad ⭐⭐⭐)
 */
export interface HaxballPlayerTeamChangeEvent {
  player: HaxballPlayer;
  byPlayer?: HaxballPlayer;
  oldTeam: number;
  newTeam: number;
  timestamp: number;
}

export interface HaxballPlayerAdminChangeEvent {
  player: HaxballPlayer;
  byPlayer?: HaxballPlayer;
  isAdmin: boolean;
  timestamp: number;
}

export interface HaxballPlayerActivityEvent {
  player: HaxballPlayer;
  timestamp: number;
}

export interface HaxballPlayerBallKickEvent {
  player: HaxballPlayer;
  timestamp: number;
}

/**
 * Eventos secundarios (Prioridad ⭐⭐)
 */
export interface HaxballGamePauseEvent {
  byPlayer?: HaxballPlayer;
  timestamp: number;
}

export interface HaxballGameUnpauseEvent {
  byPlayer?: HaxballPlayer;
  timestamp: number;
}

export interface HaxballStadiumChangeEvent {
  newStadiumName: string;
  byPlayer?: HaxballPlayer;
  timestamp: number;
}

export interface HaxballPositionsResetEvent {
  timestamp: number;
}

export interface HaxballPlayerKickedEvent {
  kickedPlayer: HaxballPlayer;
  reason: string;
  ban: boolean;
  byPlayer?: HaxballPlayer;
  timestamp: number;
}

export interface HaxballRoomLinkEvent {
  url: string;
  timestamp: number;
}

export interface HaxballGameTickEvent {
  timestamp: number;
}

export interface HaxballTeamVictoryEvent {
  scores: HaxballScores;
  timestamp: number;
}

export interface HaxballKickRateLimitSetEvent {
  min: number;
  rate: number;
  burst: number;
  byPlayer?: HaxballPlayer;
  timestamp: number;
}

/**
 * Nombres de eventos como constantes
 */
export const HAXBALL_EVENTS = {
  // Eventos críticos
  PLAYER_JOIN: 'haxball.player.join',
  PLAYER_LEAVE: 'haxball.player.leave',
  GAME_START: 'haxball.game.start',
  GAME_STOP: 'haxball.game.stop',
  TEAM_GOAL: 'haxball.team.goal',
  TEAM_VICTORY: 'haxball.team.victory',
  PLAYER_CHAT: 'haxball.player.chat',
  
  // Eventos importantes
  PLAYER_TEAM_CHANGE: 'haxball.player.teamChange',
  PLAYER_ADMIN_CHANGE: 'haxball.player.adminChange',
  PLAYER_ACTIVITY: 'haxball.player.activity',
  PLAYER_BALL_KICK: 'haxball.player.ballKick',
  
  // Eventos secundarios
  GAME_PAUSE: 'haxball.game.pause',
  GAME_UNPAUSE: 'haxball.game.unpause',
  GAME_TICK: 'haxball.game.tick',
  STADIUM_CHANGE: 'haxball.stadium.change',
  POSITIONS_RESET: 'haxball.positions.reset',
  PLAYER_KICKED: 'haxball.player.kicked',
  ROOM_LINK: 'haxball.room.link',
  KICK_RATE_LIMIT_SET: 'haxball.kickRateLimit.set'
} as const;