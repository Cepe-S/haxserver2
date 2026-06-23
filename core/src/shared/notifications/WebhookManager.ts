/**
 * WebhookManager - Gestión centralizada de webhooks
 * LOGGING_WEBHOOKS_PLAN - Fase 2
 */



export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  levels: ('error' | 'warn' | 'critical')[];
  rateLimit: number; // mensajes por minuto
  format: 'compact' | 'detailed';
  services?: string[]; // filtrar por servicio
}

export interface WebhookMessage {
  level: string;
  service: string;
  message: string;
  error?: string;
  metadata?: any;
  timestamp: string;
}

export class WebhookManager {
  private static instance: WebhookManager;
  private webhooks: Map<string, WebhookConfig> = new Map();
  private rateLimiters: Map<string, { count: number; resetTime: number }> = new Map();

  private constructor() {}

  public static getInstance(): WebhookManager {
    if (!WebhookManager.instance) {
      WebhookManager.instance = new WebhookManager();
    }
    return WebhookManager.instance;
  }

  /**
   * Registrar webhook
   */
  public registerWebhook(config: WebhookConfig): void {
    this.webhooks.set(config.id, config);
    console.log(`[WebhookManager] Webhook registered: ${config.name} (${config.id}) - Levels: ${config.levels.join(',')}`);
  }

  /**
   * Enviar mensaje a webhooks relevantes
   */
  public async sendMessage(message: WebhookMessage): Promise<void> {
    const relevantWebhooks = this.getRelevantWebhooks(message);
    
    if (relevantWebhooks.length === 0) {
      return; // No webhooks to send to
    }
    
    for (const webhook of relevantWebhooks) {
      if (this.checkRateLimit(webhook.id)) {
        await this.sendToWebhook(webhook, message);
      }
    }
  }

  /**
   * Obtener webhooks relevantes para un mensaje
   */
  private getRelevantWebhooks(message: WebhookMessage): WebhookConfig[] {
    return Array.from(this.webhooks.values()).filter(webhook => {
      if (!webhook.enabled) return false;
      if (!webhook.levels.includes(message.level as any)) return false;
      
      // Si services está vacío o no definido, aceptar todos los servicios
      if (webhook.services && webhook.services.length > 0 && !webhook.services.includes(message.service)) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Verificar rate limit
   */
  private checkRateLimit(webhookId: string): boolean {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return false;

    const now = Date.now();
    const limiter = this.rateLimiters.get(webhookId);

    if (!limiter || now > limiter.resetTime) {
      this.rateLimiters.set(webhookId, {
        count: 1,
        resetTime: now + 60000 // 1 minuto
      });
      return true;
    }

    if (limiter.count < webhook.rateLimit) {
      limiter.count++;
      return true;
    }

    return false;
  }

  /**
   * Enviar mensaje a webhook específico via web backend
   */
  private async sendToWebhook(webhook: WebhookConfig, message: WebhookMessage): Promise<void> {
    try {
      const payload = this.formatMessage(webhook, message);
      
      const webBackendUrl = `http://localhost:${process.env.WEB_PORT || 3000}`;
      const response = await fetch(`${webBackendUrl}/api/webhooks/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          webhookId: webhook.id,
          payload
        })
      });
      
      if (!response.ok) {
        console.error(`[WebhookManager] Failed to send webhook ${webhook.name}: ${response.status}`);
      }

    } catch (error: any) {
      console.error(`[WebhookManager] Webhook error for ${webhook.name}: ${error.message}`);
    }
  }

  /**
   * Formatear mensaje según configuración
   */
  private formatMessage(webhook: WebhookConfig, message: WebhookMessage): any {
    if (webhook.format === 'compact') {
      return this.formatCompact(message);
    } else {
      return this.formatDetailed(message);
    }
  }

  /**
   * Formato compacto para Discord
   */
  private formatCompact(message: WebhookMessage): any {
    const emoji = this.getLevelEmoji(message.level);
    const title = `${emoji} **${message.level.toUpperCase()}** - ${message.service}`;
    
    let content = `${title}\n\`\`\`\n[${new Date(message.timestamp).toLocaleTimeString()}] ${message.message}`;
    
    if (message.error) {
      content += `\nError: ${message.error}`;
    }
    
    if (message.metadata?.ruid) {
      content += `\nRoom: ${message.metadata.ruid}`;
    }
    
    content += '\n```';

    return {
      content,
      username: 'MikuServerPro'
    };
  }

  /**
   * Formato detallado para Discord
   */
  private formatDetailed(message: WebhookMessage): any {
    const emoji = this.getLevelEmoji(message.level);
    const title = `${emoji} **${message.level.toUpperCase()} ERROR** - MikuServerPro`;
    
    let content = `${title}\n\`\`\`\n[${message.timestamp}] ${message.service}/${message.message}`;
    
    if (message.error) {
      content += `\nError: ${message.error}`;
    }
    
    if (message.metadata) {
      content += '\n\nContext:';
      Object.entries(message.metadata).forEach(([key, value]) => {
        if (key !== 'stack') {
          content += `\n- ${key}: ${value}`;
        }
      });
    }
    
    content += '\n```';

    return {
      content,
      username: 'MikuServerPro'
    };
  }

  /**
   * Obtener emoji según nivel
   */
  private getLevelEmoji(level: string): string {
    switch (level) {
      case 'error': return '🚨';
      case 'warn': return '⚠️';
      case 'critical': return '🔥';
      default: return '📢';
    }
  }

  /**
   * Limpiar todos los webhooks
   */
  public clearWebhooks(): void {
    this.webhooks.clear();
    this.rateLimiters.clear();
  }

  /**
   * Obtener estadísticas
   */
  public getStats(): any {
    return {
      totalWebhooks: this.webhooks.size,
      enabledWebhooks: Array.from(this.webhooks.values()).filter(w => w.enabled).length,
      rateLimiters: this.rateLimiters.size
    };
  }
}