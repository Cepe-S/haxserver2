import { CommandHandler, CommandContext, CommandResult, PermissionLevel } from '../types/CommandTypes';
import { PowershotMode } from '../../../shared/powershot/PowershotManager';

export class PowershotAdminCommand implements CommandHandler {
  name = 'powershotadmin';
  description = 'Administrar sistema powershot';
  detailedHelp = '⚡ !powershotadmin <mode> : Cambiar modo de powershot. Modos: disabled, classic, fast, epic, competitive';
  usage = '!powershotadmin <mode>';
  permission = PermissionLevel.ADMIN;
  category = 'admin';
  cooldown = 5;

  async execute(context: CommandContext): Promise<CommandResult> {
    const { player, args, haxballRoom } = context;

    if (args.length === 0) {
      return this.showStatus(haxballRoom);
    }

    const mode = args[0].toLowerCase() as PowershotMode;
    
    if (!Object.values(PowershotMode).includes(mode)) {
      return {
        success: false,
        error: `❌ Modo inválido. Modos disponibles: ${Object.values(PowershotMode).join(', ')}`
      };
    }

    try {
      const powershotManager = haxballRoom?.getPowershotManager();
      if (!powershotManager) {
        return {
          success: false,
          error: '❌ Powershot manager not available'
        };
      }

      const oldMode = powershotManager.getMode();
      powershotManager.setMode(mode);
      const modeInfo = powershotManager.getModeInfo();

      return {
        success: true,
        message: `✅ Powershot cambiado: ${oldMode} → ${mode}\n${modeInfo.description}`
      };
      
    } catch (error) {
      return {
        success: false,
        error: `❌ Error: ${error.message}`
      };
    }
  }

  private showStatus(haxballRoom: any): CommandResult {
    try {
      const powershotManager = haxballRoom?.getPowershotManager();
      if (!powershotManager) {
        return {
          success: false,
          error: '❌ Powershot manager not available'
        };
      }

      const status = powershotManager.getStatus();
      const modeInfo = powershotManager.getModeInfo();
      
      const message = `⚡ POWERSHOT STATUS:\n` +
        `• Modo: ${status.mode}\n` +
        `• ${modeInfo.description}\n` +
        `• Activación: ${status.config.activationTime}ms\n` +
        `• Potencia: x${status.config.powerMultiplier}\n` +
        `• Cooldown: ${status.config.cooldownTime / 1000}s\n` +
        `• Máximo por partido: ${status.config.maxPerMatch}\n` +
        `• Estado: ${status.state.isActive ? '🔥 ACTIVO' : '⚪ Inactivo'}`;

      return {
        success: true,
        message
      };
      
    } catch (error) {
      return {
        success: false,
        error: `❌ Error: ${error.message}`
      };
    }
  }
}

export class PowershotDebugCommand implements CommandHandler {
  name = 'debugpowershot';
  description = 'Debug del sistema powershot';
  detailedHelp = '🔍 !debugpowershot : Mostrar información detallada del sistema powershot';
  usage = '!debugpowershot';
  permission = PermissionLevel.ADMIN;
  category = 'debug';
  cooldown = 3;

  async execute(context: CommandContext): Promise<CommandResult> {
    const { haxballRoom } = context;

    try {
      const powershotManager = haxballRoom?.getPowershotManager();
      if (!powershotManager) {
        return {
          success: false,
          error: '❌ Powershot manager not available'
        };
      }

      const debug = powershotManager.getDebugInfo();
      
      let message = `🔍 POWERSHOT DEBUG:\n`;
      message += `• Modo: ${debug.mode} - ${debug.description}\n`;
      message += `• Estado: ${debug.state.isActive ? '🔥 ACTIVO' : '⚪ Inactivo'}\n`;
      
      if (debug.state.currentPlayer > 0) {
        message += `• Jugador actual: #${debug.state.currentPlayer}\n`;
        message += `• Progreso: ${debug.state.progress.toFixed(1)}%\n`;
      }
      
      if (debug.cooldowns.length > 0) {
        message += `• Cooldowns activos: ${debug.cooldowns.length}\n`;
      }
      
      if (debug.matchUsage.length > 0) {
        message += `• Usos en partido: ${debug.matchUsage.length} jugadores\n`;
      }

      return {
        success: true,
        message
      };
      
    } catch (error) {
      return {
        success: false,
        error: `❌ Error: ${error.message}`
      };
    }
  }
}