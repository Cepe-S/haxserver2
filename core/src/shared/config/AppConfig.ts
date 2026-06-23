import Joi from 'joi';
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

/** Raíz del monorepo: core/src/shared/config → 4 niveles arriba. */
function resolveRootEnv(): string {
  const fromModule = resolve(__dirname, '../../../../.env');
  if (existsSync(fromModule)) return fromModule;
  const fromCwd = resolve(process.cwd(), '.env');
  if (existsSync(fromCwd)) return fromCwd;
  return resolve(process.cwd(), '../.env');
}

dotenv.config({ path: resolveRootEnv() });

/**
 * Configuración centralizada de la aplicación
 * Regla #9: Toda configuración debe estar centralizada y tipada
 */
export interface AppConfig {
  core: {
    port: number;
    host: string;
  };
  database: {
    url: string;
  };
  haxball: {
    headless: boolean;
    webrtcAnonym: boolean;
  };
  logging: {
    level: string;
  };
}

const configSchema = Joi.object({
  core: Joi.object({
    port: Joi.number().port().default(3001),
    host: Joi.string().default('0.0.0.0'),
  }).required(),
  database: Joi.object({
    url: Joi.string().default('file:./mikuserverpro.db'),
  }).required(),
  haxball: Joi.object({
    headless: Joi.boolean().default(true),
    webrtcAnonym: Joi.boolean().default(true),
  }).required(),
  logging: Joi.object({
    level: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  }).required(),
});

/**
 * Carga y valida la configuración desde variables de entorno
 */
function loadConfig(): AppConfig {
  const config: AppConfig = {
    core: {
      port: parseInt(process.env.CORE_PORT || '3001'),
      host: process.env.CORE_HOST || '0.0.0.0',
    },
    database: {
      url: process.env.DATABASE_URL || 'file:./mikuserverpro.db',
    },
    haxball: {
      headless: process.env.HAXBALL_HEADLESS !== 'false',
      webrtcAnonym: process.env.HAXBALL_WEBRTC_ANONYM !== 'false',
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
    },
  };

  const { error, value } = configSchema.validate(config);
  if (error) {
    throw new Error(`Configuration validation failed: ${error.message}`);
  }

  return value;
}

export const appConfig = loadConfig();