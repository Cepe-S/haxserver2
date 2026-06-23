import winston from 'winston';
import { join } from 'path';
import { getLogsDirectory, setupProcessErrorHandlers } from '@mikuserverpro/database';

/**
 * Logger del backend web — alineado con core para beta (archivos + stacks).
 */

const colors = {
  error: '\x1b[31m',
  warn: '\x1b[33m',
  info: '\x1b[36m',
  success: '\x1b[32m',
  debug: '\x1b[90m',
  reset: '\x1b[0m',
};

const consoleFormat = winston.format.printf(({ level, message, timestamp, service, ...meta }) => {
  const color = colors[level as keyof typeof colors] || colors.info;
  const serviceTag = service ? `[${String(service).toUpperCase()}]` : '[WEB]';
  const time = new Date(String(timestamp)).toLocaleTimeString('es-ES', { hour12: false });

  let logMessage = `${color}${time} ${serviceTag} ${message}${colors.reset}`;

  const criticalMeta = extractCriticalMeta(meta);
  if (criticalMeta) {
    logMessage += ` ${colors.debug}${criticalMeta}${colors.reset}`;
  }

  return logMessage;
});

function extractCriticalMeta(meta: Record<string, unknown>): string {
  const critical = ['status', 'method', 'url', 'error', 'errorName', 'errorCode', 'stack', 'userId', 'duration', 'ruid'];
  const entries = Object.entries(meta)
    .filter(([key, value]) => value !== undefined && value !== null && critical.includes(key))
    .map(([key, value]) => {
      if (key === 'error' && typeof value === 'string') return `error="${value}"`;
      if (key === 'stack' && typeof value === 'string') return `stack="${value.split('\n')[0]}..."`;
      return `${key}=${String(value)}`;
    })
    .slice(0, 8);

  if (entries.some((e) => e.includes('error='))) return entries.join(' ');
  return entries.length > 0 ? `[${entries.join(' ')}]` : '';
}

const customLevels = {
  levels: { error: 0, warn: 1, info: 2, success: 3, debug: 4 },
  colors: { error: 'red', warn: 'yellow', info: 'cyan', success: 'green', debug: 'gray' },
};

const logsDir = getLogsDirectory();
const logService = process.env.LOG_SERVICE || 'web';

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
  exitOnError: false,
});

function extractErrorMeta(error: unknown, meta: Record<string, unknown> = {}): Record<string, unknown> {
  const errorMeta: Record<string, unknown> = { ...meta };

  if (error instanceof Error) {
    errorMeta.error = error.message;
    errorMeta.errorName = error.name;
    errorMeta.errorCode = (error as NodeJS.ErrnoException).code || 'UNKNOWN';
    if (error.stack) errorMeta.stack = error.stack;
  } else if (typeof error === 'string') {
    errorMeta.error = error;
  } else if (error && typeof error === 'object') {
    const obj = error as Record<string, unknown>;
    errorMeta.error = obj.message || JSON.stringify(error);
    if (obj.response && typeof obj.response === 'object') {
      const res = obj.response as Record<string, unknown>;
      errorMeta.httpStatus = res.status;
      errorMeta.httpStatusText = res.statusText;
    }
    if (obj.code) errorMeta.errorCode = obj.code;
  } else if (error !== undefined) {
    errorMeta.error = String(error);
  } else {
    errorMeta.error = 'No error details provided';
    errorMeta.errorCode = 'MISSING_ERROR_INFO';
  }

  return errorMeta;
}

export function createLogger(service: string) {
  return {
    info: (message: string, meta?: Record<string, unknown>) => {
      if (shouldLog('info', message)) {
        baseLogger.info(message, { service, ...meta });
      }
    },
    error: (message: string, error?: unknown, meta?: Record<string, unknown>) => {
      baseLogger.error(message, { service, ...extractErrorMeta(error, meta) });
    },
    warn: (message: string, meta?: Record<string, unknown>) => baseLogger.warn(message, { service, ...meta }),
    debug: (message: string, meta?: Record<string, unknown>) => {
      if (process.env.LOG_LEVEL === 'debug' && shouldLog('debug', message)) {
        baseLogger.debug(message, { service, ...meta });
      }
    },
    success: (message: string, meta?: Record<string, unknown>) =>
      (baseLogger as winston.Logger & { success: (msg: string, meta?: object) => void }).success(message, {
        service,
        ...meta,
      }),
    start: (operation: string, meta?: Record<string, unknown>) =>
      baseLogger.info(`Starting ${operation}`, { service, ...meta }),
    complete: (operation: string, meta?: Record<string, unknown>) =>
      (baseLogger as winston.Logger & { success: (msg: string, meta?: object) => void }).success(
        `Completed ${operation}`,
        { service, ...meta }
      ),
    fail: (operation: string, error?: unknown, meta?: Record<string, unknown>) => {
      baseLogger.error(`Failed ${operation}`, {
        service,
        operation,
        failureTime: new Date().toISOString(),
        ...extractErrorMeta(error ?? new Error(`Operation '${operation}' failed`), meta),
      });
    },
    request: (method: string, url: string, status?: number, duration?: number) => {
      if (status && status >= 400) {
        baseLogger.warn(`${method} ${url} failed`, { service, status, duration });
      } else if (duration && duration > 1000) {
        baseLogger.warn(`${method} ${url} slow response`, { service, status, duration });
      }
    },
    system: (event: string, meta?: Record<string, unknown>) => {
      baseLogger.info(`System ${event}`, { service, ...meta });
    },
    database: (action: string, table?: string, meta?: Record<string, unknown>) => {
      const tableStr = table ? ` table=${table}` : '';
      baseLogger.info(`Database ${action}${tableStr}`, { service, ...meta });
    },
  };
}

function shouldLog(level: string, message: string): boolean {
  const spamPatterns = [/^Proxy request/, /^Health check/, /^Static file/, /^CORS/];
  if (level === 'debug' || level === 'info') {
    return !spamPatterns.some((pattern) => pattern.test(message));
  }
  return true;
}

winston.addColors(customLevels.colors);

setupProcessErrorHandlers('web', (message, error, meta) => {
  baseLogger.error(message, {
    service: 'PROCESS',
    ...extractErrorMeta(error, meta),
  });
});
