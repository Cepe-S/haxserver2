import { createLogger } from '../../shared/logger/Logger';
import { CommandParser } from './CommandParser';
import { CommandRegistry } from './CommandRegistry';
import { PermissionManager } from './PermissionManager';
import { CommandContext, CommandResult } from './types/CommandTypes';
import { ChatManager } from '../ChatManager';
import { STRINGS } from '../../shared/strings';
import { HaxballRoomWrapper } from './HaxballRoomWrapper';

/**
 * Ejecutor de comandos - Coordina parsing, permisos y ejecución
 */
export class CommandExecutor {
  private logger = createLogger('CommandExecutor');
  private parser = new CommandParser();
  private registry = new CommandRegistry();
  private permissionManager = new PermissionManager();
  private adminManager: any = null;
  private haxballRoomWrapper: HaxballRoomWrapper | null = null;

  constructor(private chatManager: ChatManager, private ruid: string) {}

  /**
   * Procesa un mensaje de chat y ejecuta comando si es válido
   */
  public async processMessage(player: any, message: string): Promise<boolean> {
    if (!this.parser.isCommand(message)) {
      return false; // No es un comando
    }

    const parsed = this.parser.parseCommand(message);
    if (!parsed) {
      await this.sendError(player.id, STRINGS.command._ErrorWrongCommand);
      return true; // Es comando pero inválido
    }

    const { command, args } = parsed;

    // Verificar si el comando existe
    const commandInfo = this.registry.get(command);
    if (!commandInfo) {
      await this.sendError(player.id, STRINGS.command._ErrorWrongCommand);
      return true;
    }

    // Verificar permisos
    const hasPermission = await this.permissionManager.hasPermission(
      player, 
      commandInfo.handler.permission, 
      this.ruid,
      this.adminManager
    );

    if (!hasPermission) {
      await this.sendError(player.id, STRINGS.command._ErrorNoPermission);
      return true;
    }

    // Verificar cooldown
    if (!this.registry.checkCooldown(command, player.id)) {
      const remaining = Math.ceil(this.registry.getCooldownRemaining(command, player.id));
      await this.sendError(player.id, `⏰ Debes esperar ${remaining} segundos antes de usar este comando.`);
      return true;
    }

    // Buscar auth del jugador en la base de datos usando su conexión activa
    let playerAuth: string | undefined;
    try {
      const { db } = require('@mikuserverpro/database');
      const connection = await db.connection.findFirst({
        where: { 
          haxballId: player.id,
          ruid: this.ruid,
          leftAt: null // Conexión activa
        }
      });
      playerAuth = connection?.auth || undefined;
    } catch (error) {
      this.logger.warn(`Failed to fetch player auth from DB: ${error}`);
    }

    // Crear contexto
    const context: CommandContext = {
      player: {
        id: player.id,
        name: player.name,
        auth: playerAuth,
        admin: player.admin,
        team: player.team
      },
      args,
      rawMessage: message,
      ruid: this.ruid,
      haxballRoom: this.haxballRoomWrapper || undefined
    };

    try {
      // Ejecutar comando
      const result = await commandInfo.handler.execute(context);

      // Actualizar cooldown
      this.registry.updateLastUsed(command, player.id);

      // Enviar respuesta solo si hay mensaje
      if (result.message) {
        await this.chatManager.send(result.message, { target: player.id });
      }

      // Enviar error si hay
      if (!result.success && result.error) {
        await this.sendError(player.id, result.error);
      }

      return true;

    } catch (error) {
      this.logger.error(`Command execution failed: ${command}`, error);
      await this.sendError(player.id, '❌ Error interno del comando. Inténtalo más tarde.');
      return true;
    }
  }

  /**
   * Registra un comando
   */
  public registerCommand(handler: any): void {
    this.registry.register(handler);
  }

  /**
   * Obtiene el registro de comandos
   */
  public getRegistry(): CommandRegistry {
    return this.registry;
  }

  /**
   * Obtiene el gestor de permisos
   */
  public getPermissionManager(): PermissionManager {
    return this.permissionManager;
  }

  /**
   * Envía mensaje de error
   */
  private async sendError(playerId: number, message: string): Promise<void> {
    await this.chatManager.send(message, { 
      target: playerId,
      color: 0xFF0000
    });
  }

  /**
   * Configura el AdminManager
   */
  public setAdminManager(adminManager: any): void {
    this.adminManager = adminManager;
  }

  /**
   * Configura el HaxballRoom para acceso desde comandos
   */
  public setHaxballRoom(haxballRoom: any): void {
    if (haxballRoom) {
      this.haxballRoomWrapper = new HaxballRoomWrapper(haxballRoom);
      this.logger.debug('HaxballRoom configured for commands');
    } else {
      this.haxballRoomWrapper = null;
      this.logger.debug('HaxballRoom removed from commands');
    }
  }

  /**
   * Obtiene estadísticas del sistema de comandos
   */
  public getStats(): any {
    return {
      registry: this.registry.getStats(),
      ruid: this.ruid
    };
  }
}