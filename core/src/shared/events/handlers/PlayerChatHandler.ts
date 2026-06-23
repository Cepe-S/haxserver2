import { eventBus } from '../EventBus';
import { HAXBALL_EVENTS, HaxballPlayerChatEvent } from '../HaxballEvents';
import { createLogger } from '../../logger/Logger';
import { CommandExecutor } from '../../../chat-manager/commands/CommandExecutor';
import { ChatManager } from '../../../chat-manager/ChatManager';
import { AdminManager } from '../../admin/AdminManager';

/**
 * Handler para eventos de chat de jugadores
 * Basado en onPlayerChatListener del sistema viejo
 */
export class PlayerChatHandler {
  private logger = createLogger('PlayerChatHandler');
  private commandExecutor: CommandExecutor | null = null;
  private adminManager: AdminManager | null = null;
  private playerJoinHandler: any = null;

  constructor(private chatManager?: ChatManager, private ruid?: string, private haxballRoom?: any, playerJoinHandler?: any) {
    this.playerJoinHandler = playerJoinHandler;
    if (chatManager && ruid) {
      this.commandExecutor = new CommandExecutor(chatManager, ruid);
      this.adminManager = new AdminManager(ruid, this.commandExecutor.getPermissionManager(), chatManager);
      if (haxballRoom) {
        this.adminManager.setHaxballRoom(haxballRoom);
        this.commandExecutor.setHaxballRoom(haxballRoom);
      }
      this.registerBasicCommands();
    }
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.onEvent(HAXBALL_EVENTS.PLAYER_CHAT, this.handlePlayerChat.bind(this));
    
    // Escuchar cuando jugadores se desconectan para limpiar admins
    eventBus.onEvent('admin.player.left', (data) => {
      this.onPlayerLeave(data.playerId);
    });
  }

  private async handlePlayerChat(event: HaxballPlayerChatEvent): Promise<void> {
    const { player, message, timestamp } = event;
    
    // Solo loggear comandos y mensajes importantes para evitar spam
    if (this.isCommand(message) || this.isAdminChat(message)) {
      this.logger.info('Player message', {
        playerId: player.id,
        playerName: player.name,
        message: message.substring(0, 100), // Truncar mensaje largo
        team: player.team,
        admin: player.admin,
        messageType: this.isCommand(message) ? 'command' : 'admin_chat'
      });
    }

    try {
      // Verificar si es mensaje privado
      if (this.isPrivateMessage(message)) {
        await this.handlePrivateMessage(player, message);
        return;
      }

      // Verificar si es comando
      if (this.isCommand(message)) {
        await this.handleCommand(player, message);
        return;
      }

      // Verificar si es chat de admin
      if (this.isAdminChat(message)) {
        await this.handleAdminChat(player, message);
        return;
      }

      // Procesar mensaje normal de chat
      await this.handleNormalChat(player, message, timestamp);

    } catch (error) {
      this.logger.error('Failed to process player chat', error, {
        playerId: player.id,
        playerName: player.name,
        message: message.substring(0, 50),
        team: player.team,
        operation: 'handlePlayerChat'
      });
    }
  }

  private isPrivateMessage(message: string): boolean {
    // TODO: Implementar detección de mensajes privados
    // Basado en el sistema viejo: isPrivateMessage(message)
    return message.startsWith('@') || message.startsWith('/pm');
  }

  private isCommand(message: string): boolean {
    return message.startsWith('!');
  }

  private isAdminChat(message: string): boolean {
    return message.startsWith('ac ');
  }

  private async handlePrivateMessage(player: any, message: string): Promise<void> {
    // TODO: Implementar manejo de mensajes privados
    // Basado en el sistema viejo: handlePrivateMessage(player, message)
    this.logger.debug(`[PlayerChat] Private message from ${player.name}: ${message}`);
  }

  private async handleCommand(player: any, message: string): Promise<void> {
    const commandName = message.split(' ')[0].substring(1); // Remove '!' and get command name
    
    if (this.commandExecutor) {
      try {
        // Procesar comando con el sistema de comandos
        const handled = await this.commandExecutor.processMessage(player, message);
        
        this.logger.command(commandName, player.name, handled, {
          playerId: player.id,
          fullCommand: message,
          team: player.team,
          admin: player.admin,
          processed: handled
        });
        
        if (handled) {
          return;
        }
      } catch (error) {
        this.logger.error('Command execution failed', error, {
          playerId: player.id,
          playerName: player.name,
          command: commandName,
          fullCommand: message,
          operation: 'processCommand'
        });
      }
    }
    
    // Fallback: emitir evento para otros sistemas
    eventBus.emitEvent('player.command', {
      player,
      command: message,
      timestamp: Date.now()
    });
  }

  private async handleNormalChat(player: any, message: string, timestamp: number): Promise<void> {
    try {
      // Verificar si el jugador está muteado
      if (await this.isPlayerMuted(player)) {
        this.sendMuteMessage(player);
        return;
      }

      // Verificar si el chat está congelado globalmente
      if (await this.isChatFrozen() && !player.admin) {
        this.sendChatFrozenMessage(player);
        return;
      }

      // Verificar anti-spam
      if (!await this.checkAntiSpam(player, message)) {
        return; // Mensaje bloqueado por spam
      }

      // Validar longitud del mensaje
      if (!this.validateMessageLength(message)) {
        this.sendMessageTooLongError(player);
        return;
      }

      // Verificar separadores prohibidos
      if (message.includes('|,|')) {
        this.sendSeparatorError(player);
        return;
      }

      // Solo enviar mensaje formateado si pasa todas las validaciones
      // El mensaje original ya fue bloqueado en HaxballEventAdapter
      await this.sendFormattedMessage(player, message);

    } catch (error) {
      this.logger.error(`[PlayerChat] Error handling normal chat from ${player.name}:`, error);
    }
  }

  private async isPlayerMuted(player: any): Promise<boolean> {
    // Obtener SanctionManager del PlayerJoinHandler
    const joinHandler = this.getJoinHandler();
    if (!joinHandler) return false;
    
    const sanctionManager = joinHandler.getSanctionManager();
    if (!sanctionManager) return false;
    
    const muteInfo = sanctionManager.isPlayerMuted(player.id);
    return muteInfo !== null;
  }

  private async isChatFrozen(): Promise<boolean> {
    // TODO: Verificar si el chat está congelado globalmente
    return false;
  }

  private async checkAntiSpam(player: any, message: string): Promise<boolean> {
    // TODO: Implementar sistema anti-spam
    // Basado en: window.gameRoom.chatFloodManager.checkMessage(player, message)
    return true;
  }

  private validateMessageLength(message: string): boolean {
    // TODO: Obtener límite de configuración
    const maxLength = 100; // window.gameRoom.config.settings.chatLengthLimit
    return message.length <= maxLength;
  }

  private async sendMuteMessage(player: any): Promise<void> {
    if (!this.chatManager) return;
    
    const joinHandler = this.getJoinHandler();
    if (!joinHandler) return;
    
    const sanctionManager = joinHandler.getSanctionManager();
    if (!sanctionManager) return;
    
    const muteInfo = sanctionManager.isPlayerMuted(player.id);
    if (muteInfo) {
      const timeLeft = muteInfo.expiresAt ? this.formatTimeRemaining(muteInfo.expiresAt) : 'permanente';
      await this.chatManager.send(`🔇 Estás muteado. Tiempo restante: ${timeLeft}`, {
        target: player.id,
        color: 0xFF0000
      });
    }
  }

  private sendChatFrozenMessage(player: any): void {
    // TODO: Enviar mensaje de que el chat está congelado
    this.logger.debug(`[PlayerChat] Chat is frozen for ${player.name}`);
  }

  private sendMessageTooLongError(player: any): void {
    // TODO: Enviar error de mensaje muy largo
    this.logger.debug(`[PlayerChat] Message too long from ${player.name}`);
  }

  private sendSeparatorError(player: any): void {
    // TODO: Enviar error de separador no permitido
    this.logger.debug(`[PlayerChat] Separator not allowed from ${player.name}`);
  }

  private async sendFormattedMessage(player: any, message: string): Promise<void> {
    if (!this.chatManager) return;

    // Verificar si es admin usando AdminManager (no player.admin de Haxball)
    const isLoggedAdmin = this.adminManager ? this.adminManager.isLoggedAdmin(player.id) : false;

    // Emojis por equipo con formato japonés
    const teamEmoji = player.team === 1 ? '🔴' : player.team === 2 ? '🔵' : '⚪';
    
    // Convertir ID a superíndice
    const superscriptId = player.id.toString().split('').map(digit => {
      const superscripts = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
      return superscripts[parseInt(digit)];
    }).join('');
    
    // Formato japonés: 👑「🔴」 ¹²・nombre ⮞ mensaje (admin) o 「🔴」 ¹²・nombre ⮞ mensaje (normal)
    const customMessage = isLoggedAdmin ? `👑「${teamEmoji}」 ${superscriptId}・${player.name} ⮞ ${message}` : `「${teamEmoji}」 ${superscriptId}・${player.name} ⮞ ${message}`;
    
    // Colores por equipo y rol (igual que en el proyecto original)
    let msgColor: number;
    if (isLoggedAdmin) {
      msgColor = 0xFFD700; // gold
    } else if (player.team === 1) {
      msgColor = 0xFD2C2D; // red
    } else if (player.team === 2) {
      msgColor = 0x18fde8; // blue
    } else {
      msgColor = 0xC7C7C7; // gray
    }

    // Usar SOLO ChatManager con formato japonés
    await this.chatManager.send(customMessage, {
      color: msgColor,
      style: 'normal',
      sound: 1
    });
  }

  /**
   * Registra los comandos básicos
   */
  private registerBasicCommands(): void {
    if (!this.commandExecutor) return;

    // Importar y registrar comandos básicos
    const { HelpCommand } = require('../../../chat-manager/commands/handlers/HelpCommand');
    const { AboutCommand } = require('../../../chat-manager/commands/handlers/AboutCommand');
    const { ListCommand } = require('../../../chat-manager/commands/handlers/ListCommand');
    const { AfkCommand } = require('../../../chat-manager/commands/handlers/AfkCommand');
    const { DiscordCommand } = require('../../../chat-manager/commands/handlers/DiscordCommand');

    // Registrar comandos básicos
    this.commandExecutor.registerCommand(new AboutCommand());
    this.commandExecutor.registerCommand(new ListCommand());
    this.commandExecutor.registerCommand(new AfkCommand());
    this.commandExecutor.registerCommand(new DiscordCommand());

    // Comando de login
    const { LoginCommand } = require('../../../chat-manager/commands/handlers/LoginCommand');
    this.commandExecutor.registerCommand(new LoginCommand(this.adminManager));
    
    // Comandos de sanciones - usar SanctionManager del PlayerJoinHandler
    const { BanCommand } = require('../../../chat-manager/commands/handlers/BanCommand');
    const { MuteCommand } = require('../../../chat-manager/commands/handlers/MuteCommand');
    const { UnbanCommand } = require('../../../chat-manager/commands/handlers/UnbanCommand');
    const { BanlistCommand } = require('../../../chat-manager/commands/handlers/BanlistCommand');
    const { UnmuteCommand } = require('../../../chat-manager/commands/handlers/UnmuteCommand');
    
    const sanctionManager = this.playerJoinHandler?.getSanctionManager();
    if (sanctionManager) {
      this.commandExecutor.registerCommand(new BanCommand(sanctionManager));
      this.commandExecutor.registerCommand(new MuteCommand(sanctionManager));
      this.commandExecutor.registerCommand(new UnbanCommand(sanctionManager));
      this.commandExecutor.registerCommand(new BanlistCommand(sanctionManager));
      this.commandExecutor.registerCommand(new UnmuteCommand(sanctionManager));
    } else {
      this.logger.warn('SanctionManager not available, sanction commands not registered');
    }
    
    // Comando de mezclar equipos
    const { MezclarCommand } = require('../../../chat-manager/commands/handlers/MezclarCommand');
    this.commandExecutor.registerCommand(new MezclarCommand());
    
    // Configurar AdminManager en CommandExecutor
    this.commandExecutor.setAdminManager(this.adminManager);
    
    // Registrar comandos de powershot
    this.registerPowershotCommands();
    
    // Registrar comando de camisetas
    const { CamisetasCommand } = require('../../../chat-manager/commands/handlers/CamisetasCommand');
    this.commandExecutor.registerCommand(new CamisetasCommand());
    
    // Registrar comandos sociales
    const { NvCommand } = require('../../../chat-manager/commands/handlers/NvCommand');
    const { AcomerCommand } = require('../../../chat-manager/commands/handlers/AcomerCommand');
    const { MemideCommand } = require('../../../chat-manager/commands/handlers/MemideCommand');
    this.commandExecutor.registerCommand(new NvCommand());
    this.commandExecutor.registerCommand(new AcomerCommand());
    this.commandExecutor.registerCommand(new MemideCommand());
    
    // Registrar HelpCommand al final para que tenga acceso a todos los comandos
    this.commandExecutor.registerCommand(new HelpCommand(this.commandExecutor.getRegistry(), this.chatManager));

    this.logger.info('Basic commands registered');
  }

  private async handleAdminChat(player: any, message: string): Promise<void> {
    if (!this.adminManager) {
      return;
    }

    // Extraer mensaje (remover "ac ")
    const adminMessage = message.slice(3).trim();
    
    if (adminMessage.length === 0) {
      return;
    }

    await this.adminManager.sendAdminChat(player, adminMessage);
  }

  /**
   * Registra los comandos de powershot
   */
  private registerPowershotCommands(): void {
    if (!this.commandExecutor) return;

    const { PowershotAdminCommand, PowershotDebugCommand } = require('../../../chat-manager/commands/handlers/PowershotCommand');
    
    this.commandExecutor.registerCommand(new PowershotAdminCommand());
    this.commandExecutor.registerCommand(new PowershotDebugCommand());
    
    this.logger.info('Powershot commands registered');
  }

  /**
   * Configura las contraseñas de admin desde la configuración
   */
  public setAdminPasswords(passwords: any[]): void {
    if (this.adminManager) {
      this.adminManager.setAdminPasswords(passwords);
    }
  }

  /**
   * Notifica cuando un jugador se desconecta
   */
  public async onPlayerLeave(playerId: number): Promise<void> {
    if (this.adminManager) {
      await this.adminManager.onPlayerLeave(playerId);
    }
  }

  /**
   * Configura el HaxballRoom en AdminManager y CommandExecutor
   */
  public setHaxballRoom(room: any): void {
    if (this.adminManager) {
      this.adminManager.setHaxballRoom(room);
    }
    if (this.commandExecutor) {
      this.commandExecutor.setHaxballRoom(room);
    }
  }

  /**
   * Obtiene el ejecutor de comandos para registrar comandos adicionales
   */
  public getCommandExecutor(): CommandExecutor | null {
    return this.commandExecutor;
  }

  /**
   * Obtiene el gestor de administradores
   */
  public getAdminManager(): AdminManager | null {
    return this.adminManager;
  }

  /**
   * Obtiene el handler de join (para acceder al SanctionManager)
   */
  private getJoinHandler(): any {
    return this.playerJoinHandler;
  }

  /**
   * Formatea tiempo restante
   */
  private formatTimeRemaining(expiresAt: Date): string {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return 'expirado';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} días`;
    if (hours > 0) return `${hours} horas`;
    return `${minutes} minutos`;
  }
}