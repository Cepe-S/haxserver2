/**
 * SISTEMA DE CHAT OPTIMIZADO
 * - Una sola función para enviar mensajes
 * - Mensajes periódicos eficientes
 */

export interface SendMessageOptions {
  // Destinatarios
  target?: number | number[] | null; // null = todos, number = jugador, array = múltiples
  
  // Formato
  color?: number;
  style?: 'normal' | 'bold' | 'italic' | 'small' | 'small-bold';
  sound?: 0 | 1 | 2;
  
  // Timing
  delay?: number;
  
  // Interpolación
  params?: Record<string, any>;
}

export interface ScheduledMessage {
  id: string;
  message: string;
  options: SendMessageOptions;
  interval: number; // ms
  lastSent: number;
  enabled: boolean;
}

export const COLORS = {
  WELCOME: 0x00FF88,
  INFO: 0x00AAFF,
  SUCCESS: 0x00FF00,
  WARNING: 0xFFAA00,
  ERROR: 0xFF0000,
  GOAL: 0x00FF00,
  BALANCE: 0x00AAFF,
  MUTE: 0xFF0000,
  DISCORD: 0x7289DA,
  GOLD: 0xFFD700
} as const;