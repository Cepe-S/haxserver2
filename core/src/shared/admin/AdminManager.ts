import { createLogger } from '../logger/Logger';
import { PermissionManager } from '../../chat-manager/commands/PermissionManager';
import { ChatManager } from '../../chat-manager/ChatManager';
import { PlayerCacheManager } from '../player/PlayerCacheManager';

interface AdminPassword {
  password: string;
  description: string;
  level: 'admin' | 'superadmin';
}

export type AdminLoginResult = 'success' | 'wrong_password' | 'no_identity' | 'grant_failed';

/**
 * Gestor de administradores - Login y chat privado
 */
export class AdminManager {
  private logger = createLogger('AdminManager');
  private loggedAdmins = new Set<number>(); // haxballIds de admins logueados
  private adminPasswords: AdminPassword[] = [];
  private haxballRoom: any = null;

  constructor(
    private ruid: string,
    private permissionManager: PermissionManager,
    private chatManager: ChatManager
  ) {}

  /**
   * Configura la referencia al HaxballRoom
   */
  public setHaxballRoom(room: any): void {
    this.haxballRoom = room;
  }

  /**
   * Configura las contraseñas de admin desde la configuración del servidor
   */
  public setAdminPasswords(passwords: AdminPassword[]): void {
    this.adminPasswords = passwords;
    this.logger.info(`Admin passwords configured: ${passwords.length} passwords`);
  }

  /**
   * Intenta hacer login como admin
   */
  public async login(player: any, password: string): Promise<AdminLoginResult> {
    // Verificar contraseña
    const adminConfig = this.adminPasswords.find(p => p.password === password);
    if (!adminConfig) {
      return 'wrong_password';
    }

    // Otorgar permisos en BD (por identityId en cache, no requiere auth Haxball)
    const cached = PlayerCacheManager.getInstance().getPlayerByHaxballId(player.id);
    if (!cached?.identityId) {
      await this.chatManager.send('❌ No se pudo resolver tu identidad. Reconecta e intenta de nuevo.', {
        target: player.id,
        color: 0xFF0000
      });
      return 'no_identity';
    }

    const isSuperAdmin = adminConfig.level === 'superadmin';
    const success = await this.permissionManager.grantAdminByIdentityId(
      cached.identityId,
      this.ruid,
      isSuperAdmin
    );

    if (!success) {
      return 'grant_failed';
    }

    // Marcar como logueado
    this.loggedAdmins.add(player.id);

    // Otorgar admin nativo de Haxball
    await this.grantNativeAdmin(player.id);

    // Anuncio público
    const adminType = isSuperAdmin ? 'Super Administrador' : 'Administrador';
    await this.chatManager.send(`👑 ${player.name} se ha logueado como ${adminType}`, {
      color: 0xFFD700,
      style: 'bold'
    });

    // Mensaje privado con instrucciones
    await this.chatManager.send('👑 Bienvenido, administrador!', {
      target: player.id,
      color: 0xFFD700,
      style: 'bold'
    });

    await this.chatManager.send('📋 Instrucciones importantes:', {
      target: player.id,
      color: 0x00AAFF
    });

    await this.chatManager.send('• NO uses el sistema de baneos nativo de Haxball', {
      target: player.id,
      color: 0xFF6600
    });

    await this.chatManager.send('• Usa los comandos del bot para sancionar (!ban, !mute)', {
      target: player.id,
      color: 0xFF6600
    });

    await this.chatManager.send('• Usa "ac <mensaje>" para chat privado de admins', {
      target: player.id,
      color: 0x00FF88
    });

    this.logger.info(`Admin login successful: ${player.name} (${adminType})`);
    return 'success';
  }

  /**
   * Envía mensaje al chat privado de administradores
   */
  public async sendAdminChat(senderPlayer: any, message: string): Promise<void> {
    // Verificar que el sender sea admin logueado
    if (!this.loggedAdmins.has(senderPlayer.id)) {
      await this.chatManager.send('❌ Solo los administradores logueados pueden usar el chat privado.', {
        target: senderPlayer.id,
        color: 0xFF0000
      });
      return;
    }

    // Enviar mensaje a todos los admins logueados
    const adminMessage = `[ADMIN] ${senderPlayer.name}: ${message}`;
    
    for (const adminId of this.loggedAdmins) {
      await this.chatManager.send(adminMessage, {
        target: adminId,
        color: 0xFF6600,
        style: 'bold'
      });
    }

    this.logger.info(`Admin chat: ${senderPlayer.name}: ${message}`);
  }

  /**
   * Verifica si un jugador está logueado como admin
   */
  public isLoggedAdmin(playerId: number): boolean {
    return this.loggedAdmins.has(playerId);
  }

  /**
   * Remueve admin cuando se desconecta
   */
  public async onPlayerLeave(playerId: number): Promise<void> {
    if (this.loggedAdmins.has(playerId)) {
      this.loggedAdmins.delete(playerId);
      await this.revokeNativeAdmin(playerId);
    }
  }

  /**
   * Otorga admin nativo de Haxball
   */
  private async grantNativeAdmin(playerId: number): Promise<void> {
    if (this.haxballRoom?.browserPage) {
      try {
        await this.haxballRoom.browserPage.evaluate((pId: number) => {
          if ((window as any).gameRoom?._room) {
            (window as any).gameRoom._room.setPlayerAdmin(pId, true);
          }
        }, playerId);
      } catch (error) {
        this.logger.error('Failed to grant native admin:', error);
      }
    }
  }

  /**
   * Revoca admin nativo de Haxball
   */
  private async revokeNativeAdmin(playerId: number): Promise<void> {
    if (this.haxballRoom?.browserPage) {
      try {
        await this.haxballRoom.browserPage.evaluate((pId: number) => {
          if ((window as any).gameRoom?._room) {
            (window as any).gameRoom._room.setPlayerAdmin(pId, false);
          }
        }, playerId);
      } catch (error) {
        this.logger.error('Failed to revoke native admin:', error);
      }
    }
  }

  /**
   * Obtiene lista de admins logueados
   */
  public getLoggedAdmins(): number[] {
    return Array.from(this.loggedAdmins);
  }
}