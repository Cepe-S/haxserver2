/**
 * Configuración del sistema de logging mejorado
 * LOGGING_WEBHOOKS_PLAN - Fase 1
 */

export interface LoggerConfig {
  level: 'error' | 'warn' | 'info' | 'success' | 'debug';
  enableSpamFilter: boolean;
  maxMetadataFields: number;
  errorTruncateLength: number;
  enableStackTrace: boolean;
  timestampFormat: 'es-ES' | 'en-US';
  colorEnabled: boolean;
}

export const DEFAULT_LOGGER_CONFIG: LoggerConfig = {
  level: (process.env.LOG_LEVEL as any) || 'info',
  enableSpamFilter: true,
  maxMetadataFields: 5,
  errorTruncateLength: 500,
  enableStackTrace: true,
  timestampFormat: 'es-ES',
  colorEnabled: true
};

/**
 * Patrones de spam que se filtran automáticamente
 */
export const SPAM_PATTERNS = {
  debug: [
    /^Browser console:/,
    /^Game tick/,
    /^Player activity/,
    /^Heartbeat/,
    /^Ping/,
    /^Cache update/,
    /^Polling/
  ],
  info: [
    /^Proxy request/,
    /^Health check/,
    /^Static file/,
    /^CORS/,
    /^Options request/,
    /^Preflight/
  ]
};

/**
 * Campos de metadata considerados críticos
 */
export const CRITICAL_METADATA_FIELDS = [
  'ruid',
  'playerId', 
  'playerName',
  'error',
  'errorName',
  'errorCode',
  'httpStatus',
  'httpStatusText',
  'status',
  'duration',
  'team',
  'auth',
  'conn',
  'method',
  'url',
  'userId',
  'operation',
  'memoryUsage',
  'stack',
  'timestamp',
  'admin',
  'command',
  'fullCommand',
  'processed',
  'reason',
  'messageType',
  'identityId',
  'banInfo',
  'muteInfo',
  'roomLink',
  'mapName',
  'scores',
  'gameState'
];

/**
 * Patrones de errores críticos que requieren información adicional
 */
export const CRITICAL_ERROR_PATTERNS = [
  /database/i,
  /connection/i,
  /authentication/i,
  /permission/i,
  /haxball/i,
  /timeout/i,
  /network/i,
  /puppeteer/i,
  /browser/i,
  /room.*not.*found/i,
  /token.*invalid/i,
  /failed.*to.*create/i,
  /failed.*to.*connect/i,
  /failed.*to.*initialize/i,
  /out.*of.*memory/i,
  /disk.*full/i,
  /permission.*denied/i,
  /webhook.*failed/i,
  /command.*execution.*failed/i,
  /player.*join.*failed/i,
  /chat.*processing.*failed/i,
  /room.*creation.*failed/i,
  /stadium.*change.*failed/i,
  /ban.*check.*failed/i,
  /identity.*creation.*failed/i,
  /sanction.*failed/i,
  /admin.*login.*failed/i,
  /balance.*failed/i,
  /powershot.*failed/i
];

/**
 * Configuración de colores para diferentes niveles
 */
export const LOG_COLORS = {
  error: '\x1b[31m',   // Rojo
  warn: '\x1b[33m',    // Amarillo
  info: '\x1b[36m',    // Cian
  success: '\x1b[32m', // Verde
  debug: '\x1b[90m',   // Gris
  reset: '\x1b[0m'     // Reset
};

/**
 * Configuración de servicios y sus niveles de logging
 */
export const SERVICE_LOG_LEVELS = {
  'HAXBALL': 'info',
  'BALANCE': 'info', 
  'CHAT': 'info',
  'DATABASE': 'warn',
  'WEB': 'info',
  'SYSTEM': 'info',
  'POWERSHOT': 'warn',
  'EVENTS': 'debug'
};

/**
 * Acciones importantes que siempre se deben loggear
 */
export const IMPORTANT_ACTIONS = {
  player: ['joined', 'left', 'banned', 'promoted', 'demoted', 'kicked'],
  command: ['ban', 'unban', 'super', 'balance', 'map', 'login'],
  haxball: ['room created', 'room closed', 'player banned', 'game started', 'error'],
  database: ['connect', 'disconnect', 'migrate', 'error', 'timeout'],
  system: ['startup', 'shutdown', 'error', 'restart', 'config_change']
};

/**
 * Configuración de webhooks (para Fase 2)
 */
export interface WebhookConfig {
  enabled: boolean;
  url?: string;
  levels: string[];
  rateLimit: number; // mensajes por minuto
  batchSize: number;
  timeout: number;
}

export const DEFAULT_WEBHOOK_CONFIG: WebhookConfig = {
  enabled: false,
  levels: ['error', 'warn'],
  rateLimit: 10,
  batchSize: 5,
  timeout: 5000
};