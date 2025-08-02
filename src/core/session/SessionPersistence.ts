/**
 * SessionPersistence - Handles session persistence operations
 * Extracted from SessionManager to improve maintainability
 */

import type { SessionData, ThinkingOperationData } from '../../types/index.js';
import type { PersistenceAdapter } from '../../persistence/adapter.js';
import type { SessionState, PersistenceConfig } from '../../persistence/types.js';
import { createAdapter, getDefaultConfig } from '../../persistence/factory.js';
import { PersistenceError, ErrorCode } from '../../errors/types.js';

export class SessionPersistence {
  private persistenceAdapter: PersistenceAdapter | null = null;
  private initializationPromise: Promise<void> | null = null;
  private isInitialized = false;

  /**
   * Initialize persistence adapter
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this.initializePersistence();
    await this.initializationPromise;
    this.isInitialized = true;
  }

  /**
   * Initialize the persistence adapter
   */
  private async initializePersistence(): Promise<void> {
    // Check if persistence is explicitly configured
    const persistenceType = process.env.PERSISTENCE_TYPE as
      | PersistenceConfig['adapter']
      | undefined;

    if (!persistenceType) {
      // No persistence configured - use memory-only
      console.error('[SessionManager] No persistence configured. Using in-memory storage only.');
      return;
    }

    const persistenceConfig = getDefaultConfig(persistenceType);
    if (!persistenceConfig || persistenceConfig.adapter === 'memory') {
      console.error('[SessionManager] Using in-memory persistence (no data will be saved to disk)');
      return;
    }

    try {
      this.persistenceAdapter = await createAdapter(persistenceConfig);
      console.error('[SessionManager] Persistence adapter initialized successfully');
    } catch (error) {
      console.error('[SessionManager] Failed to initialize persistence:', error);
      // Continue without persistence - sessions will be memory-only
    }
  }

  /**
   * Save session to persistent storage
   */
  async saveSession(sessionId: string, session: SessionData): Promise<void> {
    await this.initialize();

    if (!this.persistenceAdapter) {
      throw new PersistenceError(
        ErrorCode.PERSISTENCE_NOT_AVAILABLE,
        'Persistence adapter is not available'
      );
    }

    try {
      const sessionState = this.convertToSessionState(sessionId, session);
      await this.persistenceAdapter.save(sessionId, sessionState);
    } catch (error) {
      if (error instanceof PersistenceError) {
        throw error;
      }
      throw new PersistenceError(
        ErrorCode.PERSISTENCE_ERROR,
        `Failed to save session ${sessionId}`,
        'saveSession',
        { originalError: error }
      );
    }
  }

  /**
   * Load session from persistent storage
   */
  async loadSession(sessionId: string): Promise<SessionData> {
    await this.initialize();

    if (!this.persistenceAdapter) {
      throw new PersistenceError(
        ErrorCode.PERSISTENCE_NOT_AVAILABLE,
        'Persistence adapter is not available'
      );
    }

    try {
      const sessionState = await this.persistenceAdapter.load(sessionId);
      if (!sessionState) {
        throw new PersistenceError(
          ErrorCode.SESSION_NOT_FOUND,
          `Session ${sessionId} not found`,
          'loadSession',
          { sessionId }
        );
      }
      return this.convertFromSessionState(sessionState);
    } catch (error) {
      if (error instanceof PersistenceError) {
        throw error;
      }
      throw new PersistenceError(
        ErrorCode.PERSISTENCE_ERROR,
        `Failed to load session ${sessionId}`,
        'loadSession',
        { originalError: error }
      );
    }
  }

  /**
   * List persisted sessions with optional filtering
   */
  async listPersistedSessions(options?: {
    limit?: number;
    offset?: number;
    sortBy?: 'created' | 'updated' | 'name' | 'technique';
    order?: 'asc' | 'desc';
  }): Promise<SessionState[]> {
    await this.initialize();

    if (!this.persistenceAdapter) {
      return [];
    }

    try {
      const metadata = await this.persistenceAdapter.list(options);
      // Convert SessionMetadata[] to SessionState[] by loading each session
      const sessionStates: SessionState[] = [];
      for (const meta of metadata) {
        try {
          const state = await this.persistenceAdapter.load(meta.id);
          if (state) {
            sessionStates.push(state);
          }
        } catch (error) {
          console.error(`[SessionManager] Failed to load session ${meta.id} for listing:`, error);
        }
      }
      return sessionStates;
    } catch (error) {
      console.error('[SessionManager] Failed to list persisted sessions:', error);
      return [];
    }
  }

  /**
   * Delete a persisted session
   */
  async deletePersistedSession(sessionId: string): Promise<void> {
    await this.initialize();

    if (!this.persistenceAdapter) {
      return;
    }

    try {
      await this.persistenceAdapter.delete(sessionId);
    } catch (error) {
      console.error(`[SessionManager] Failed to delete persisted session ${sessionId}:`, error);
    }
  }

  /**
   * Get the persistence adapter
   */
  getPersistenceAdapter(): PersistenceAdapter | null {
    return this.persistenceAdapter;
  }

  /**
   * Convert SessionData to SessionState for persistence
   */
  private convertToSessionState(sessionId: string, session: SessionData): SessionState {
    return {
      id: sessionId,
      problem: session.problem,
      technique: session.technique,
      currentStep: session.history.length,
      totalSteps: session.history.length,
      startTime: session.startTime,
      endTime: session.endTime,
      insights: session.insights,
      branches: session.branches,
      metrics: session.metrics,
      tags: session.tags,
      name: session.name,
      // Convert history to the expected format
      history: session.history.map((entry, index) => ({
        step: index + 1,
        timestamp: entry.timestamp || new Date().toISOString(),
        input: entry as ThinkingOperationData,
        output: entry as ThinkingOperationData,
      })),
    };
  }

  /**
   * Convert SessionState back to SessionData
   */
  private convertFromSessionState(sessionState: SessionState): SessionData {
    return {
      technique: sessionState.technique,
      problem: sessionState.problem,
      startTime: sessionState.startTime,
      endTime: sessionState.endTime,
      lastActivityTime: Date.now(), // Default to current time since SessionState doesn't have this
      insights: sessionState.insights,
      branches: sessionState.branches as Record<string, ThinkingOperationData[]>,
      metrics: sessionState.metrics,
      tags: sessionState.tags,
      name: sessionState.name,
      // Convert history back to ThinkingOperationData format
      history: sessionState.history.map(entry => ({
        ...entry.input,
        timestamp: entry.timestamp,
      })) as (ThinkingOperationData & { timestamp: string })[],
    };
  }
}
