import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, resolve } from 'path';

/** Directorio `logs/` en la raíz del monorepo (compatible con PM2 cwd core/ o web/backend/). */
export function getLogsDirectory(): string {
  const candidates = [
    resolve(process.cwd(), '../logs'),
    resolve(process.cwd(), '../../logs'),
    resolve(process.cwd(), 'logs'),
  ];

  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }

  const dir = resolve(process.cwd(), '../logs');
  mkdirSync(dir, { recursive: true });
  return dir;
}

export interface LogFileInfo {
  name: string;
  sizeBytes: number;
  modifiedAt: string;
}

/** Lista archivos `.log` en el directorio de logs del monorepo. */
export function listLogFiles(): LogFileInfo[] {
  const dir = getLogsDirectory();
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir)
    .filter((name) => name.endsWith('.log'))
    .map((name) => {
      const filePath = join(dir, name);
      const stat = statSync(filePath);
      return {
        name,
        sizeBytes: stat.size,
        modifiedAt: stat.mtime.toISOString()
      };
    })
    .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
}

/** Últimas N líneas no vacías de un archivo en el directorio de logs. */
export function readLogTail(fileName: string, maxLines = 50): string[] {
  const dir = getLogsDirectory();
  const filePath = join(dir, fileName);
  if (!existsSync(filePath)) {
    return [];
  }

  const content = readFileSync(filePath, 'utf8');
  return content
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .slice(-maxLines);
}

export type ProcessErrorLogger = (
  message: string,
  error: unknown,
  meta?: Record<string, unknown>
) => void;

/** Registra uncaughtException y unhandledRejection — una vez por proceso. */
export function setupProcessErrorHandlers(
  service: string,
  logError: ProcessErrorLogger
): void {
  const key = `__logHandlers_${service}`;
  if ((globalThis as Record<string, unknown>)[key]) return;
  (globalThis as Record<string, unknown>)[key] = true;

  process.on('uncaughtException', (error) => {
    logError(`[${service}] uncaughtException`, error);
  });

  process.on('unhandledRejection', (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logError(`[${service}] unhandledRejection`, error, {
      reason: reason instanceof Error ? undefined : String(reason),
    });
  });
}
