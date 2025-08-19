/**
 * Base Transport
 *
 * Abstract base class for all transport implementations
 */

import { EventEmitter } from '../utils/EventEmitter.js';
import type {
  Transport,
  TransportConfig,
  TransportState,
  ClientEvents,
  ClientOptions,
} from '../types.js';

export abstract class BaseTransport extends EventEmitter<ClientEvents> implements Transport {
  protected config: TransportConfig;
  protected state: TransportState = 'disconnected';
  protected retryCount = 0;
  protected retryTimer?: NodeJS.Timeout;

  constructor(config: TransportConfig) {
    super();
    this.config = config;
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract send(method: string, params: any): Promise<any>;
  abstract request<T = any>(method: string, params?: any, options?: ClientOptions): Promise<T>;

  isConnected(): boolean {
    return this.state === 'connected';
  }

  getState(): TransportState {
    return this.state;
  }

  protected setState(state: TransportState): void {
    if (this.state !== state) {
      this.state = state;
      this.emit('stateChange', state);
    }
  }

  protected async handleAutoReconnect(): Promise<void> {
    if (!this.config.autoReconnect || this.state === 'connected') {
      return;
    }

    if (this.retryCount >= (this.config.maxReconnectAttempts || 5)) {
      this.setState('disconnected');
      this.emit('error', new Error('Max reconnection attempts reached'));
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.retryCount), this.config.reconnectDelay || 5000);

    this.retryTimer = setTimeout(async () => {
      this.retryCount++;
      this.setState('reconnecting');

      try {
        await this.connect();
        this.retryCount = 0;
      } catch (error) {
        await this.handleAutoReconnect();
      }
    }, delay);
  }

  protected cleanup(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = undefined;
    }
    this.retryCount = 0;
  }
}
