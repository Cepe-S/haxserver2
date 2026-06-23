import { CommandHandler, CommandContext, CommandResult, PermissionLevel } from '../types/CommandTypes';
import { CommandRegistry } from '../CommandRegistry';
import { ChatManager } from '../../ChatManager';

/**
 * Comando !help - Muestra ayuda general o específica automáticamente
 */
export class HelpCommand implements CommandHandler {
  name = 'help';
  description = 'Muestra ayuda de comandos';
  detailedHelp = '📑 !help : Muestra lista de comandos disponibles.\n📑 !help <comando> : Muestra ayuda detallada del comando especificado.';
  usage = '!help [comando]';
  permission = PermissionLevel.PLAYER;
  category = 'basic';

  constructor(private registry: CommandRegistry, private chatManager?: ChatManager) {}

  async execute(context: CommandContext): Promise<CommandResult> {
    const { args, player } = context;

    // Sin argumentos - ayuda general automática
    if (args.length === 0) {
      await this.sendColoredHelp(player);
      return { success: true };
    }

    // Con argumento - ayuda específica automática
    const commandName = args[0].toLowerCase();
    const command = this.registry.get(commandName);

    if (!command) {
      return {
        success: false,
        error: '❌ No hay una descripción disponible para el comando solicitado.'
      };
    }

    return {
      success: true,
      message: command.handler.detailedHelp
    };
  }

  private generateGeneralHelp(player: any): string {
    // Determinar nivel de permisos (síncrono para help)
    const playerLevel = player.admin ? PermissionLevel.ADMIN : PermissionLevel.PLAYER;
    const allCommands = this.registry.getAll();
    
    // Separar comandos de usuario y admin
    const userCommands: string[] = [];
    const adminCommands: string[] = [];
    
    for (const cmd of allCommands) {
      const commandText = `!${cmd.handler.name} - ${cmd.handler.description}`;
      
      if (cmd.handler.permission <= PermissionLevel.PLAYER) {
        userCommands.push(commandText);
      } else {
        adminCommands.push(commandText);
      }
    }

    let helpText = '📄 Comandos disponibles:\n';
    
    // Mostrar comandos de usuario (siempre)
    helpText += userCommands.join('\n');
    
    // Mostrar comandos de admin solo si es admin
    if (playerLevel >= PermissionLevel.ADMIN && adminCommands.length > 0) {
      helpText += '\n' + adminCommands.join('\n');
    }
    
    helpText += '\n📑 Usa !help <comando> para más detalles (Ej: !help stats)';
    
    return helpText;
  }

  private async sendColoredHelp(player: any): Promise<void> {
    if (!this.chatManager) {
      return;
    }

    const playerLevel = player.admin ? PermissionLevel.ADMIN : PermissionLevel.PLAYER;
    const allCommands = this.registry.getAll();
    
    // Separar comandos por categoría y nivel
    const commandsByCategory = new Map<string, any[]>();
    
    for (const cmd of allCommands) {
      // Solo mostrar comandos que el jugador puede usar
      if (cmd.handler.permission > playerLevel) continue;
      
      const category = cmd.handler.category;
      if (!commandsByCategory.has(category)) {
        commandsByCategory.set(category, []);
      }
      commandsByCategory.get(category)!.push(cmd.handler);
    }

    // Enviar header
    await this.chatManager.send('📄 Comandos disponibles:', {
      target: player.id,
      color: 0x00AAFF,
      style: 'bold'
    });

    // Enviar comandos por categoría con colores diferentes
    const categoryColors = {
      'basic': 0x00FF88,     // Verde claro
      'social': 0x00DDFF,    // Azul claro  
      'admin': 0xFF6600,     // Naranja
      'game': 0xFFDD00,      // Amarillo
      'stats': 0xDD88FF,     // Morado claro
      'debug': 0xFF8888      // Rojo claro
    };

    for (const [category, commands] of commandsByCategory) {
      const color = categoryColors[category] || 0xFFFFFF;
      
      for (const cmd of commands) {
        const commandText = `!${cmd.name} - ${cmd.description}`;
        await this.chatManager.send(commandText, {
          target: player.id,
          color
        });
      }
    }

    // Enviar footer
    await this.chatManager.send('📑 Usa !help <comando> para más detalles (Ej: !help stats)', {
      target: player.id,
      color: 0x888888,
      style: 'small'
    });
  }
}