/**
 * Tipos y interfaces para el sistema de comandos
 */

export enum PermissionLevel {
  PLAYER = 0,
  ADMIN = 1,
  SUPER_ADMIN = 2
}

export interface CommandContext {
  player: {
    id: number;
    name: string;
    auth?: string;
    admin: boolean;
    team: number;
  };
  args: string[];
  rawMessage: string;
  ruid: string;
  haxballRoom?: HaxballRoomInterface;
}

/**
 * Interface para acceso controlado al room de Haxball
 */
export interface HaxballRoomInterface {
  setPlayerTeam(playerId: number, team: number): Promise<void>;
  kickPlayer(playerId: number, reason: string, ban?: boolean): Promise<void>;
  sendAnnouncement(message: string, targetId?: number, color?: number, style?: string, sound?: number): Promise<void>;
  setTeamColors(team: number, angle: number, textColor: number, colors: number[]): Promise<void>;
  getPowershotManager?(): any;
}

export interface CommandResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface CommandHandler {
  name: string;
  description: string; // Help corto
  detailedHelp: string; // Help detallado
  usage: string;
  permission: PermissionLevel;
  category: string;
  cooldown?: number; // segundos
  
  execute(context: CommandContext): Promise<CommandResult>;
}

export interface CommandInfo {
  name: string;
  handler: CommandHandler;
  lastUsed: Map<number, number>; // playerId -> timestamp
}

export type CommandCategory = 'basic' | 'admin' | 'stats' | 'game' | 'social' | 'debug';