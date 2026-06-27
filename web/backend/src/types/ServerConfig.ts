/**
 * Configuración completa del servidor Haxbotron
 * Basado en el sistema original con todas las opciones disponibles
 */

export interface HaxballRoomConfig {
  roomName: string;
  playerName: string;
  password: string;
  maxPlayers: number;
  public: boolean;
  token: string;
  noPlayer: boolean;
  geo?: {
    code: string;
    lat: number;
    lon: number;
  };
}

export interface GameSettings {
  // Anti-abuse settings
  maliciousBehaviourBanCriterion: number;
  banVoteEnable: boolean;
  banVoteBanMillisecs: number;
  banVoteAllowMinimum: number;
  banVoteExecuteMinimum: number;
  
  // AFK settings
  afkCountLimit: number;
  afkCommandAutoKick: boolean;
  afkCommandAutoKickAllowMillisecs: number;
  
  // Chat filtering
  chatFiltering: boolean;
  nicknameTextFilter: boolean;
  chatTextFilter: boolean;
  nicknameLengthLimit: number;
  chatLengthLimit: number;
  forbidDuplicatedNickname: boolean;
  
  // Anti-flood settings
  antiJoinFlood: boolean;
  joinFloodAllowLimitation: number;
  joinFloodIntervalMillisecs: number;
  joinFloodBanMillisecs: number;
  antiChatFlood: boolean;
  chatFloodCriterion: number;
  chatFloodIntervalMillisecs: number;
  antiSpamMuteEnabled: boolean;
  antiSpamMuteTimeMillisecs: number;
  antiSpamMuteLogEnabled: boolean;
  antiOgFlood: boolean;
  ogFloodCriterion: number;
  ogFloodBanMillisecs: number;
  antiAFKFlood: boolean;
  antiAFKAbusing: boolean;
  
  // Anti-abuse protections
  antiBanNoPermission: boolean;
  banNoPermissionBanMillisecs: number;
  antiInsufficientStartAbusing: boolean;
  insufficientStartAllowLimitation: number;
  insufficientStartAbusingBanMillisecs: number;
  antiPlayerKickAbusing: boolean;
  playerKickAllowLimitation: number;
  playerKickIntervalMillisecs: number;
  playerKickAbusingBanMillisecs: number;
  antiMuteAbusing: boolean;
  muteAllowIntervalMillisecs: number;
  muteDefaultMillisecs: number;
  antiGameAbscond: boolean;
  gameAbscondBanMillisecs: number;
  gameAbscondRatingPenalty: number;
  
  // Game mechanics
  rerollWinStreak: boolean;
  rerollWinstreakCriterion: number;
  guaranteePlayingTime: boolean;
  guaranteedPlayingTimeSeconds: number;
  avatarOverridingByTier: boolean;
  
  // Ball physics
  ballRadius: number;
  ballColor: string;
  ballBCoeff: number;
  ballInvMass: number;
  ballDamping: number;
  
  // Powershot system
  powershotEnabled: boolean;
  powershotActivationTime: number;
  powershotNormalColor: number;
  powershotActiveColor: number;
  powershotInvMassFactor: number;
  powershotCooldown: number;
  powershotStickDistance: number;
  
  // Balance system
  balanceEnabled: boolean;
  balanceMaxPlayersPerTeam: number;
}

export interface GameRules {
  ruleName: string;
  ruleDescription: string;
  requisite: {
    minimumPlayers: number;
    eachTeamPlayers: number;
    maxSubPlayers: number;
    timeLimit: number;
    scoreLimit: number;
    teamLock: boolean;
  };
  autoAdmin: boolean;
  autoOperating: boolean;
  statsRecord: boolean;
  balanceMode: string;
  defaultMapName: string;
  readyMapName: string;
  customJSONOptions: string;
}

export interface ServerImageConfig {
  ruid: string;
  _config: HaxballRoomConfig;
  settings: GameSettings;
  rules: GameRules;
  /** Metadatos runtime — no persistidos en JSON de imagen; inyectados al execute */
  _meta?: {
    serverImageId?: string;
  };
}

// Modos de balance disponibles
export const BALANCE_MODES = {
  jt: {
    name: 'Juegan Todos',
    description: 'Los jugadores son asignados automáticamente al equipo con menos jugadores'
  }
} as const;

export type BalanceModeKey = keyof typeof BALANCE_MODES;

// Mapas disponibles
export const AVAILABLE_STADIUMS = {
  futx2: 'Futsal x2 (Small)',
  futx3: 'Futsal x3 (Medium)',
  futx4: 'Futsal x4 (Standard)',
  futx5: 'Futsal x5 (Large)',
  futx7: 'Futsal x7 (Extra Large)',
  training: 'Training Map'
} as const;

export type StadiumKey = keyof typeof AVAILABLE_STADIUMS;

// Configuración por defecto simplificada para FASE 1
export const DEFAULT_SERVER_CONFIG: ServerImageConfig = {
  "ruid": "haxbotron-room-default",
  "_config": {
    "roomName": "🟦🟦🟦 new miku server *in progress...* 🟦🟦🟦",
    "playerName": "🤖",
    "password": "",
    "maxPlayers": 40,
    "public": true,
    "token": "",
    "noPlayer": true,
    "geo": {
      "code": "AR",
      "lat": -34.6882652,
      "lon": -58.5685501
    }
  },
  "settings": {
    "maliciousBehaviourBanCriterion": 20,
    "banVoteEnable": true,
    "banVoteBanMillisecs": 1800000,
    "banVoteAllowMinimum": 10,
    "banVoteExecuteMinimum": 7,
    "afkCountLimit": 20,
    "afkCommandAutoKick": false,
    "afkCommandAutoKickAllowMillisecs": 300000,
    "chatFiltering": true,
    "antiJoinFlood": true,
    "joinFloodAllowLimitation": 5,
    "joinFloodIntervalMillisecs": 60000,
    "joinFloodBanMillisecs": 180000,
    "antiChatFlood": true,
    "chatFloodCriterion": 8,
    "chatFloodIntervalMillisecs": 10000,
    "antiSpamMuteEnabled": true,
    "antiSpamMuteTimeMillisecs": 300000,
    "antiSpamMuteLogEnabled": true,
    "antiOgFlood": true,
    "ogFloodCriterion": 2,
    "ogFloodBanMillisecs": 300000,
    "antiBanNoPermission": true,
    "banNoPermissionBanMillisecs": 30000,
    "antiInsufficientStartAbusing": true,
    "insufficientStartAllowLimitation": 3,
    "insufficientStartAbusingBanMillisecs": 300000,
    "antiPlayerKickAbusing": true,
    "playerKickAllowLimitation": 2,
    "playerKickIntervalMillisecs": 30000,
    "playerKickAbusingBanMillisecs": 300000,
    "antiAFKFlood": true,
    "antiAFKAbusing": false,
    "antiMuteAbusing": true,
    "muteAllowIntervalMillisecs": 180000,
    "muteDefaultMillisecs": 180000,
    "antiGameAbscond": true,
    "gameAbscondBanMillisecs": 300000,
    "gameAbscondRatingPenalty": 10,
    "rerollWinStreak": true,
    "rerollWinstreakCriterion": 5,
    "guaranteePlayingTime": true,
    "guaranteedPlayingTimeSeconds": 20,
    "avatarOverridingByTier": false,
    "nicknameLengthLimit": 12,
    "chatLengthLimit": 10000,
    "forbidDuplicatedNickname": true,
    "nicknameTextFilter": true,
    "chatTextFilter": true,
    "ballRadius": 6.4,
    "ballColor": "FFFFFF",
    "ballBCoeff": 0.4,
    "ballInvMass": 1.5,
    "ballDamping": 0.99,
    "powershotEnabled": true,
    "powershotActivationTime": 10,
    "powershotNormalColor": 16777215,
    "powershotActiveColor": 16729344,
    "powershotInvMassFactor": 2.0,
    "powershotCooldown": 30000,
    "powershotStickDistance": 26,
    "balanceEnabled": true,
    "balanceMaxPlayersPerTeam": 15
  },
  "rules": {
    "ruleName": "default-rule",
    "ruleDescription": "this is default rule. (Auto+Relay+Shuffle)",
    "requisite": {
      "minimumPlayers": 2,
      "eachTeamPlayers": 15,
      "maxSubPlayers": 0,
      "timeLimit": 0,
      "scoreLimit": 0,
      "teamLock": true
    },
    "autoAdmin": false,
    "autoOperating": true,
    "statsRecord": true,
    "balanceMode": "jt",
    "defaultMapName": "futx7",
    "readyMapName": "training",
    "customJSONOptions": ""
  }
};