import { CommandHandler, CommandContext, CommandResult, PermissionLevel } from '../types/CommandTypes';

/**
 * Comando !login - Autenticación como administrador
 */
export class LoginCommand implements CommandHandler {
  name = 'login';
  description = 'Autenticarse como administrador';
  detailedHelp = '📑 !login <contraseña> : Te autentica como administrador usando la contraseña configurada. Una vez logueado, tendrás acceso a comandos de administración.';
  usage = '!login <contraseña>';
  permission = PermissionLevel.PLAYER;
  category = 'admin';
  cooldown = 5; // 5 segundos para evitar spam

  constructor(private adminManager: any) {}

  async execute(context: CommandContext): Promise<CommandResult> {
    const { args, player } = context;

    if (args.length === 0) {
      return {
        success: false,
        error: '❌ Debes proporcionar una contraseña. Uso: !login <contraseña>'
      };
    }

    const password = args[0];

    try {
      const success = await this.adminManager.login(player, password);

      if (success) {
        return { success: true }; // AdminManager ya envía los mensajes
      } else {
        return {
          success: false,
          error: '❌ Contraseña incorrecta.'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: '❌ Error interno al procesar login.'
      };
    }
  }
}