import winston from 'winston';
import { join } from 'path';
import { getLogsDirectory, setupProcessErrorHandlers } from '@mikuserverpro/database';
import { 
  DEFAULT_LOGGER_CONFIG, 
  SPAM_PATTERNS, 
  CRITICAL_METADATA_FIELDS, 
  CRITICAL_ERROR_PATTERNS,
  LOG_COLORS,
  IMPORTANT_ACTIONS
} from './LoggerConfig';
// Lazy import to avoid circular dependency
type WebhookManager = import('../notifications/WebhookManager').WebhookManager;
type WebhookMessage = import('../notifications/WebhookManager').WebhookMessage;

/**
 * Sistema de logging mejorado - LOGGING_WEBHOOKS_PLAN
 * Reglas: información necesaria, sin logging excesivo, visualmente atractivo sin emojis
 */

// Usar colores de la configuración
const colors = LOG_COLORS;

// Formato mejorado para consola - más limpio y estructurado
const consoleFormat = winston.format.printf(({ level, message, timestamp, service, ...meta }) => {
  const color = colors[level as keyof typeof colors] || colors.info;
  const serviceTag = service ? `[${String(service).toUpperCase()}]` : '[SYSTEM]';
  const time = new Date(String(timestamp)).toLocaleTimeString('es-ES', { hour12: false });
  
  let logMessage = `${color}${time} ${serviceTag} ${message}${colors.reset}`;
  
  // Agregar metadata crítica de forma estructurada
  const criticalMeta = extractCriticalMeta(meta);
  if (criticalMeta) {
    logMessage += ` ${colors.debug}${criticalMeta}${colors.reset}`;
  }
  
  return logMessage;
});

// Extrae solo metadata crítica para evitar logging excesivo
function extractCriticalMeta(meta: any): string {
  const entries = Object.entries(meta)
    .filter(([key, value]) => {
      return value !== undefined && value !== null && CRITICAL_METADATA_FIELDS.includes(key);
    })
    .map(([key, value]) => {
      if (key === 'error' && typeof value === 'string') {
        return `error="${value}"`;
      }
      if (typeof value === 'string') return `${key}="${value}"`;
      return `${key}=${value}`;
    })
    .slice(0, DEFAULT_LOGGER_CONFIG.maxMetadataFields);
  
  // Para errores, no limitar la longitud
  if (entries.some(entry => entry.includes('error='))) {
    return entries.join(' ');
  }
  
  return entries.length > 0 ? `[${entries.join(' ')}]` : '';
}

const logsDir = getLogsDirectory();
const logService = process.env.LOG_SERVICE || 'core';

const fileJsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, service, stack, ...meta }) =>
    JSON.stringify({
      timestamp,
      level,
      service,
      message,
      stack: stack || meta.stack,
      ...meta,
    })
  )
);

// Custom levels
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    success: 3,
    debug: 4
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'cyan',
    success: 'green',
    debug: 'magenta'
  }
};

// Logger base
const baseLogger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat()
  ),
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
      handleExceptions: true,
      handleRejections: true,
    }),
    new winston.transports.File({
      filename: join(logsDir, 'errors.log'),
      level: 'error',
      format: fileJsonFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: join(logsDir, `${logService}-app.log`),
      format: fileJsonFormat,
      maxsize: 20 * 1024 * 1024,
      maxFiles: 3,
    }),
  ],
  exitOnError: false
});

/**
 * Logger principal con métodos fáciles de usar
 */
export class Logger {
  private service: string;

  constructor(service: string = 'SYSTEM') {
    this.service = service;
  }

  /**
   * Log de información general - solo para eventos importantes
   */
  info(message: string, meta?: any) {
    if (this.shouldLog('info', message)) {
      baseLogger.info(message, { service: this.service, ...meta });
    }
  }

  /**
   * Log de éxito - para operaciones completadas exitosamente
   */
  success(message: string, meta?: any) {
    (baseLogger as any).success(message, { service: this.service, ...meta });
  }

  /**
   * Log de advertencia - para situaciones que requieren atención
   */
  warn(message: string, meta?: any) {
    baseLogger.warn(message, { service: this.service, ...meta });
    
    // Enviar TODOS los warnings a webhooks para testing
    this.sendToWebhooks('warn', message, meta);
  }

  /**
   * Log de error - siempre se registra con información detallada
   */
  error(message: string, error?: any, meta?: any) {
    let errorMeta = meta || {};
    
    // Extraer información detallada del error
    if (error) {
      if (error instanceof Error) {
        errorMeta.error = error.message;
        errorMeta.errorName = error.name;
        errorMeta.errorCode = (error as any).code || 'UNKNOWN';
        if (error.stack) {
          errorMeta.stack = error.stack;
        }
      } else if (typeof error === 'string') {
        errorMeta.error = error;
      } else if (typeof error === 'object') {
        // Para errores de axios, fetch, etc.
        errorMeta.error = error.message || JSON.stringify(error);
        if (error.response) {
          errorMeta.httpStatus = error.response.status;
          errorMeta.httpStatusText = error.response.statusText;
        }
        if (error.code) {
          errorMeta.errorCode = error.code;
        }
      } else {
        errorMeta.error = String(error);
      }
    } else {
      // Si no hay error pero el mensaje indica fallo, agregar contexto
      errorMeta.error = 'No error details provided';
      errorMeta.errorCode = 'MISSING_ERROR_INFO';
    }
    
    // Agregar contexto del sistema si es crítico
    if (this.isCriticalError(error)) {
      errorMeta.timestamp = new Date().toISOString();
      errorMeta.nodeVersion = process.version;
      errorMeta.platform = process.platform;
      errorMeta.memoryUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    }
    
    baseLogger.error(message, { service: this.service, ...errorMeta });
    
    // Enviar TODOS los errores a webhooks para testing
    this.sendToWebhooks('error', message, errorMeta);
  }

  /**
   * Log de debug - solo en desarrollo y con filtros
   */
  debug(message: string, meta?: any) {
    if (process.env.NODE_ENV === 'development' && this.shouldLog('debug', message)) {
      baseLogger.debug(message, { service: this.service, ...meta });
    }
  }

  /**
   * Determina si un log debe ser registrado para evitar spam
   */
  private shouldLog(level: string, message: string): boolean {
    if (!DEFAULT_LOGGER_CONFIG.enableSpamFilter) {
      return true;
    }
    
    // Usar patrones de la configuración
    const patterns = SPAM_PATTERNS[level as keyof typeof SPAM_PATTERNS];
    if (patterns) {
      return !patterns.some(pattern => pattern.test(message));
    }
    
    return true;
  }

  /**
   * Determina si un error es crítico y requiere información adicional
   */
  private isCriticalError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message || String(error);
    const errorName = error.name || '';
    const errorCode = error.code || '';
    
    // Errores críticos por patrón de mensaje
    const isCriticalByMessage = CRITICAL_ERROR_PATTERNS.some(pattern => pattern.test(errorMessage));
    
    // Errores críticos por tipo
    const criticalErrorTypes = [
      'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET',
      'EPIPE', 'EMFILE', 'ENOMEM', 'ENOSPC'
    ];
    const isCriticalByCode = criticalErrorTypes.includes(errorCode);
    
    // Errores críticos por nombre
    const criticalErrorNames = [
      'DatabaseError', 'ConnectionError', 'TimeoutError', 
      'AuthenticationError', 'PermissionError', 'ValidationError'
    ];
    const isCriticalByName = criticalErrorNames.includes(errorName);
    
    return isCriticalByMessage || isCriticalByCode || isCriticalByName;
  }

  /**
   * Log de inicio de operación - solo para operaciones importantes
   */
  start(operation: string, meta?: any) {
    this.info(`Starting ${operation}`, meta);
  }

  /**
   * Log de finalización exitosa
   */
  complete(operation: string, meta?: any) {
    this.success(`Completed ${operation}`, meta);
  }

  /**
   * Log de fallo de operación con contexto adicional
   */
  fail(operation: string, error?: any, meta?: any) {
    const failMeta = {
      operation,
      failureTime: new Date().toISOString(),
      ...meta
    };
    
    // Si no hay error específico, crear uno descriptivo
    if (!error) {
      error = new Error(`Operation '${operation}' failed without specific error details`);
      error.name = 'OperationFailure';
      error.code = 'NO_ERROR_PROVIDED';
    }
    
    this.error(`Failed ${operation}`, error, failMeta);
  }

  /**
   * Log de request HTTP - solo para errores o requests importantes
   */
  request(method: string, url: string, status?: number, duration?: number) {
    // Solo loggear errores o requests lentos
    if (status && status >= 400) {
      this.warn(`${method} ${url} failed`, { status, duration });
    } else if (duration && duration > 1000) {
      this.warn(`${method} ${url} slow response`, { status, duration });
    }
  }

  /**
   * Log de base de datos - solo para operaciones críticas
   */
  database(action: string, table?: string, meta?: any) {
    // Solo loggear operaciones importantes o errores
    if (IMPORTANT_ACTIONS.database.some(a => action.toLowerCase().includes(a))) {
      const tableStr = table ? ` table=${table}` : '';
      this.info(`Database ${action}${tableStr}`, meta);
    }
  }

  /**
   * Log de Haxball - eventos importantes del juego
   */
  haxball(action: string, roomId?: string, meta?: any) {
    // Solo eventos importantes de Haxball
    if (IMPORTANT_ACTIONS.haxball.some(a => action.toLowerCase().includes(a))) {
      this.info(`Haxball ${action}`, { ruid: roomId, ...meta });
    }
  }

  /**
   * Log de jugador - eventos importantes de jugadores
   */
  player(action: string, playerName: string, meta?: any) {
    if (IMPORTANT_ACTIONS.player.some(a => action.toLowerCase().includes(a))) {
      this.info(`Player ${action}`, { playerName, ...meta });
    }
  }

  /**
   * Log de comando - solo comandos importantes o errores
   */
  command(command: string, playerName: string, success: boolean, meta?: any) {
    if (!success) {
      this.warn(`Command ${command} failed`, { playerName, ...meta });
    } else {
      // Solo loggear comandos administrativos
      if (IMPORTANT_ACTIONS.command.includes(command.toLowerCase())) {
        this.info(`Command ${command} executed`, { playerName, ...meta });
      }
    }
  }

  /**
   * Log de sistema - eventos críticos del sistema
   */
  system(event: string, meta?: any) {
    this.info(`System ${event}`, meta);
  }

  /**
   * Enviar mensaje a webhooks
   */
  private sendToWebhooks(level: string, message: string, metadata?: any): void {
    try {
      // Lazy import to avoid circular dependency
      import('../notifications/WebhookManager').then(({ WebhookManager }) => {
        const webhookManager = WebhookManager.getInstance();
        const webhookMessage = {
          level,
          service: this.service,
          message,
          error: metadata?.error,
          metadata,
          timestamp: new Date().toISOString()
        };
        
        // No await para no bloquear el logging
        webhookManager.sendMessage(webhookMessage).catch(() => {
          // Silently fail webhook sending to avoid logging loops
        });
      }).catch(() => {
        // Silently fail to avoid logging loops
      });
    } catch (error) {
      // Silently fail to avoid logging loops
    }
  }
}

// Instancia global para uso rápido
export const logger = new Logger();

// Factory para crear loggers específicos por servicio
export const createLogger = (service: string) => new Logger(service);

setupProcessErrorHandlers('core', (message, error, meta) => {
  baseLogger.error(message, {
    service: 'PROCESS',
    error: error instanceof Error ? error.message : String(error),
    errorName: error instanceof Error ? error.name : 'Unknown',
    stack: error instanceof Error ? error.stack : undefined,
    ...meta,
  });
});

// Configurar winston para usar nuestros niveles personalizados
winston.addColors({
  error: 'red',
  warn: 'yellow', 
  info: 'cyan',
  success: 'green',
  debug: 'magenta'
});

// Suprimir logs de Fastify que no necesitamos
process.on('warning', (warning) => {
  if (warning.name === 'FastifyWarning') return;
  console.warn(warning);
});