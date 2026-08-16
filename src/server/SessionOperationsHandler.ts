/**
 * SessionOperationsHandler - Handles session-related operations
 * Extracted from LateralThinkingServer to improve maintainability
 */

import type { SessionManager } from '../core/SessionManager.js';
import type { ResponseBuilder } from '../core/ResponseBuilder.js';
import type {
  SessionOperationData,
  LateralThinkingResponse,
  ThinkingOperationData,
} from '../types/index.js';
import {
  ValidationError,
  SessionError,
  CreativeThinkingError,
  ErrorCode,
} from '../errors/types.js';

export class SessionOperationsHandler {
  constructor(
    private sessionManager: SessionManager,
    private responseBuilder: ResponseBuilder
  ) {}

  /**
   * Handle session operations
   */
  async handleSessionOperation(input: SessionOperationData): Promise<LateralThinkingResponse> {
    try {
      switch (input.sessionOperation) {
        case 'save':
          return await this.handleSaveOperation();
        case 'load':
          return await this.handleLoadOperation(input);
        case 'list':
          return await this.handleListOperation(input);
        case 'delete':
          return await this.handleDeleteOperation(input);
        case 'export':
          return await this.handleExportOperation(input);
        default:
          throw new ValidationError(
            ErrorCode.INVALID_INPUT,
            `Unknown session operation: ${input.sessionOperation as string}`,
            'sessionOperation',
            { providedOperation: input.sessionOperation }
          );
      }
    } catch (error) {
      if (error instanceof Error) {
        return this.responseBuilder.buildErrorResponse(error, 'session');
      }
      return this.responseBuilder.buildErrorResponse(
        new CreativeThinkingError(
          ErrorCode.INTERNAL_ERROR,
          'An unexpected error occurred during session operation',
          'session',
          { error: String(error) }
        ),
        'session'
      );
    }
  }

  private async handleSaveOperation(): Promise<LateralThinkingResponse> {
    const currentSessionId = this.sessionManager.getCurrentSessionId();
    if (!currentSessionId) {
      throw new SessionError(ErrorCode.SESSION_NOT_FOUND, 'No active session to save', undefined, {
        operation: 'save',
      });
    }

    await this.sessionManager.saveSessionToPersistence(currentSessionId);
    return this.responseBuilder.buildSessionOperationResponse('save', {
      sessionId: currentSessionId,
      message: 'Session saved successfully',
    });
  }

  private async handleLoadOperation(input: SessionOperationData): Promise<LateralThinkingResponse> {
    if (!input.loadOptions?.sessionId) {
      throw new ValidationError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'sessionId is required for load operation',
        'loadOptions.sessionId'
      );
    }

    const session = await this.sessionManager.loadSessionFromPersistence(
      input.loadOptions.sessionId
    );

    return this.responseBuilder.buildSessionOperationResponse('load', {
      sessionId: input.loadOptions.sessionId,
      session: {
        technique: session.technique,
        problem: session.problem,
        stepsCompleted: session.history.length,
        lastStep: session.history[session.history.length - 1]?.currentStep || 0,
      },
    });
  }

  /**
   * `list` and `delete` degrade gracefully when there is no persistence
   * adapter, and that is deliberate — three tests in `validation.test.ts` hold
   * them to it. What they did not do is say so. `listPersistedSessions`
   * returns `[]` with no adapter, so "0 sessions" was indistinguishable from a
   * configured server holding none; `deletePersistedSession` returns void, so
   * `delete` reported "Session deleted successfully" for a session it had no
   * way to touch. Degrading is fine. Degrading silently is the fault.
   */
  private persistenceAvailable(): boolean {
    return this.sessionManager.getPersistenceAdapter() !== null;
  }

  private async handleListOperation(input: SessionOperationData): Promise<LateralThinkingResponse> {
    const available = this.persistenceAvailable();

    const sessionStates = await this.sessionManager.listPersistedSessions(input.listOptions);

    // Transform SessionState[] to the expected format by converting to SessionData
    const sessions = sessionStates.map(sessionState => ({
      id: sessionState.id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      data: {
        technique: sessionState.technique,
        problem: sessionState.problem,
        startTime: sessionState.startTime,
        endTime: sessionState.endTime,
        lastActivityTime: Date.now(), // Default since SessionState doesn't have this
        insights: sessionState.insights,
        branches: sessionState.branches as Record<string, ThinkingOperationData[]>,
        metrics: sessionState.metrics,
        tags: sessionState.tags,
        name: sessionState.name,
        history: sessionState.history.map(entry => ({
          ...entry.input,
          timestamp: entry.timestamp,
        })) as (ThinkingOperationData & { timestamp: string })[],
      },
    }));

    const formatted = this.responseBuilder.formatSessionList(sessions);
    return this.responseBuilder.buildSessionOperationResponse('list', {
      ...formatted,
      persistenceAvailable: available,
      ...(available
        ? {}
        : {
            note:
              'No persistence adapter is configured, so no sessions can be ' +
              'listed. This empty list means "cannot look", not "none found". ' +
              'Start the server with PERSISTENCE_TYPE set (filesystem or postgres).',
          }),
    });
  }

  private async handleDeleteOperation(
    input: SessionOperationData
  ): Promise<LateralThinkingResponse> {
    if (!input.deleteOptions?.sessionId) {
      throw new ValidationError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'sessionId is required for delete operation',
        'deleteOptions.sessionId'
      );
    }

    const available = this.persistenceAvailable();

    await this.sessionManager.deletePersistedSession(input.deleteOptions.sessionId);
    return this.responseBuilder.buildSessionOperationResponse('delete', {
      sessionId: input.deleteOptions.sessionId,
      persistenceAvailable: available,
      message: available
        ? 'Session deleted successfully'
        : 'No persistence adapter is configured, so nothing was deleted. ' +
          'Start the server with PERSISTENCE_TYPE set (filesystem or postgres).',
    });
  }

  private async handleExportOperation(
    input: SessionOperationData
  ): Promise<LateralThinkingResponse> {
    if (!input.exportOptions?.sessionId) {
      throw new ValidationError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'sessionId is required for export operation',
        'exportOptions.sessionId'
      );
    }

    if (!input.exportOptions?.format) {
      throw new ValidationError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'format is required for export operation',
        'exportOptions.format'
      );
    }

    const validFormats = ['json', 'markdown', 'csv'];
    if (!validFormats.includes(input.exportOptions.format)) {
      throw new ValidationError(
        ErrorCode.INVALID_FIELD_VALUE,
        `Invalid export format: ${input.exportOptions.format}. Must be one of: ${validFormats.join(', ')}`,
        'exportOptions.format',
        { providedFormat: input.exportOptions.format, validFormats }
      );
    }

    const session = this.sessionManager.getSession(input.exportOptions.sessionId);
    if (!session) {
      // Try loading from persistence
      const loadedSession = await this.sessionManager.loadSessionFromPersistence(
        input.exportOptions.sessionId
      );
      if (!loadedSession) {
        throw new SessionError(
          ErrorCode.SESSION_NOT_FOUND,
          `Session ${input.exportOptions.sessionId} not found`,
          input.exportOptions.sessionId
        );
      }
    }

    const sessionData =
      session ||
      (await this.sessionManager.loadSessionFromPersistence(input.exportOptions.sessionId));

    const exportData = this.responseBuilder.formatExportData(
      sessionData,
      input.exportOptions.format
    );

    return this.responseBuilder.buildSessionOperationResponse('export', {
      format: input.exportOptions.format,
      data: exportData,
    });
  }
}
