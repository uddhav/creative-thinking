/**
 * Event Emitter
 *
 * Simple typed event emitter for the SDK
 */

export class EventEmitter<T extends Record<string, any>> {
  private events: Map<keyof T, Set<Function>> = new Map();

  /**
   * Subscribe to an event
   */
  on<K extends keyof T>(event: K, handler: T[K]): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler);
  }

  /**
   * Unsubscribe from an event
   */
  off<K extends keyof T>(event: K, handler: T[K]): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Subscribe to an event once
   */
  once<K extends keyof T>(event: K, handler: T[K]): void {
    const wrappedHandler = ((...args: any[]) => {
      this.off(event, wrappedHandler as any);
      (handler as Function)(...args);
    }) as T[K];

    this.on(event, wrappedHandler);
  }

  /**
   * Emit an event
   */
  emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in event handler for ${String(event)}:`, error);
        }
      });
    }
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(event?: keyof T): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * Get listener count for an event
   */
  listenerCount(event: keyof T): number {
    const handlers = this.events.get(event);
    return handlers ? handlers.size : 0;
  }

  /**
   * Get all event names
   */
  eventNames(): Array<keyof T> {
    return Array.from(this.events.keys());
  }
}
