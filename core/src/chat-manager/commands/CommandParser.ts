import { createLogger } from '../../shared/logger/Logger';

/**
 * Parser de comandos - Extrae comandos y argumentos de mensajes de chat
 */
export class CommandParser {
  private logger = createLogger('CommandParser');
  private readonly COMMAND_PREFIX = '!';

  /**
   * Verifica si un mensaje es un comando
   */
  public isCommand(message: string): boolean {
    return message.trim().startsWith(this.COMMAND_PREFIX);
  }

  /**
   * Parsea un comando y extrae nombre y argumentos
   */
  public parseCommand(message: string): { command: string; args: string[] } | null {
    if (!this.isCommand(message)) {
      return null;
    }

    const trimmed = message.trim();
    const parts = trimmed.slice(1).split(/\s+/); // Remover ! y dividir por espacios
    
    if (parts.length === 0 || parts[0] === '') {
      return null;
    }

    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    this.logger.debug(`Command parsed: ${command} with ${args.length} args`, { command, args });

    return { command, args };
  }

  /**
   * Extrae ID de jugador de un argumento (#12 -> 12)
   */
  public parsePlayerId(arg: string): number | null {
    if (!arg.startsWith('#')) {
      return null;
    }

    const id = parseInt(arg.slice(1));
    return isNaN(id) ? null : id;
  }

  /**
   * Valida que un argumento sea una opción válida
   */
  public validateOption(arg: string, validOptions: string[]): boolean {
    return validOptions.includes(arg.toLowerCase());
  }

  /**
   * Parsea duración en minutos (30, 1h, 2d)
   */
  public parseDuration(arg: string): number | null {
    if (!arg) return null;

    const match = arg.match(/^(\d+)([mhd]?)$/i);
    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2]?.toLowerCase() || 'm';

    switch (unit) {
      case 'm': return value;
      case 'h': return value * 60;
      case 'd': return value * 60 * 24;
      default: return null;
    }
  }
}