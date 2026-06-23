import { createLogger } from '../../shared/logger/Logger';
import { CommandHandler, CommandInfo, PermissionLevel } from './types/CommandTypes';

/**
 * Registro central de comandos
 */
export class CommandRegistry {
  private logger = createLogger('CommandRegistry');
  private commands = new Map<string, CommandInfo>();

  /**
   * Registra un comando
   */
  public register(handler: CommandHandler): void {
    const info: CommandInfo = {
      name: handler.name,
      handler,
      lastUsed: new Map()
    };

    this.commands.set(handler.name.toLowerCase(), info);
  }

  /**
   * Obtiene un comando por nombre
   */
  public get(commandName: string): CommandInfo | null {
    return this.commands.get(commandName.toLowerCase()) || null;
  }

  /**
   * Obtiene todos los comandos
   */
  public getAll(): CommandInfo[] {
    return Array.from(this.commands.values());
  }

  /**
   * Obtiene comandos por categoría
   */
  public getByCategory(category: string): CommandInfo[] {
    return this.getAll().filter(cmd => cmd.handler.category === category);
  }

  /**
   * Obtiene comandos disponibles para un nivel de permisos
   */
  public getAvailableCommands(permissionLevel: PermissionLevel): CommandInfo[] {
    return this.getAll().filter(cmd => cmd.handler.permission <= permissionLevel);
  }

  /**
   * Verifica si un comando existe
   */
  public exists(commandName: string): boolean {
    return this.commands.has(commandName.toLowerCase());
  }

  /**
   * Verifica cooldown de comando para un jugador
   */
  public checkCooldown(commandName: string, playerId: number): boolean {
    const command = this.get(commandName);
    if (!command || !command.handler.cooldown) {
      return true; // Sin cooldown
    }

    const lastUsed = command.lastUsed.get(playerId);
    if (!lastUsed) {
      return true; // Primera vez
    }

    const elapsed = (Date.now() - lastUsed) / 1000;
    return elapsed >= command.handler.cooldown;
  }

  /**
   * Actualiza el timestamp de uso de un comando
   */
  public updateLastUsed(commandName: string, playerId: number): void {
    const command = this.get(commandName);
    if (command) {
      command.lastUsed.set(playerId, Date.now());
    }
  }

  /**
   * Obtiene tiempo restante de cooldown
   */
  public getCooldownRemaining(commandName: string, playerId: number): number {
    const command = this.get(commandName);
    if (!command || !command.handler.cooldown) {
      return 0;
    }

    const lastUsed = command.lastUsed.get(playerId);
    if (!lastUsed) {
      return 0;
    }

    const elapsed = (Date.now() - lastUsed) / 1000;
    return Math.max(0, command.handler.cooldown - elapsed);
  }

  /**
   * Obtiene estadísticas del registro
   */
  public getStats(): any {
    const categories = new Map<string, number>();
    const permissions = new Map<PermissionLevel, number>();

    for (const command of this.commands.values()) {
      // Contar por categoría
      const category = command.handler.category;
      categories.set(category, (categories.get(category) || 0) + 1);

      // Contar por nivel de permisos
      const permission = command.handler.permission;
      permissions.set(permission, (permissions.get(permission) || 0) + 1);
    }

    return {
      totalCommands: this.commands.size,
      categories: Object.fromEntries(categories),
      permissions: Object.fromEntries(
        Array.from(permissions.entries()).map(([level, count]) => [
          PermissionLevel[level], count
        ])
      )
    };
  }
}