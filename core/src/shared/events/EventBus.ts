import { EventEmitter } from 'events';
import { createLogger } from '../logger/Logger';

/**
 * Sistema de eventos centralizado para comunicación entre subsistemas
 * Regla #4: Separación de responsabilidades - comunicación solo a través de eventos
 */
export class EventBus extends EventEmitter {
  private static instance: EventBus;
  private logger = createLogger('EventBus');
  /** Maps original listener → wrapped listener registered on EventEmitter */
  private listenerWrappers = new Map<(...args: any[]) => void, (...args: any[]) => void>();

  private constructor() {
    super();
    this.setMaxListeners(50); // Aumentar límite para múltiples listeners
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Emite un evento con logging automático
   */
  public emitEvent(event: string, data?: any): boolean {
    this.logger.debug(`[EventBus] Emitting event: ${event}`, data);
    return this.emit(event, data);
  }

  /**
   * Registra un listener con captura de errores sync/async
   */
  public onEvent(event: string, listener: (...args: any[]) => void | Promise<void>): this {
    const wrapped = this.wrapListener(event, listener);
    this.listenerWrappers.set(listener, wrapped);
    return this.on(event, wrapped);
  }

  /**
   * Registra un listener que se ejecuta solo una vez
   */
  public onceEvent(event: string, listener: (...args: any[]) => void | Promise<void>): this {
    const wrapped = this.wrapListener(event, listener, () => {
      this.listenerWrappers.delete(listener);
    });
    this.listenerWrappers.set(listener, wrapped);
    return this.once(event, wrapped);
  }

  /**
   * Remueve un listener específico
   */
  public offEvent(event: string, listener: (...args: any[]) => void): this {
    this.logger.debug(`[EventBus] Removing listener for: ${event}`);
    const wrapped = this.listenerWrappers.get(listener);
    if (wrapped) {
      this.listenerWrappers.delete(listener);
      return this.off(event, wrapped);
    }
    return this.off(event, listener);
  }

  private wrapListener(
    event: string,
    listener: (...args: any[]) => void | Promise<void>,
    onComplete?: () => void
  ): (...args: any[]) => void {
    return (...args: any[]) => {
      try {
        const result = listener(...args);
        if (result && typeof (result as Promise<void>).then === 'function') {
          (result as Promise<void>)
            .catch((err) => {
              this.logger.error(`Async handler failed for event: ${event}`, err, { event });
            })
            .finally(() => onComplete?.());
        } else {
          onComplete?.();
        }
      } catch (err) {
        this.logger.error(`Sync handler failed for event: ${event}`, err, { event });
        onComplete?.();
      }
    };
  }

  /**
   * Remueve todos los listeners de un evento
   */
  public removeAllListenersForEvent(event?: string): this {
    this.logger.debug(`[EventBus] Removing all listeners${event ? ` for: ${event}` : ''}`);
    return this.removeAllListeners(event);
  }
}

/**
 * Instancia global del EventBus
 */
export const eventBus = EventBus.getInstance();