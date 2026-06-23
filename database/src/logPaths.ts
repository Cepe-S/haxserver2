import { existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

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
