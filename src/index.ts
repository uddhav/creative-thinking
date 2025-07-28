#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import chalk from 'chalk';
import { randomUUID } from 'crypto';
import {
  ErrorCode,
  ValidationError,
  SessionError,
  ExecutionError,
  PersistenceError,
  createErrorResponse,
} from './errors/index.js';
import type {
  PersistenceAdapter,
  SessionState as PersistenceSessionState,
  SessionMetadata,
  ExportFormat,
} from './persistence/index.js';
import { createAdapter, getDefaultConfig } from './persistence/index.js';
import type { PathMemory } from './ergodicity/index.js';
import { ErgodicityManager } from './ergodicity/index.js';
import { BarrierWarningLevel } from './ergodicity/earlyWarning/types.js';
import type { EarlyWarningState, EscapeProtocol } from './ergodicity/earlyWarning/types.js';

export type LateralTechnique =
  | 'six_hats'
  | 'po'
  | 'random_entry'
  | 'scamper'
  | 'concept_extraction'
  | 'yes_and'
  | 'design_thinking'
  | 'triz'
  | 'neural_state'
  | 'temporal_work';
export type SixHatsColor = 'blue' | 'white' | 'red' | 'yellow' | 'black' | 'green' | 'purple';
export type ScamperAction =
  | 'substitute'
  | 'combine'
  | 'adapt'
  | 'modify'
  | 'put_to_other_use'
  | 'eliminate'
  | 'reverse';
export type DesignThinkingStage = 'empathize' | 'define' | 'ideate' | 'prototype' | 'test';

// Layered Tool Architecture Types
interface TechniqueRecommendation {
  technique: LateralTechnique;
  score: number;
  reasoning: string;
  bestFor: string[];
  limitations: string[];
}

interface DiscoverTechniquesInput {
  problem: string;
  context?: string;
  preferredOutcome?: 'innovative' | 'systematic' | 'risk-aware' | 'collaborative' | 'analytical';
  constraints?: string[];
  sessionId?: string; // Optional: if provided, can check flexibility and generate options
  currentFlexibility?: number; // Optional: current flexibility score (0-1)
}

interface DiscoverTechniquesOutput {
  recommendations: TechniqueRecommendation[];
  reasoning: string;
  suggestedWorkflow?: string;
  flexibilityWarning?: {
    currentFlexibility: number;
    isLow: boolean;
    message: string;
  };
  generatedOptions?: {
    totalOptions: number;
    topOptions: Array<{
      name: string;
      description: string;
      strategy: string;
      flexibilityGain: number;
      actions: string[];
    }>;
    recommendation: string;
  };
  escapeVelocityAnalysis?: {
    needed: boolean;
    urgency: 'critical' | 'high' | 'medium' | 'low';
    constraintStrength: number;
    availableProtocols: string[];
    recommendation: string;
  };
}

interface ThinkingStep {
  technique: LateralTechnique;
  stepNumber: number;
  description: string;
  expectedOutputs: string[];
  riskConsiderations?: string[];
}

interface PlanThinkingSessionInput {
  problem: string;
  techniques: LateralTechnique[];
  objectives?: string[];
  constraints?: string[];
  timeframe?: 'quick' | 'thorough' | 'comprehensive';
  sessionId?: string; // Optional: to check flexibility and options
  includeOptions?: boolean; // Whether to include option generation in the plan
}

interface PlanThinkingSessionOutput {
  planId: string;
  workflow: ThinkingStep[];
  optionGenerationPhase?: {
    reason: string;
    suggestedOptions: number;
    priority: 'critical' | 'recommended' | 'optional';
  };
  escapeProtocolPhase?: {
    needed: boolean;
    protocol: string;
    reason: string;
    prerequisite: boolean; // Whether this must be done before the workflow
  };
  estimatedSteps: number;
  objectives: string[];
  successCriteria: string[];
  createdAt: number; // Timestamp for TTL cleanup
}

interface ExecuteThinkingStepInput {
  planId: string; // Now required
  sessionId?: string;
  technique: LateralTechnique;
  problem: string;
  currentStep: number;
  totalSteps: number;
  output: string;
  nextStepNeeded: boolean;

  // All existing technique-specific fields from LateralThinkingData
  hatColor?: SixHatsColor;
  provocation?: string;
  principles?: string[];
  randomStimulus?: string;
  connections?: string[];
  scamperAction?: ScamperAction;
  successExample?: string;
  extractedConcepts?: string[];
  abstractedPatterns?: string[];
  applications?: string[];
  initialIdea?: string;
  additions?: string[];
  evaluations?: string[];
  synthesis?: string;
  designStage?: DesignThinkingStage;
  empathyInsights?: string[];
  problemStatement?: string;
  failureModesPredicted?: string[];
  ideaList?: string[];
  prototypeDescription?: string;
  stressTestResults?: string[];
  userFeedback?: string[];
  failureInsights?: string[];
  contradiction?: string;
  inventivePrinciples?: string[];
  viaNegativaRemovals?: string[];
  minimalSolution?: string;
  risks?: string[];
  failureModes?: string[];
  mitigations?: string[];
  antifragileProperties?: string[];
  blackSwans?: string[];
  isRevision?: boolean;
  revisesStep?: number;
  branchFromStep?: number;
  branchId?: string;

  // Neural State Optimization fields
  dominantNetwork?: 'dmn' | 'ecn'; // Default Mode Network vs Executive Control Network
  suppressionDepth?: number;
  switchingRhythm?: string[];
  integrationInsights?: string[];

  // Temporal Work Design fields
  temporalLandscape?: {
    fixedDeadlines?: string[];
    flexibleWindows?: string[];
    pressurePoints?: string[];
    deadZones?: string[];
    kairosOpportunities?: string[];
  };
  circadianAlignment?: string[];
  pressureTransformation?: string[];
  asyncSyncBalance?: string[];
  temporalEscapeRoutes?: string[];
}

// Base interface for thinking operations
export interface ThinkingOperationData {
  sessionId?: string; // For continuing existing sessions
  technique: LateralTechnique;
  problem: string;
  currentStep: number;
  totalSteps: number;
  output: string;
  nextStepNeeded: boolean;

  // Technique-specific data
  hatColor?: SixHatsColor;
  provocation?: string;
  principles?: string[];
  randomStimulus?: string;
  connections?: string[];
  scamperAction?: ScamperAction;

  // Concept Extraction specific
  successExample?: string;
  extractedConcepts?: string[];
  abstractedPatterns?: string[];
  applications?: string[];

  // Yes, And... specific
  initialIdea?: string;
  additions?: string[];
  evaluations?: string[];
  synthesis?: string;

  // Design Thinking specific
  designStage?: DesignThinkingStage;
  empathyInsights?: string[];
  problemStatement?: string;
  failureModesPredicted?: string[];
  ideaList?: string[];
  prototypeDescription?: string;
  stressTestResults?: string[];
  userFeedback?: string[];
  failureInsights?: string[];

  // TRIZ specific
  contradiction?: string;
  inventivePrinciples?: string[];
  viaNegativaRemovals?: string[];
  minimalSolution?: string;

  // Unified Framework: Risk/Adversarial fields
  risks?: string[];
  failureModes?: string[];
  mitigations?: string[];
  antifragileProperties?: string[];
  blackSwans?: string[];

  // Optional fields for advanced features
  isRevision?: boolean;
  revisesStep?: number;
  branchFromStep?: number;
  branchId?: string;

  // Auto-save preference
  autoSave?: boolean;

  // Neural State Optimization fields
  dominantNetwork?: 'dmn' | 'ecn'; // Default Mode Network vs Executive Control Network
  suppressionDepth?: number;
  switchingRhythm?: string[];
  integrationInsights?: string[];

  // Temporal Work Design fields
  temporalLandscape?: {
    fixedDeadlines?: string[];
    flexibleWindows?: string[];
    pressurePoints?: string[];
    deadZones?: string[];
    kairosOpportunities?: string[];
  };
  circadianAlignment?: string[];
  pressureTransformation?: string[];
  asyncSyncBalance?: string[];
  temporalEscapeRoutes?: string[];
}

// Interface for session management operations
export interface SessionOperationData {
  sessionOperation: 'save' | 'load' | 'list' | 'delete' | 'export';

  // Save operation options
  saveOptions?: {
    sessionName?: string;
    tags?: string[];
    asTemplate?: boolean;
  };

  // Load operation options
  loadOptions?: {
    sessionId: string;
    continueFrom?: number;
  };

  // List operation options
  listOptions?: {
    limit?: number;
    technique?: LateralTechnique;
    status?: 'active' | 'completed' | 'all';
    tags?: string[];
    searchTerm?: string;
  };

  // Delete operation options
  deleteOptions?: {
    sessionId: string;
    confirm?: boolean;
  };

  // Export operation options
  exportOptions?: {
    sessionId: string;
    format: 'json' | 'markdown' | 'csv';
    outputPath?: string;
  };
}

// Union type for all lateral thinking operations
export type LateralThinkingData = ThinkingOperationData | SessionOperationData;

export interface SessionData {
  technique: LateralTechnique;
  problem: string;
  history: Array<ThinkingOperationData & { timestamp: string }>;
  branches: Record<string, ThinkingOperationData[]>;
  insights: string[];
  // Meta-learning data
  startTime?: number;
  endTime?: number;
  lastActivityTime: number; // Single timestamp for cleanup tracking
  metrics?: {
    creativityScore?: number;
    risksCaught?: number;
    antifragileFeatures?: number;
  };
  // Session management fields
  tags?: string[];
  name?: string;
  // Ergodicity tracking
  pathMemory?: PathMemory;
  ergodicityManager?: ErgodicityManager;
  // Early warning system
  earlyWarningState?: EarlyWarningState;
  escapeRecommendation?: EscapeProtocol;
}

interface LateralThinkingResponse {
  sessionId: string;
  technique: LateralTechnique;
  currentStep: number;
  totalSteps: number;
  nextStepNeeded: boolean;
  historyLength: number;
  branches: string[];
  completed?: boolean;
  insights?: string[];
  summary?: string;
  metrics?: {
    duration: number;
    creativityScore: number;
    risksCaught?: number;
    antifragileFeatures?: number;
  };
  nextStepGuidance?: string;
  autoSaveError?: string;

  // Memory-suggestive fields
  contextualInsight?: string;
  historicalNote?: string;
  patternObserved?: string;
  sessionFingerprint?: {
    problemType: string;
    solutionPattern: string;
    breakthroughLevel: number;
    pathDependencies: string[];
  };
  noteworthyPatterns?: {
    observed: string;
    significance: string;
    applicability: string[];
  };
}

// Session management configuration
interface SessionConfig {
  maxSessions: number;
  maxSessionSize: number;
  sessionTTL: number;
  cleanupInterval: number;
  enableMemoryMonitoring: boolean;
}

export class LateralThinkingServer {
  private sessions: Map<string, SessionData> = new Map();
  private plans: Map<string, PlanThinkingSessionOutput> = new Map();
  private currentSessionId: string | null = null;
  private disableThoughtLogging: boolean;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private persistenceAdapter: PersistenceAdapter | null = null;
  private ergodicityManager: ErgodicityManager;

  // Session configuration with defaults
  private config: SessionConfig = {
    maxSessions: parseInt(process.env.MAX_SESSIONS || '100', 10),
    maxSessionSize: parseInt(process.env.MAX_SESSION_SIZE || String(1024 * 1024), 10), // 1MB default
    sessionTTL: parseInt(process.env.SESSION_TTL || String(24 * 60 * 60 * 1000), 10), // 24 hours
    cleanupInterval: parseInt(process.env.CLEANUP_INTERVAL || String(60 * 60 * 1000), 10), // 1 hour
    enableMemoryMonitoring: process.env.ENABLE_MEMORY_MONITORING === 'true',
  };
  private readonly PLAN_TTL = 4 * 60 * 60 * 1000; // 4 hours for plans

  constructor() {
    this.disableThoughtLogging =
      (process.env.DISABLE_THOUGHT_LOGGING || '').toLowerCase() === 'true';
    this.ergodicityManager = new ErgodicityManager();
    this.startSessionCleanup();
    void this.initializePersistence();
  }

  private async initializePersistence(): Promise<void> {
    try {
      const persistenceType = (process.env.PERSISTENCE_TYPE || 'filesystem') as
        | 'filesystem'
        | 'memory';
      const config = getDefaultConfig(persistenceType);

      // Override with environment variables if provided
      if (process.env.PERSISTENCE_PATH) {
        config.options.path = process.env.PERSISTENCE_PATH;
      }

      this.persistenceAdapter = await createAdapter(config);
    } catch (error) {
      console.error('Failed to initialize persistence:', error);
      // Continue without persistence
    }
  }

  private startSessionCleanup(): void {
    // Run cleanup at configured interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldSessions();
    }, this.config.cleanupInterval);
  }

  /**
   * Update session activity time
   */
  private touchSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivityTime = Date.now();
    }
  }

  private cleanupOldSessions(): void {
    const now = Date.now();

    // Simple cleanup based on lastActivityTime
    for (const [id, session] of this.sessions) {
      if (now - session.lastActivityTime > this.config.sessionTTL) {
        this.sessions.delete(id);
        if (this.currentSessionId === id) {
          this.currentSessionId = null;
        }
      }
    }

    // Clean up old plans
    for (const [planId, plan] of this.plans) {
      if (plan.createdAt && now - plan.createdAt > this.PLAN_TTL) {
        this.plans.delete(planId);
      }
    }

    // Evict oldest sessions if we exceed max sessions
    if (this.sessions.size > this.config.maxSessions) {
      this.evictOldestSessions();
    }

    // Log memory usage if monitoring is enabled
    if (this.config.enableMemoryMonitoring) {
      this.logMemoryMetrics();
    }
  }

  /**
   * Evict oldest sessions using LRU (Least Recently Used) strategy
   */
  private evictOldestSessions(): void {
    // Check if we're over the session limit
    if (this.sessions.size <= this.config.maxSessions) {
      return;
    }

    // Convert sessions to array with session IDs and lastActivityTime
    const sessionList = Array.from(this.sessions.entries()).map(([id, session]) => ({
      id,
      lastActivityTime: session.lastActivityTime,
    }));

    // Sort by lastActivityTime (oldest first)
    sessionList.sort((a, b) => a.lastActivityTime - b.lastActivityTime);

    // Calculate how many sessions to evict
    const sessionsToEvict = this.sessions.size - this.config.maxSessions;

    // Evict the oldest sessions
    for (let i = 0; i < sessionsToEvict && i < sessionList.length; i++) {
      const sessionId = sessionList[i].id;
      this.sessions.delete(sessionId);

      // Clear current session ID if it was evicted
      if (this.currentSessionId === sessionId) {
        this.currentSessionId = null;
      }

      // Log eviction if monitoring is enabled
      if (this.config.enableMemoryMonitoring) {
        // eslint-disable-next-line no-console
        console.log(`[Session Eviction] Evicted session ${sessionId} (LRU)`);
      }
    }
  }

  /**
   * Log memory usage metrics
   */
  private logMemoryMetrics(): void {
    const memoryUsage = process.memoryUsage();
    const sessionCount = this.sessions.size;
    const planCount = this.plans.size;

    // Estimate session memory usage
    let totalSessionSize = 0;
    for (const [_, session] of this.sessions) {
      // Rough estimate: history items * average size + base overhead
      const historySize = session.history.length * 1024; // ~1KB per history item
      const branchesSize = Object.keys(session.branches).length * 512; // ~512B per branch
      const sessionSize = historySize + branchesSize + 2048; // 2KB base overhead
      totalSessionSize += sessionSize;
    }

    // eslint-disable-next-line no-console
    console.log('[Memory Metrics]', {
      timestamp: new Date().toISOString(),
      process: {
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      },
      sessions: {
        count: sessionCount,
        estimatedSize: `${Math.round(totalSessionSize / 1024)}KB`,
        averageSize:
          sessionCount > 0 ? `${Math.round(totalSessionSize / sessionCount / 1024)}KB` : '0KB',
      },
      plans: {
        count: planCount,
      },
    });

    // Warn if memory usage is high
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    if (heapUsedMB > 500) {
      console.warn('[Memory Warning] Heap usage exceeds 500MB');
    }
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.sessions.clear();
  }

  /**
   * Handle session management operations
   */
  private async handleSessionOperation(
    input: SessionOperationData
  ): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    if (!this.persistenceAdapter) {
      const errorResponse = createErrorResponse(
        new PersistenceError(ErrorCode.PERSISTENCE_NOT_AVAILABLE, 'Persistence not available'),
        'persistence'
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(errorResponse, null, 2),
          },
        ],
        isError: true,
      };
    }

    switch (input.sessionOperation) {
      case 'save':
        return this.handleSaveOperation(input);
      case 'load':
        return this.handleLoadOperation(input);
      case 'list':
        return this.handleListOperation(input);
      case 'delete':
        return this.handleDeleteOperation(input);
      case 'export':
        return this.handleExportOperation(input);
      default: {
        const errorResponse = createErrorResponse(
          new ValidationError(
            ErrorCode.INVALID_FIELD_VALUE,
            `Unknown session operation: ${input.sessionOperation as string}`,
            'sessionOperation'
          ),
          'session'
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(errorResponse, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  }

  /**
   * Save current session
   */
  private async handleSaveOperation(
    input: SessionOperationData
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      if (!this.currentSessionId || !this.sessions.has(this.currentSessionId)) {
        throw new SessionError(
          ErrorCode.SESSION_NOT_FOUND,
          'No active session to save',
          this.currentSessionId || undefined
        );
      }

      const session = this.sessions.get(this.currentSessionId);
      if (!session) {
        throw new SessionError(
          ErrorCode.SESSION_NOT_FOUND,
          'Session not found',
          this.currentSessionId || undefined
        );
      }
      this.touchSession(this.currentSessionId);

      // Update session with save options
      if (input.saveOptions?.sessionName) {
        session.name = input.saveOptions.sessionName;
      }
      if (input.saveOptions?.tags) {
        session.tags = input.saveOptions.tags;
      }

      await this.saveSessionToPersistence(this.currentSessionId, session);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                sessionId: this.currentSessionId,
                message: 'Session saved successfully',
                savedAt: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const errorResponse = createErrorResponse(error, 'session');
      return Promise.resolve({
        content: [
          {
            type: 'text',
            text: JSON.stringify(errorResponse, null, 2),
          },
        ],
      });
    }
  }

  /**
   * Load a saved session
   */
  private async handleLoadOperation(
    input: SessionOperationData
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      if (!input.loadOptions?.sessionId) {
        throw new ValidationError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Session ID required for load operation',
          'loadOptions.sessionId'
        );
      }

      if (!this.persistenceAdapter) {
        throw new PersistenceError(
          ErrorCode.PERSISTENCE_NOT_AVAILABLE,
          'Persistence adapter not initialized'
        );
      }
      const loadedState = await this.persistenceAdapter.load(input.loadOptions.sessionId);
      if (!loadedState) {
        throw new SessionError(
          ErrorCode.SESSION_NOT_FOUND,
          'Session not found',
          this.currentSessionId || undefined
        );
      }

      // Convert persistence state to session data
      const session: SessionData = {
        technique: loadedState.technique,
        problem: loadedState.problem,
        history: loadedState.history.map(h => ({
          ...h.input,
          timestamp: h.timestamp,
          // Ensure technique-specific fields are typed correctly
          hatColor: h.input.hatColor as SixHatsColor | undefined,
          scamperAction: h.input.scamperAction as ScamperAction | undefined,
          designStage: h.input.designStage as DesignThinkingStage | undefined,
        })),
        branches: Object.entries(loadedState.branches).reduce(
          (acc, [key, value]) => {
            acc[key] = value as ThinkingOperationData[];
            return acc;
          },
          {} as Record<string, ThinkingOperationData[]>
        ),
        insights: loadedState.insights,
        startTime: loadedState.startTime,
        endTime: loadedState.endTime,
        metrics: loadedState.metrics,
        tags: loadedState.tags,
        name: loadedState.name,
        lastActivityTime: Date.now(), // Update activity time on load
      };

      // Load into memory
      this.sessions.set(loadedState.id, session);
      this.currentSessionId = loadedState.id;

      const continueFrom = input.loadOptions.continueFrom || session.history.length;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                sessionId: loadedState.id,
                technique: session.technique,
                problem: session.problem,
                currentStep: continueFrom,
                totalSteps:
                  session.history[0]?.totalSteps || this.getTechniqueSteps(session.technique),
                message: 'Session loaded successfully',
                continueFrom,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const errorResponse = createErrorResponse(error, 'session');
      return Promise.resolve({
        content: [
          {
            type: 'text',
            text: JSON.stringify(errorResponse, null, 2),
          },
        ],
      });
    }
  }

  /**
   * List saved sessions
   */
  private async handleListOperation(
    input: SessionOperationData
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      const options = input.listOptions || {};
      if (!this.persistenceAdapter) {
        throw new PersistenceError(
          ErrorCode.PERSISTENCE_NOT_AVAILABLE,
          'Persistence adapter not initialized'
        );
      }
      const metadata = await this.persistenceAdapter.list(options);

      // Format visual output
      const visualOutput = this.formatSessionList(metadata);

      return {
        content: [
          {
            type: 'text',
            text: visualOutput,
          },
        ],
      };
    } catch (error) {
      const errorResponse = createErrorResponse(error, 'persistence');
      return Promise.resolve({
        content: [
          {
            type: 'text',
            text: JSON.stringify(errorResponse, null, 2),
          },
        ],
      });
    }
  }

  /**
   * Delete a saved session
   */
  private async handleDeleteOperation(
    input: SessionOperationData
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      if (!input.deleteOptions?.sessionId) {
        throw new ValidationError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Session ID required for delete operation',
          'deleteOptions.sessionId'
        );
      }

      if (!this.persistenceAdapter) {
        throw new PersistenceError(
          ErrorCode.PERSISTENCE_NOT_AVAILABLE,
          'Persistence adapter not initialized'
        );
      }
      const deleted = await this.persistenceAdapter.delete(input.deleteOptions.sessionId);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: deleted,
                sessionId: input.deleteOptions.sessionId,
                message: deleted ? 'Session deleted successfully' : 'Session not found',
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const errorResponse = createErrorResponse(error, 'persistence');
      return Promise.resolve({
        content: [
          {
            type: 'text',
            text: JSON.stringify(errorResponse, null, 2),
          },
        ],
      });
    }
  }

  /**
   * Export a session
   */
  private async handleExportOperation(
    input: SessionOperationData
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      if (!input.exportOptions?.sessionId || !input.exportOptions?.format) {
        throw new ValidationError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Session ID and format required for export operation'
        );
      }

      if (!this.persistenceAdapter) {
        throw new PersistenceError(
          ErrorCode.PERSISTENCE_NOT_AVAILABLE,
          'Persistence adapter not initialized'
        );
      }
      const data = await this.persistenceAdapter.export(
        input.exportOptions.sessionId,
        input.exportOptions.format as ExportFormat
      );

      return {
        content: [
          {
            type: 'text',
            text: data.toString(),
          },
        ],
      };
    } catch (error) {
      const errorResponse = createErrorResponse(error, 'persistence');
      return Promise.resolve({
        content: [
          {
            type: 'text',
            text: JSON.stringify(errorResponse, null, 2),
          },
        ],
      });
    }
  }

  /**
   * Save session to persistence adapter
   */
  private async saveSessionToPersistence(sessionId: string, session: SessionData): Promise<void> {
    if (!this.persistenceAdapter) return;

    const state: PersistenceSessionState = {
      id: sessionId,
      problem: session.problem,
      technique: session.technique,
      currentStep: session.history.length,
      totalSteps: session.history[0]?.totalSteps || this.getTechniqueSteps(session.technique),
      history: session.history.map((item, index) => ({
        step: index + 1,
        timestamp: item.timestamp || new Date().toISOString(),
        input: item,
        output: item,
      })),
      branches: session.branches,
      insights: session.insights,
      startTime: session.startTime,
      endTime: session.endTime,
      metrics: session.metrics,
      tags: session.tags,
      name: session.name,
    };

    await this.persistenceAdapter.save(sessionId, state);
  }

  /**
   * Format session list for visual output
   */
  private formatSessionList(metadata: SessionMetadata[]): string {
    const lines: string[] = [
      '',
      chalk.bold('📚 Saved Creative Thinking Sessions'),
      '═'.repeat(50),
      '',
    ];

    if (metadata.length === 0) {
      lines.push('No saved sessions found.');
      return lines.join('\n');
    }

    for (const session of metadata) {
      const emoji = this.getTechniqueEmoji(session.technique);
      const progress = this.formatProgress(session.stepsCompleted, session.totalSteps);
      const status = session.status === 'completed' ? '✓' : '';
      const timeAgo = this.formatTimeAgo(session.updatedAt);

      lines.push(`📝 ${chalk.bold(session.name || session.problem)}`);
      lines.push(`   Technique: ${emoji} ${session.technique.replace('_', ' ').toUpperCase()}`);
      lines.push(
        `   Progress: ${progress} ${session.stepsCompleted}/${session.totalSteps} steps ${status}`
      );
      lines.push(`   Updated: ${timeAgo}`);

      if (session.tags.length > 0) {
        lines.push(`   Tags: ${session.tags.join(', ')}`);
      }

      lines.push('');
    }

    lines.push(`Showing ${metadata.length} sessions.`);
    return lines.join('\n');
  }

  /**
   * Get emoji for technique
   */
  private getTechniqueEmoji(technique: LateralTechnique): string {
    const emojis = {
      six_hats: '🎩',
      po: '💡',
      random_entry: '🎲',
      scamper: '🔄',
      concept_extraction: '🔍',
      yes_and: '🤝',
      design_thinking: '💭',
      triz: '⚙️',
      neural_state: '🧩',
      temporal_work: '⏰',
    };
    return emojis[technique] || '🧠';
  }

  /**
   * Format progress bar
   */
  private formatProgress(completed: number, total: number): string {
    const _percentage = Math.round((completed / total) * 100);
    const filled = Math.round((completed / total) * 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  /**
   * Format time ago
   */
  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
  }

  /**
   * Get enhanced Six Thinking Hats information including Black Swan awareness
   * @param color - The hat color to get information for
   * @returns Hat information with name, focus, emoji, and enhanced focus
   */
  private getSixHatsInfo(color: SixHatsColor): {
    name: string;
    focus: string;
    emoji: string;
    enhancedFocus?: string;
  } {
    const hatsInfo = {
      blue: {
        name: 'Blue Hat Plus',
        focus: 'Process control and overview',
        emoji: '🔵',
        enhancedFocus: 'Process control with meta-uncertainty awareness',
      },
      white: {
        name: 'White Hat Plus',
        focus: 'Facts and information',
        emoji: '⚪',
        enhancedFocus: 'Facts and information including unknown unknowns',
      },
      red: {
        name: 'Red Hat Plus',
        focus: 'Emotions and intuition',
        emoji: '🔴',
        enhancedFocus: 'Emotions, intuition, and collective behavior prediction',
      },
      yellow: {
        name: 'Yellow Hat Plus',
        focus: 'Optimism and benefits',
        emoji: '🟡',
        enhancedFocus: 'Optimism, benefits, and positive black swans',
      },
      black: {
        name: 'Black Hat Plus',
        focus: 'Critical judgment and caution',
        emoji: '⚫',
        enhancedFocus: 'Critical judgment and catastrophic discontinuities',
      },
      green: {
        name: 'Green Hat Plus',
        focus: 'Creativity and alternatives',
        emoji: '🟢',
        enhancedFocus: 'Creativity and antifragile innovations',
      },
      purple: {
        name: 'Purple Hat',
        focus: 'Path analysis and constraint mapping',
        emoji: '🟣',
        enhancedFocus: 'Path dependencies, constraints, and ergodicity awareness',
      },
    };
    return hatsInfo[color];
  }

  /**
   * Get SCAMPER action information with pre-mortem risk questions
   * @param action - The SCAMPER action to get information for
   * @returns Action information with description, emoji, and risk question
   */
  private getScamperInfo(action: ScamperAction): {
    description: string;
    emoji: string;
    riskQuestion?: string;
  } {
    const scamperInfo = {
      substitute: {
        description: 'Replace parts with alternatives',
        emoji: '🔄',
        riskQuestion: 'What could go wrong with this substitution?',
      },
      combine: {
        description: 'Merge with other ideas or functions',
        emoji: '🔗',
        riskQuestion: 'What conflicts might arise from combining?',
      },
      adapt: {
        description: 'Adjust for different contexts',
        emoji: '🔧',
        riskQuestion: 'What assumptions might fail in new contexts?',
      },
      modify: {
        description: 'Magnify, minimize, or modify attributes',
        emoji: '🔍',
        riskQuestion: 'What breaks when scaled up or down?',
      },
      put_to_other_use: {
        description: 'Find new applications',
        emoji: '🎯',
        riskQuestion: 'What unintended uses could be harmful?',
      },
      eliminate: {
        description: 'Remove unnecessary elements',
        emoji: '✂️',
        riskQuestion: 'What dependencies might we be overlooking?',
      },
      reverse: {
        description: 'Invert or rearrange components',
        emoji: '🔃',
        riskQuestion: 'What assumptions break when reversed?',
      },
    };
    return scamperInfo[action];
  }

  /**
   * Get Design Thinking stage information with embedded risk management
   * @param stage - The Design Thinking stage to get information for
   * @returns Stage information with description, emoji, and critical lens
   */
  private getDesignThinkingInfo(stage: DesignThinkingStage): {
    description: string;
    emoji: string;
    criticalLens: string;
    prompts: string[];
  } {
    const stageInfo = {
      empathize: {
        description: 'Understand user needs deeply',
        emoji: '💭',
        criticalLens: 'Threat Modeling',
        prompts: [
          "What are the user's core needs and pain points?",
          'How might this solution be misused or abused?',
          'What are the extreme use cases we need to consider?',
        ],
      },
      define: {
        description: 'Frame the problem clearly',
        emoji: '🎯',
        criticalLens: 'Problem Inversion',
        prompts: [
          "What is the core problem we're solving?",
          'How might we fail to solve this problem?',
          'What are the failure modes we must avoid?',
        ],
      },
      ideate: {
        description: 'Generate creative solutions',
        emoji: '💡',
        criticalLens: "Devil's Advocate",
        prompts: [
          'What are all possible solutions?',
          'What could go wrong with each idea?',
          'How can we rank ideas by innovation AND robustness?',
        ],
      },
      prototype: {
        description: 'Build quick tests',
        emoji: '🔨',
        criticalLens: 'Stress Testing',
        prompts: [
          "What's the simplest way to test this idea?",
          'What edge cases must our prototype handle?',
          'How can we ensure it fails gracefully?',
        ],
      },
      test: {
        description: 'Learn from user feedback',
        emoji: '🧪',
        criticalLens: 'Failure Harvesting',
        prompts: [
          'What do users think of our solution?',
          'What failures or issues did we discover?',
          'What insights can we extract from both successes and failures?',
        ],
      },
    };
    return stageInfo[stage];
  }

  // Type guard to check if input is a session operation
  private isSessionOperation(data: unknown): data is SessionOperationData {
    const record = data as Record<string, unknown>;
    return (
      record.sessionOperation !== undefined &&
      ['save', 'load', 'list', 'delete', 'export'].includes(record.sessionOperation as string)
    );
  }

  private validateInput(input: unknown): LateralThinkingData {
    const data = input as Record<string, unknown>;

    // Check if this is a session operation
    if (this.isSessionOperation(data)) {
      return this.validateSessionOperation(data);
    } else {
      return this.validateThinkingOperation(data);
    }
  }

  private validateSessionOperation(data: Record<string, unknown>): SessionOperationData {
    if (!['save', 'load', 'list', 'delete', 'export'].includes(data.sessionOperation as string)) {
      throw new ValidationError(
        ErrorCode.INVALID_FIELD_VALUE,
        'Invalid sessionOperation: must be one of save, load, list, delete, export',
        'sessionOperation'
      );
    }

    // Validate operation-specific options
    if (
      data.sessionOperation === 'load' &&
      !(data.loadOptions as Record<string, unknown>)?.sessionId
    ) {
      throw new ValidationError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'sessionId is required in loadOptions for load operation',
        'loadOptions.sessionId'
      );
    }
    if (
      data.sessionOperation === 'delete' &&
      !(data.deleteOptions as Record<string, unknown>)?.sessionId
    ) {
      throw new ValidationError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'sessionId is required in deleteOptions for delete operation',
        'deleteOptions.sessionId'
      );
    }
    if (data.sessionOperation === 'export') {
      const exportOpts = data.exportOptions as Record<string, unknown> | undefined;
      if (!exportOpts?.sessionId) {
        throw new ValidationError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'sessionId is required in exportOptions for export operation',
          'exportOptions.sessionId'
        );
      }
      if (!['json', 'markdown', 'csv'].includes(exportOpts.format as string)) {
        throw new ValidationError(
          ErrorCode.INVALID_FIELD_VALUE,
          'Invalid export format: must be one of json, markdown, csv',
          'exportOptions.format'
        );
      }
    }

    return data as unknown as SessionOperationData;
  }

  private validateThinkingOperation(data: Record<string, unknown>): ThinkingOperationData {
    if (
      !data.technique ||
      ![
        'six_hats',
        'po',
        'random_entry',
        'scamper',
        'concept_extraction',
        'yes_and',
        'design_thinking',
        'triz',
        'neural_state',
        'temporal_work',
      ].includes(data.technique as string)
    ) {
      throw new ValidationError(
        ErrorCode.INVALID_TECHNIQUE,
        'Invalid technique: must be one of six_hats, po, random_entry, scamper, concept_extraction, yes_and, design_thinking, triz, neural_state, or temporal_work',
        'technique'
      );
    }
    if (!data.problem || typeof data.problem !== 'string') {
      throw new ValidationError(
        ErrorCode.INVALID_FIELD_VALUE,
        'Invalid problem: must be a string',
        'problem'
      );
    }
    if (!data.currentStep || typeof data.currentStep !== 'number') {
      throw new ValidationError(
        ErrorCode.INVALID_FIELD_VALUE,
        'Invalid currentStep: must be a number',
        'currentStep'
      );
    }
    if (!data.totalSteps || typeof data.totalSteps !== 'number') {
      throw new ValidationError(
        ErrorCode.INVALID_FIELD_VALUE,
        'Invalid totalSteps: must be a number',
        'totalSteps'
      );
    }
    if (!data.output || typeof data.output !== 'string') {
      throw new ValidationError(
        ErrorCode.INVALID_FIELD_VALUE,
        'Invalid output: must be a string',
        'output'
      );
    }
    if (typeof data.nextStepNeeded !== 'boolean') {
      throw new ValidationError(
        ErrorCode.INVALID_FIELD_VALUE,
        'Invalid nextStepNeeded: must be a boolean',
        'nextStepNeeded'
      );
    }

    // Validate technique-specific fields
    const technique = data.technique as LateralTechnique;

    if (
      technique === 'six_hats' &&
      data.hatColor &&
      !['blue', 'white', 'red', 'yellow', 'black', 'green', 'purple'].includes(
        data.hatColor as string
      )
    ) {
      throw new ValidationError(
        ErrorCode.INVALID_FIELD_VALUE,
        'Invalid hatColor for six_hats technique',
        'hatColor'
      );
    }

    if (
      technique === 'scamper' &&
      data.scamperAction &&
      ![
        'substitute',
        'combine',
        'adapt',
        'modify',
        'put_to_other_use',
        'eliminate',
        'reverse',
      ].includes(data.scamperAction as string)
    ) {
      throw new ValidationError(
        ErrorCode.INVALID_FIELD_VALUE,
        'Invalid scamperAction for scamper technique',
        'scamperAction'
      );
    }

    // Validate concept extraction specific fields
    if (technique === 'concept_extraction') {
      if (data.extractedConcepts && !Array.isArray(data.extractedConcepts)) {
        throw new ValidationError(
          ErrorCode.INVALID_FIELD_VALUE,
          'extractedConcepts must be an array for concept_extraction technique',
          'extractedConcepts'
        );
      }
      if (data.abstractedPatterns && !Array.isArray(data.abstractedPatterns)) {
        throw new ValidationError(
          ErrorCode.INVALID_FIELD_VALUE,
          'abstractedPatterns must be an array for concept_extraction technique',
          'abstractedPatterns'
        );
      }
      if (data.applications && !Array.isArray(data.applications)) {
        throw new ValidationError(
          ErrorCode.INVALID_FIELD_VALUE,
          'applications must be an array for concept_extraction technique',
          'applications'
        );
      }
    }

    // Validate unified framework fields
    if (data.risks && (!Array.isArray(data.risks) || data.risks.some(r => typeof r !== 'string'))) {
      throw new ValidationError(
        ErrorCode.INVALID_FIELD_VALUE,
        'risks must be an array of strings',
        'risks'
      );
    }
    if (
      data.failureModes &&
      (!Array.isArray(data.failureModes) || data.failureModes.some(f => typeof f !== 'string'))
    ) {
      throw new ValidationError(
        ErrorCode.INVALID_FIELD_VALUE,
        'failureModes must be an array of strings',
        'failureModes'
      );
    }
    if (
      data.mitigations &&
      (!Array.isArray(data.mitigations) || data.mitigations.some(m => typeof m !== 'string'))
    ) {
      throw new ValidationError(
        ErrorCode.INVALID_FIELD_VALUE,
        'mitigations must be an array of strings',
        'mitigations'
      );
    }
    if (
      data.antifragileProperties &&
      (!Array.isArray(data.antifragileProperties) ||
        data.antifragileProperties.some(a => typeof a !== 'string'))
    ) {
      throw new ValidationError(
        ErrorCode.INVALID_FIELD_VALUE,
        'antifragileProperties must be an array of strings',
        'antifragileProperties'
      );
    }
    if (
      data.blackSwans &&
      (!Array.isArray(data.blackSwans) || data.blackSwans.some(b => typeof b !== 'string'))
    ) {
      throw new ValidationError(
        ErrorCode.INVALID_FIELD_VALUE,
        'blackSwans must be an array of strings',
        'blackSwans'
      );
    }

    // Validate temporal work design fields
    if (technique === 'temporal_work' && data.temporalLandscape) {
      const landscape = data.temporalLandscape as Record<string, unknown>;

      // Validate temporal landscape structure
      if (landscape.fixedDeadlines && !Array.isArray(landscape.fixedDeadlines)) {
        throw new ValidationError(
          ErrorCode.INVALID_FIELD_VALUE,
          'temporalLandscape.fixedDeadlines must be an array',
          'temporalLandscape.fixedDeadlines'
        );
      }

      if (landscape.pressurePoints && !Array.isArray(landscape.pressurePoints)) {
        throw new ValidationError(
          ErrorCode.INVALID_FIELD_VALUE,
          'temporalLandscape.pressurePoints must be an array',
          'temporalLandscape.pressurePoints'
        );
      }

      // Validate logical consistency: deadlines should create pressure points
      if (landscape.fixedDeadlines && landscape.pressurePoints) {
        const deadlineCount = (landscape.fixedDeadlines as string[]).length;
        const pressureCount = (landscape.pressurePoints as string[]).length;

        if (deadlineCount > 0 && pressureCount === 0) {
          console.warn('Warning: Fixed deadlines exist but no pressure points identified');
        }
      }

      // Validate kairos opportunities exist when there are dead zones
      if (landscape.deadZones && landscape.kairosOpportunities) {
        const deadZoneCount = Array.isArray(landscape.deadZones) ? landscape.deadZones.length : 0;
        const kairosCount = Array.isArray(landscape.kairosOpportunities)
          ? landscape.kairosOpportunities.length
          : 0;

        if (deadZoneCount > 0 && kairosCount === 0) {
          console.warn('Warning: Dead zones identified but no kairos opportunities found');
        }
      }

      // Validate kairos opportunities align with flexible windows
      if (landscape.flexibleWindows && landscape.kairosOpportunities) {
        const flexibleCount = Array.isArray(landscape.flexibleWindows)
          ? landscape.flexibleWindows.length
          : 0;
        const kairosCount = Array.isArray(landscape.kairosOpportunities)
          ? landscape.kairosOpportunities.length
          : 0;

        if (flexibleCount > 0 && kairosCount === 0) {
          console.warn(
            'Warning: Flexible windows exist but no kairos opportunities identified to leverage them'
          );
        }
      }
    }

    return data as unknown as ThinkingOperationData;
  }

  /**
   * Get critical thinking steps for a technique where adversarial mode is emphasized
   * @param technique - The lateral thinking technique
   * @returns Array of step numbers that are critical/adversarial
   */
  private getCriticalSteps(technique: LateralTechnique): number[] {
    const criticalSteps: Record<LateralTechnique, number[]> = {
      six_hats: [], // determined by hat color, not step number
      yes_and: [3], // Evaluate (But) step
      concept_extraction: [2, 4], // Extract limitations and Apply with risk assessment
      po: [2, 3, 4], // All verification and testing steps
      random_entry: [2, 3], // Doubt generation and validation steps
      scamper: [], // Risk questions integrated into each action
      design_thinking: [], // Critical lens integrated into each stage
      triz: [2], // Via Negativa removal step
      neural_state: [2], // Network suppression identification is critical
      temporal_work: [1, 5], // Landscape constraints and escape routes are critical
    };
    return criticalSteps[technique] || [];
  }

  /**
   * Determine whether current step is in creative or critical mode
   * @param data - The lateral thinking data with current step info
   * @returns Color and symbol for visual mode indication
   */
  private getModeIndicator(data: ThinkingOperationData): { color: typeof chalk; symbol: string } {
    // Check if current step is in critical steps list
    const criticalSteps = this.getCriticalSteps(data.technique);
    let isCritical = criticalSteps.includes(data.currentStep);

    // Special handling for six_hats based on hat color
    if (data.technique === 'six_hats') {
      isCritical = data.hatColor === 'black' || data.hatColor === 'white';
    }

    // Override based on presence of risk data
    if (data.risks && data.risks.length > 0) {
      isCritical = true;
    }
    if (data.failureModes && data.failureModes.length > 0) {
      isCritical = true;
    }

    return {
      color: isCritical ? chalk.yellow : chalk.green,
      symbol: isCritical ? '⚠️ ' : '✨ ',
    };
  }

  /**
   * Truncate a word if it exceeds maximum length to prevent layout breaking
   * @param word - The word to potentially truncate
   * @param maxLength - Maximum allowed length
   * @returns Truncated word with ellipsis if needed
   */
  private truncateWord(word: string, maxLength: number): string {
    if (word.length <= maxLength) return word;
    return word.substring(0, maxLength - 3) + '...';
  }

  /**
   * Format the risk identification section for visual output
   * @param risks - Array of identified risks
   * @param maxLength - Maximum line length for formatting
   * @returns Formatted lines for the risk section
   */
  private formatRiskSection(risks: string[], maxLength: number): string[] {
    const parts: string[] = [];
    const border = '─'.repeat(maxLength);

    parts.push(`├${border}┤`);
    parts.push(`│ ${chalk.yellow('⚠️  Risks Identified:'.padEnd(maxLength - 2))} │`);
    risks.forEach(risk => {
      parts.push(`│ ${chalk.yellow(`• ${risk}`.padEnd(maxLength - 2))} │`);
    });

    return parts;
  }

  /**
   * Format the mitigation strategies section for visual output
   * @param mitigations - Array of mitigation strategies
   * @param maxLength - Maximum line length for formatting
   * @param hasRisks - Whether risks section was displayed (affects border)
   * @returns Formatted lines for the mitigation section
   */
  private formatMitigationSection(
    mitigations: string[],
    maxLength: number,
    hasRisks: boolean
  ): string[] {
    const parts: string[] = [];
    const border = '─'.repeat(maxLength);

    if (!hasRisks) parts.push(`├${border}┤`);
    parts.push(`│ ${chalk.green('✓ Mitigations:'.padEnd(maxLength - 2))} │`);
    mitigations.forEach(mitigation => {
      parts.push(`│ ${chalk.green(`• ${mitigation}`.padEnd(maxLength - 2))} │`);
    });

    return parts;
  }

  /**
   * Calculate path impact based on the thinking step
   */
  private calculatePathImpact(data: ThinkingOperationData): {
    optionsOpened?: string[];
    optionsClosed?: string[];
    reversibilityCost?: number;
    commitmentLevel?: number;
  } {
    const impact: {
      optionsOpened?: string[];
      optionsClosed?: string[];
      reversibilityCost?: number;
      commitmentLevel?: number;
    } = {};

    // Technique-specific impact analysis
    switch (data.technique) {
      case 'six_hats':
        if (data.hatColor === 'purple') {
          // Purple hat opens path analysis options
          impact.optionsOpened = ['Path analysis completed', 'Constraints mapped'];
          impact.reversibilityCost = 0.1;
          impact.commitmentLevel = 0.1;
        } else if (data.hatColor === 'black') {
          // Black hat might close some risky options
          impact.optionsClosed = data.risks || [];
          impact.reversibilityCost = 0.2;
          impact.commitmentLevel = 0.3;
        } else {
          // Other hats are mostly exploratory
          impact.reversibilityCost = 0.1;
          impact.commitmentLevel = 0.1;
        }
        break;

      case 'po':
        if (data.currentStep === 4) {
          // Final solution development has higher commitment
          impact.commitmentLevel = 0.6;
          impact.reversibilityCost = 0.4;
        } else {
          // Exploration phases
          impact.commitmentLevel = 0.2;
          impact.reversibilityCost = 0.1;
        }
        break;

      case 'scamper':
        // SCAMPER modifications can have varying impacts
        if (data.scamperAction === 'eliminate') {
          impact.optionsClosed = ['Eliminated feature/component'];
          impact.reversibilityCost = 0.7;
          impact.commitmentLevel = 0.6;
        } else if (data.scamperAction === 'combine') {
          impact.optionsClosed = ['Independent operation of combined elements'];
          impact.reversibilityCost = 0.5;
          impact.commitmentLevel = 0.5;
        } else {
          impact.reversibilityCost = 0.3;
          impact.commitmentLevel = 0.4;
        }
        break;

      case 'design_thinking':
        if (data.designStage === 'prototype' || data.designStage === 'test') {
          // Later stages have higher commitment
          impact.commitmentLevel = 0.7;
          impact.reversibilityCost = 0.5;
          impact.optionsClosed = ['Alternative design directions'];
        } else {
          impact.commitmentLevel = 0.3;
          impact.reversibilityCost = 0.2;
        }
        break;

      case 'yes_and':
        // Each addition builds commitment
        impact.commitmentLevel = 0.4 + data.currentStep * 0.1;
        impact.reversibilityCost = 0.3 + data.currentStep * 0.1;
        if (data.additions && data.additions.length > 0) {
          impact.optionsOpened = data.additions;
        }
        break;

      case 'triz':
        // TRIZ solutions tend to be more technical and harder to reverse
        impact.commitmentLevel = 0.6;
        impact.reversibilityCost = 0.6;
        if (data.viaNegativaRemovals && data.viaNegativaRemovals.length > 0) {
          impact.optionsClosed = data.viaNegativaRemovals;
        }
        break;

      case 'neural_state':
        // Neural state optimization is mostly reversible but requires habit formation
        impact.commitmentLevel = 0.3;
        impact.reversibilityCost = 0.2;
        if (data.switchingRhythm && data.switchingRhythm.length > 0) {
          impact.optionsOpened = data.switchingRhythm.map(r => `Cognitive pattern: ${r}`);
        }
        break;

      case 'temporal_work':
        // Temporal work design creates some structural commitments
        impact.commitmentLevel = 0.4;
        impact.reversibilityCost = 0.3;
        if (data.temporalLandscape?.flexibleWindows) {
          impact.optionsOpened = data.temporalLandscape.flexibleWindows.map(
            w => `Time window: ${w}`
          );
        }
        if (data.temporalLandscape?.deadZones) {
          impact.optionsClosed = data.temporalLandscape.deadZones.map(z => `Dead zone: ${z}`);
        }
        break;

      default:
        // Default low impact for exploration
        impact.commitmentLevel = 0.2;
        impact.reversibilityCost = 0.2;
    }

    // Factor in explicit risk considerations
    if (data.risks && data.risks.length > 0) {
      impact.commitmentLevel = Math.min(1.0, (impact.commitmentLevel || 0.2) + 0.1);
    }

    return impact;
  }

  private formatOutput(data: ThinkingOperationData): string {
    const {
      technique,
      currentStep,
      totalSteps,
      output,
      hatColor,
      scamperAction,
      randomStimulus,
      provocation,
      successExample,
      initialIdea,
    } = data;

    const parts: string[] = [];
    let header = '';
    let techniqueInfo = '';
    let emoji = '🧠';
    const mode = this.getModeIndicator(data);

    switch (technique) {
      case 'six_hats':
        if (hatColor) {
          const hatInfo = this.getSixHatsInfo(hatColor);
          emoji = hatInfo.emoji;
          techniqueInfo = `${hatInfo.name}: ${hatInfo.enhancedFocus || hatInfo.focus}`;
        }
        break;
      case 'po':
        emoji = '💡';
        if (provocation) {
          techniqueInfo = `Provocation: ${provocation}`;
        }
        break;
      case 'random_entry':
        emoji = '🎲';
        if (randomStimulus) {
          techniqueInfo = `Random Stimulus: ${randomStimulus}`;
        }
        break;
      case 'scamper':
        if (scamperAction) {
          const actionInfo = this.getScamperInfo(scamperAction);
          emoji = actionInfo.emoji;
          techniqueInfo = `${scamperAction.toUpperCase()}: ${actionInfo.description}`;
          if (actionInfo.riskQuestion) {
            techniqueInfo += ` | ${actionInfo.riskQuestion}`;
          }
        }
        break;
      case 'concept_extraction': {
        emoji = '🔍';
        const stepNames = [
          'Identify Success',
          'Extract & Analyze Limitations',
          'Abstract with Boundaries',
          'Apply with Risk Assessment',
        ];
        techniqueInfo = stepNames[currentStep - 1];
        if (successExample && currentStep === 1) {
          techniqueInfo += `: ${successExample}`;
        }
        break;
      }
      case 'yes_and': {
        emoji = '🤝';
        const yesAndSteps = ['Accept (Yes)', 'Build (And)', 'Evaluate (But)', 'Integrate'];
        techniqueInfo = yesAndSteps[currentStep - 1];
        if (initialIdea && currentStep === 1) {
          techniqueInfo += `: ${initialIdea}`;
        }
        break;
      }
      case 'design_thinking': {
        const stages: DesignThinkingStage[] = [
          'empathize',
          'define',
          'ideate',
          'prototype',
          'test',
        ];
        const stage = data.designStage || stages[currentStep - 1];
        const stageInfo = this.getDesignThinkingInfo(stage);
        emoji = stageInfo.emoji;
        techniqueInfo = `${stage.charAt(0).toUpperCase() + stage.slice(1)}: ${stageInfo.description}`;
        techniqueInfo += ` + ${stageInfo.criticalLens}`;
        break;
      }
      case 'triz': {
        emoji = '⚙️';
        const trizSteps = [
          'Identify Contradiction',
          'Via Negativa - What to Remove?',
          'Apply Inventive Principles',
          'Minimal Solution',
        ];
        techniqueInfo = trizSteps[currentStep - 1];
        if (data.contradiction && currentStep === 1) {
          techniqueInfo += `: ${data.contradiction}`;
        }
        break;
      }
      case 'neural_state': {
        emoji = '🧩';
        const neuralSteps = [
          'Assess Current Neural State',
          'Identify Network Suppression',
          'Develop Switching Rhythm',
          'Integrate Insights',
        ];
        techniqueInfo = neuralSteps[currentStep - 1];
        if (data.dominantNetwork && currentStep === 1) {
          const networkName =
            data.dominantNetwork === 'dmn' ? 'Default Mode Network' : 'Executive Control Network';
          techniqueInfo += ` - Currently: ${networkName}`;
        }
        if (data.suppressionDepth && currentStep === 2) {
          techniqueInfo += ` - Depth: ${data.suppressionDepth}/10`;
        }
        break;
      }
      case 'temporal_work': {
        emoji = '⏰';
        const temporalSteps = [
          'Map Temporal Landscape',
          'Circadian Alignment',
          'Pressure Transformation',
          'Async-Sync Balance',
          'Temporal Escape Routes',
        ];
        techniqueInfo = temporalSteps[currentStep - 1];
        break;
      }
    }

    if (data.isRevision) {
      header = chalk.yellow(`🔄 Revision of Step ${data.revisesStep}`);
    } else if (data.branchFromStep) {
      header = chalk.green(`🌿 Branch from Step ${data.branchFromStep} (ID: ${data.branchId})`);
    } else {
      header = chalk.blue(
        `${emoji} ${technique.replace('_', ' ').toUpperCase()} - Step ${currentStep}/${totalSteps} ${mode.symbol}`
      );
    }

    const maxLength = Math.max(header.length, techniqueInfo.length, output.length) + 4;
    const border = '─'.repeat(maxLength);

    parts.push(`\n┌${border}┐`);
    parts.push(`│ ${header.padEnd(maxLength - 2)} │`);

    if (techniqueInfo) {
      parts.push(`│ ${chalk.gray(techniqueInfo.padEnd(maxLength - 2))} │`);
      parts.push(`├${border}┤`);
    }

    // Wrap output text with word truncation
    const words = output.split(' ');
    let line = '';
    const maxWordLength = maxLength - 4;

    for (let word of words) {
      // Truncate word if it's too long
      word = this.truncateWord(word, maxWordLength);

      if (line.length + word.length + 1 > maxWordLength) {
        parts.push(`│ ${line.padEnd(maxLength - 2)} │`);
        line = word;
      } else {
        line += (line ? ' ' : '') + word;
      }
    }
    if (line) {
      parts.push(`│ ${line.padEnd(maxLength - 2)} │`);
    }

    // Add risk/adversarial sections using extracted methods
    if (data.risks && data.risks.length > 0) {
      parts.push(...this.formatRiskSection(data.risks, maxLength));
    }

    if (data.mitigations && data.mitigations.length > 0) {
      parts.push(...this.formatMitigationSection(data.mitigations, maxLength, !!data.risks));
    }

    // Add ergodicity status if available
    if (data.sessionId) {
      const session = this.sessions.get(data.sessionId);
      if (session) {
        this.touchSession(data.sessionId);
      }

      // Display critical early warnings prominently
      if (session?.earlyWarningState && session.earlyWarningState.activeWarnings.length > 0) {
        const criticalWarning = session.earlyWarningState.activeWarnings.find(
          w => w.severity === BarrierWarningLevel.CRITICAL
        );

        if (criticalWarning) {
          parts.push(`├${border}┤`);
          parts.push(
            `│ ${chalk.red.bold('🚨 CRITICAL BARRIER WARNING 🚨').padEnd(maxLength - 2)} │`
          );
          parts.push(`│ ${chalk.red(criticalWarning.message).padEnd(maxLength - 2)} │`);
          if (criticalWarning.reading.timeToImpact) {
            parts.push(
              `│ ${chalk.yellow(`Impact in ~${criticalWarning.reading.timeToImpact} steps`).padEnd(maxLength - 2)} │`
            );
          }
          if (session.escapeRecommendation) {
            parts.push(
              `│ ${chalk.green(`💡 Escape: ${session.escapeRecommendation.name}`).padEnd(maxLength - 2)} │`
            );
          }
        }
      }

      if (session?.ergodicityManager) {
        const ergodicityStatus = session.ergodicityManager.getErgodicityStatus();
        if (ergodicityStatus) {
          parts.push(`├${border}┤`);
          const statusLines = ergodicityStatus.split('\n');
          statusLines.forEach(line => {
            if (line.trim()) {
              parts.push(`│ ${line.padEnd(maxLength - 2)} │`);
            }
          });
        }
      }
    }

    parts.push(`└${border}┘`);

    return parts.join('\n');
  }

  private initializeSession(technique: LateralTechnique, problem: string): string {
    let sessionId: string;
    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    // Generate unique session ID with collision detection
    do {
      sessionId = `session_${randomUUID()}`;
      attempts++;

      if (attempts > MAX_ATTEMPTS) {
        throw new ExecutionError(
          ErrorCode.INTERNAL_ERROR,
          'Failed to generate unique session ID after 10 attempts'
        );
      }
    } while (this.sessions.has(sessionId));

    const ergodicityManager = new ErgodicityManager();

    const now = Date.now();
    this.sessions.set(sessionId, {
      technique,
      problem,
      history: [],
      branches: {},
      insights: [],
      ergodicityManager,
      startTime: now,
      lastActivityTime: now,
      metrics: {
        creativityScore: 0,
        risksCaught: 0,
        antifragileFeatures: 0,
      },
    });

    // Check if we need to evict old sessions
    if (this.sessions.size > this.config.maxSessions) {
      this.evictOldestSessions();
    }

    return sessionId;
  }

  private getTechniqueSteps(technique: LateralTechnique): number {
    switch (technique) {
      case 'six_hats':
        return 7; // Now includes Purple Hat for path analysis
      case 'po':
        return 4; // Create provocation, verify provocation, extract & test principles, develop robust solutions
      case 'random_entry':
        return 3; // Random stimulus, generate connections, develop solutions
      case 'scamper':
        return 7;
      case 'concept_extraction':
        return 4; // Identify success, extract concepts, abstract patterns, apply to problem
      case 'yes_and':
        return 4; // Accept (Yes), Build (And), Evaluate (But), Integrate
      case 'design_thinking':
        return 5; // Empathize, Define, Ideate, Prototype, Test
      case 'triz':
        return 4; // Identify contradiction, Via Negativa removal, Apply principles, Minimal solution
      case 'neural_state':
        return 4; // Assess current state, Identify network suppression, Develop switching rhythm, Integrate insights
      case 'temporal_work':
        return 5; // Map landscape, Circadian alignment, Pressure transformation, Async-sync balance, Escape routes
      default:
        return 5;
    }
  }

  private extractInsights(session: SessionData): string[] {
    const insights: string[] = [];

    // Extract technique-specific insights
    switch (session.technique) {
      case 'six_hats':
        insights.push('Comprehensive analysis from multiple perspectives completed');
        break;
      case 'po': {
        const principles = session.history
          .filter(h => h.principles)
          .flatMap(h => h.principles || []);
        if (principles.length > 0) {
          insights.push(`Extracted principles: ${principles.join(', ')}`);
        }
        break;
      }
      case 'random_entry': {
        const connections = session.history
          .filter(h => h.connections)
          .flatMap(h => h.connections || []);
        if (connections.length > 0) {
          insights.push(`Creative connections discovered: ${connections.length}`);
        }
        break;
      }
      case 'scamper':
        insights.push('Systematic transformation completed across all dimensions');
        break;
      case 'concept_extraction': {
        const concepts = session.history
          .filter(h => h.extractedConcepts)
          .flatMap(h => h.extractedConcepts || []);
        const patterns = session.history
          .filter(h => h.abstractedPatterns)
          .flatMap(h => h.abstractedPatterns || []);
        const applications = session.history
          .filter(h => h.applications)
          .flatMap(h => h.applications || []);

        if (concepts.length > 0) {
          insights.push(`Core concepts identified: ${concepts.join(', ')}`);
        }
        if (patterns.length > 0) {
          insights.push(`Abstracted patterns: ${patterns.join(', ')}`);
        }
        if (applications.length > 0) {
          insights.push(`${applications.length} new applications generated for your problem`);
        }
        break;
      }
      case 'yes_and': {
        const additions = session.history.filter(h => h.additions).flatMap(h => h.additions || []);
        const evaluations = session.history
          .filter(h => h.evaluations)
          .flatMap(h => h.evaluations || []);
        const synthesis = session.history.find(h => h.synthesis)?.synthesis;

        insights.push('Collaborative ideation with critical evaluation completed');
        if (additions.length > 0) {
          insights.push(`Creative additions: ${additions.length}`);
        }
        if (evaluations.length > 0) {
          insights.push(`Critical evaluations performed: ${evaluations.length}`);
        }
        if (synthesis) {
          insights.push('Final synthesis achieved');
        }
        break;
      }
      case 'design_thinking': {
        const empathyInsights = session.history
          .filter(h => h.empathyInsights)
          .flatMap(h => h.empathyInsights || []);
        const ideas = session.history.filter(h => h.ideaList).flatMap(h => h.ideaList || []);
        const failures = session.history
          .filter(h => h.failureInsights)
          .flatMap(h => h.failureInsights || []);

        if (empathyInsights.length > 0) {
          insights.push(`User needs and threat vectors identified: ${empathyInsights.length}`);
        }
        if (ideas.length > 0) {
          insights.push(`${ideas.length} ideas generated with risk assessment`);
        }
        if (failures.length > 0) {
          insights.push(`Failure insights harvested: ${failures.join(', ')}`);
        }
        insights.push('Design thinking process completed with embedded risk management');
        break;
      }
      case 'triz': {
        const removals = session.history
          .filter(h => h.viaNegativaRemovals)
          .flatMap(h => h.viaNegativaRemovals || []);
        const principles = session.history
          .filter(h => h.inventivePrinciples)
          .flatMap(h => h.inventivePrinciples || []);
        const solution = session.history.find(h => h.minimalSolution)?.minimalSolution;

        if (removals.length > 0) {
          insights.push(`Elements removed via negativa: ${removals.join(', ')}`);
        }
        if (principles.length > 0) {
          insights.push(`Inventive principles applied: ${principles.join(', ')}`);
        }
        if (solution) {
          insights.push(`Minimal solution achieved: ${solution}`);
        }
        insights.push('TRIZ process completed with subtractive innovation');
        break;
      }
      case 'neural_state': {
        const dominantNetworks = session.history
          .filter(h => h.dominantNetwork)
          .map(h => h.dominantNetwork);
        const switchingRhythms = session.history
          .filter(h => h.switchingRhythm)
          .flatMap(h => h.switchingRhythm || []);
        const integrationInsights = session.history
          .filter(h => h.integrationInsights)
          .flatMap(h => h.integrationInsights || []);

        if (dominantNetworks.length > 0) {
          const networkNames = dominantNetworks.map(n =>
            n === 'dmn' ? 'Default Mode Network' : 'Executive Control Network'
          );
          insights.push(`Neural networks assessed: ${[...new Set(networkNames)].join(', ')}`);
        }
        if (switchingRhythms.length > 0) {
          insights.push(`Switching rhythms developed: ${switchingRhythms.join(', ')}`);
        }
        if (integrationInsights.length > 0) {
          insights.push(`Cognitive integration achieved: ${integrationInsights.join(', ')}`);
        }
        insights.push('Neural State Optimization completed for enhanced cognitive flexibility');
        break;
      }
      case 'temporal_work': {
        const landscapes = session.history
          .filter(h => h.temporalLandscape)
          .map(h => h.temporalLandscape);
        const alignments = session.history
          .filter(h => h.circadianAlignment)
          .flatMap(h => h.circadianAlignment || []);
        const transformations = session.history
          .filter(h => h.pressureTransformation)
          .flatMap(h => h.pressureTransformation || []);
        const escapeRoutes = session.history
          .filter(h => h.temporalEscapeRoutes)
          .flatMap(h => h.temporalEscapeRoutes || []);

        if (landscapes.length > 0) {
          insights.push('Temporal landscape mapped with deadlines and opportunities');
        }
        if (alignments.length > 0) {
          insights.push(`Circadian alignments identified: ${alignments.join(', ')}`);
        }
        if (transformations.length > 0) {
          insights.push(
            `Pressure transformed into creative catalysts: ${transformations.length} techniques`
          );
        }
        if (escapeRoutes.length > 0) {
          insights.push(`Temporal escape routes designed: ${escapeRoutes.join(', ')}`);
        }
        insights.push('Temporal Work Design completed for optimized creative scheduling');
        break;
      }
    }

    return insights;
  }

  public async processLateralThinking(
    input: unknown
  ): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    try {
      const validatedInput = this.validateInput(input);

      // Handle session operations first
      if ('sessionOperation' in validatedInput) {
        return await this.handleSessionOperation(validatedInput);
      }
      // Now we know it's a thinking operation
      const thinkingInput = validatedInput;

      let sessionId: string;
      let session: SessionData | undefined;

      // Handle session initialization or continuation
      if (thinkingInput.sessionId) {
        // Continue existing session
        sessionId = thinkingInput.sessionId;
        session = this.sessions.get(sessionId);
        if (!session) {
          throw new SessionError(
            ErrorCode.SESSION_NOT_FOUND,
            `Session ${sessionId} not found. It may have expired.`,
            sessionId
          );
        }
        this.touchSession(sessionId);
      } else {
        // Create new session (even if not step 1, for testing purposes)
        sessionId = this.initializeSession(thinkingInput.technique, thinkingInput.problem);
        if (!thinkingInput.totalSteps) {
          thinkingInput.totalSteps = this.getTechniqueSteps(thinkingInput.technique);
        }
        session = this.sessions.get(sessionId);
        if (session) {
          this.touchSession(sessionId);
        }
      }

      if (!session) {
        throw new SessionError(ErrorCode.INTERNAL_ERROR, 'Failed to get or create session.');
      }

      // Add to history with proper timestamp
      const historyEntry = {
        ...thinkingInput,
        timestamp: new Date().toISOString(),
      };
      session.history.push(historyEntry);

      // Track path dependencies if ergodicity manager exists
      if (session.ergodicityManager) {
        const pathImpact = this.calculatePathImpact(thinkingInput);
        const sessionData: SessionData = {
          history: session.history,
          insights: session.insights,
          metrics: session.metrics,
          technique: thinkingInput.technique,
          problem: thinkingInput.problem,
          branches: session.branches,
          startTime: session.history[0]?.timestamp
            ? new Date(session.history[0].timestamp).getTime()
            : Date.now(),
          lastActivityTime: session.lastActivityTime,
        };

        const { warnings, earlyWarningState, escapeRecommendation } =
          await session.ergodicityManager.recordThinkingStep(
            thinkingInput.technique,
            thinkingInput.currentStep,
            thinkingInput.output,
            pathImpact,
            sessionData
          );

        // Store any critical warnings for display
        if (warnings.length > 0) {
          session.pathMemory = session.ergodicityManager.getPathMemory();
        }

        // Store early warning state
        if (earlyWarningState) {
          session.earlyWarningState = earlyWarningState;
          if (escapeRecommendation) {
            session.escapeRecommendation = escapeRecommendation;
          }
        }
      }

      // Update metrics
      if (session.metrics) {
        // Count risks identified
        if (thinkingInput.risks && thinkingInput.risks.length > 0) {
          session.metrics.risksCaught =
            (session.metrics.risksCaught || 0) + thinkingInput.risks.length;
        }
        // Count antifragile properties
        if (thinkingInput.antifragileProperties && thinkingInput.antifragileProperties.length > 0) {
          session.metrics.antifragileFeatures =
            (session.metrics.antifragileFeatures || 0) + thinkingInput.antifragileProperties.length;
        }
        // Simple creativity score based on output length and variety
        session.metrics.creativityScore =
          (session.metrics.creativityScore || 0) + Math.min(thinkingInput.output.length / 100, 5);
      }

      // Handle branches
      if (thinkingInput.branchFromStep && thinkingInput.branchId) {
        if (!session.branches[thinkingInput.branchId]) {
          session.branches[thinkingInput.branchId] = [];
        }
        session.branches[thinkingInput.branchId].push(thinkingInput);
      }

      // Log formatted output
      if (!this.disableThoughtLogging) {
        const formattedOutput = this.formatOutput({ ...thinkingInput, sessionId });
        console.error(formattedOutput);
      }

      // Generate response
      const response: LateralThinkingResponse = {
        sessionId: sessionId,
        technique: thinkingInput.technique,
        currentStep: thinkingInput.currentStep,
        totalSteps: thinkingInput.totalSteps,
        nextStepNeeded: thinkingInput.nextStepNeeded,
        historyLength: session.history.length,
        branches: Object.keys(session.branches),
      };

      // Add completion summary if done
      if (!thinkingInput.nextStepNeeded) {
        session.endTime = Date.now();
        response.completed = true;
        response.insights = this.extractInsights(session);
        response.summary = `Lateral thinking session completed using ${thinkingInput.technique} technique`;

        // Add metrics to response
        if (session.metrics) {
          response.metrics = {
            duration: session.endTime - (session.startTime || 0),
            creativityScore: Math.round((session.metrics.creativityScore || 0) * 10) / 10,
            risksCaught: session.metrics.risksCaught,
            antifragileFeatures: session.metrics.antifragileFeatures,
          };
        }
      }

      // Add technique-specific guidance for next step
      if (thinkingInput.nextStepNeeded) {
        response.nextStepGuidance = this.getNextStepGuidance(thinkingInput);
      }

      // Generate memory-suggestive outputs
      const memoryOutputs = this.generateMemorySuggestiveOutputs(thinkingInput, session);
      Object.assign(response, memoryOutputs);

      // Auto-save if enabled
      if (thinkingInput.autoSave && this.persistenceAdapter && session) {
        try {
          await this.saveSessionToPersistence(sessionId, session);
        } catch (error) {
          console.error('Auto-save failed:', error);
          // Add auto-save failure to response
          response.autoSaveError = error instanceof Error ? error.message : 'Auto-save failed';
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorResponse = createErrorResponse(error, 'execution');
      return Promise.resolve({
        content: [
          {
            type: 'text',
            text: JSON.stringify(errorResponse, null, 2),
          },
        ],
        isError: true,
      });
    }
  }

  private getNextStepGuidance(data: ThinkingOperationData): string {
    const nextStep = data.currentStep + 1;

    switch (data.technique) {
      case 'six_hats': {
        const hatOrder: SixHatsColor[] = [
          'blue',
          'white',
          'red',
          'yellow',
          'black',
          'green',
          'purple',
        ];
        if (nextStep <= 7) {
          const nextHat = hatOrder[nextStep - 1];
          const hatInfo = this.getSixHatsInfo(nextHat);
          return `Next: ${hatInfo.name} - Focus on ${hatInfo.enhancedFocus || hatInfo.focus}`;
        }
        break;
      }

      case 'po': {
        const poSteps = [
          'Create a provocative statement (Po:)',
          'Suspend judgment and explore the provocation (then challenge it)',
          'Extract and verify principles through hypothesis testing',
          'Develop robust solutions addressing failure modes',
        ];
        return poSteps[nextStep - 1] || 'Complete the process';
      }

      case 'random_entry': {
        const randomSteps = [
          'Introduce a random stimulus word/concept',
          'Generate connections with systematic doubt ("Is this always true?")',
          'Validate insights before developing solutions',
        ];
        return randomSteps[nextStep - 1] || 'Complete the process';
      }

      case 'scamper': {
        const scamperOrder: ScamperAction[] = [
          'substitute',
          'combine',
          'adapt',
          'modify',
          'put_to_other_use',
          'eliminate',
          'reverse',
        ];
        if (nextStep <= 7) {
          const nextAction = scamperOrder[nextStep - 1];
          const actionInfo = this.getScamperInfo(nextAction);
          return `Next: ${nextAction.toUpperCase()} - ${actionInfo.description}`;
        }
        break;
      }

      case 'concept_extraction': {
        const conceptSteps = [
          'Identify a successful solution/example from any domain',
          "Extract key concepts and analyze where they wouldn't work",
          'Abstract patterns with domain boundary identification',
          'Apply patterns only where success probability is high',
        ];
        return conceptSteps[nextStep - 1] || 'Complete the process';
      }

      case 'yes_and': {
        const yesAndSteps = [
          'Accept the initial idea or contribution (Yes)',
          'Build upon it with creative additions (And)',
          'Critically evaluate potential issues (But)',
          'Integrate insights into a robust solution',
        ];
        return yesAndSteps[nextStep - 1] || 'Complete the process';
      }
      case 'design_thinking': {
        const stages: DesignThinkingStage[] = [
          'empathize',
          'define',
          'ideate',
          'prototype',
          'test',
        ];
        if (nextStep <= 5) {
          const nextStage = stages[nextStep - 1];
          const stageInfo = this.getDesignThinkingInfo(nextStage);
          return `Next: ${nextStage.charAt(0).toUpperCase() + nextStage.slice(1)} - ${stageInfo.description} + ${stageInfo.criticalLens}`;
        }
        break;
      }
      case 'triz': {
        const trizSteps = [
          'Identify the core contradiction in your problem',
          'Apply Via Negativa - What can you remove to solve this?',
          'Apply TRIZ inventive principles (both additive and subtractive)',
          'Synthesize a minimal solution that does more with less',
        ];
        return trizSteps[nextStep - 1] || 'Complete the process';
      }
      case 'neural_state': {
        const neuralSteps = [
          'Assess your current dominant neural network (DMN for wandering/creative or ECN for focused/analytical)',
          'Identify patterns of network suppression and cognitive rigidity',
          'Develop a personalized rhythm for switching between networks',
          'Integrate insights to achieve optimal cognitive flexibility',
        ];
        return neuralSteps[nextStep - 1] || 'Complete the neural optimization process';
      }
      case 'temporal_work': {
        // Get session context for contextual guidance
        const sessionId = data.sessionId || this.currentSessionId;
        const session = sessionId ? this.sessions.get(sessionId) : null;
        const history = session?.history || [];

        // Make guidance contextual based on previous steps
        switch (nextStep) {
          case 1:
            return 'Map your temporal landscape: identify fixed deadlines, flexible windows, pressure points, dead zones, and kairos opportunities';

          case 2: {
            // Reference landscape from step 1
            const step1 = history.find(h => h.currentStep === 1 && h.technique === 'temporal_work');
            if (
              step1?.temporalLandscape?.deadZones &&
              step1.temporalLandscape.deadZones.length > 0
            ) {
              return `Analyze circadian rhythms to work around identified dead zones (${step1.temporalLandscape.deadZones.join(', ')})`;
            }
            return 'Analyze circadian rhythms: identify peak creative hours and optimal task-time alignment';
          }

          case 3: {
            // Reference pressure points from step 1
            const step1 = history.find(h => h.currentStep === 1 && h.technique === 'temporal_work');
            if (
              step1?.temporalLandscape?.pressurePoints &&
              step1.temporalLandscape.pressurePoints.length > 0
            ) {
              return `Transform identified pressure points (${step1.temporalLandscape.pressurePoints.join(', ')}) into creative catalysts`;
            }
            return 'Transform pressure: convert deadline stress into creative energy';
          }

          case 4: {
            // Reference circadian insights from step 2
            const step2 = history.find(h => h.currentStep === 2 && h.technique === 'temporal_work');
            if (step2?.circadianAlignment && step2.circadianAlignment.length > 0) {
              return `Balance async/sync work based on your rhythm: ${step2.circadianAlignment[0]}`;
            }
            return 'Balance async/sync work: allocate solo exploration and group integration time';
          }

          case 5: {
            // Reference all constraints from previous steps
            const step1 = history.find(h => h.currentStep === 1 && h.technique === 'temporal_work');
            const deadlineCount = step1?.temporalLandscape?.fixedDeadlines?.length || 0;
            if (deadlineCount > 0) {
              return `Design escape routes for ${deadlineCount} fixed deadlines with buffer zones and graceful degradation`;
            }
            return 'Design escape routes: create buffer zones, time loans, and graceful degradation plans';
          }

          default:
            return 'Complete the temporal design process';
        }
      }
    }

    return 'Continue with the next step';
  }

  private generateMemorySuggestiveOutputs(
    input: ThinkingOperationData,
    session: SessionData
  ): Partial<LateralThinkingResponse> {
    const memoryOutputs: Partial<LateralThinkingResponse> = {};

    // Generate contextual insight based on current technique and step
    const contextualInsights = this.generateContextualInsight(input, session);
    if (contextualInsights) {
      memoryOutputs.contextualInsight = contextualInsights;
    }

    // Generate historical note if patterns emerge
    const historicalNote = this.generateHistoricalNote(input, session);
    if (historicalNote) {
      memoryOutputs.historicalNote = historicalNote;
    }

    // Identify patterns observed
    const pattern = this.identifyPattern(input, session);
    if (pattern) {
      memoryOutputs.patternObserved = pattern;
    }

    // Generate session fingerprint for completed sessions
    if (!input.nextStepNeeded) {
      memoryOutputs.sessionFingerprint = {
        problemType: this.categorizeProblem(session.problem),
        solutionPattern: this.identifySolutionPattern(session),
        breakthroughLevel: this.assessBreakthroughLevel(session),
        pathDependencies: this.extractPathDependencies(session),
      };
    }

    // Identify noteworthy patterns for future reference
    const noteworthyPattern = this.identifyNoteworthyPattern(input, session);
    if (noteworthyPattern) {
      memoryOutputs.noteworthyPatterns = noteworthyPattern;
    }

    return memoryOutputs;
  }

  private generateContextualInsight(
    input: ThinkingOperationData,
    session: SessionData
  ): string | undefined {
    const { technique, currentStep } = input;

    // Technique-specific insights
    switch (technique) {
      case 'six_hats':
        if (input.hatColor === 'black' && input.risks && input.risks.length > 0) {
          return `Critical thinking revealed ${input.risks.length} risk factors that require mitigation`;
        }
        if (input.hatColor === 'green' && currentStep === 6) {
          return 'Creative solutions generated after systematic analysis';
        }
        break;

      case 'po':
        if (currentStep === 2 && input.principles) {
          return `Provocation successfully challenged ${input.principles.length} core assumptions`;
        }
        break;

      case 'scamper':
        if (input.scamperAction === 'eliminate' && session.insights.length > 0) {
          return 'Elimination strategy revealed opportunities for simplification';
        }
        break;

      case 'design_thinking':
        if (input.designStage === 'empathize' && input.empathyInsights) {
          return `User research uncovered ${input.empathyInsights.length} key pain points`;
        }
        break;

      case 'triz':
        if (input.contradiction && currentStep === 1) {
          return 'Technical contradiction identified, seeking inventive resolution';
        }
        break;
      case 'neural_state':
        if (input.dominantNetwork && currentStep === 1) {
          const networkName =
            input.dominantNetwork === 'dmn' ? 'Default Mode Network' : 'Executive Control Network';
          return `${networkName} dominance detected, exploring cognitive flexibility options`;
        }
        if (input.suppressionDepth && currentStep === 2) {
          return `Network suppression depth: ${input.suppressionDepth}/10 - ${input.suppressionDepth > 7 ? 'High rigidity detected' : 'Moderate flexibility present'}`;
        }
        break;
      case 'temporal_work':
        if (input.temporalLandscape && currentStep === 1) {
          const deadlineCount = input.temporalLandscape.fixedDeadlines?.length || 0;
          const kairosCount = input.temporalLandscape.kairosOpportunities?.length || 0;
          return `Temporal landscape: ${deadlineCount} fixed constraints, ${kairosCount} kairos opportunities identified`;
        }
        if (input.pressureTransformation && currentStep === 3) {
          return `Pressure transformation in progress: ${input.pressureTransformation.length} catalytic techniques applied`;
        }
        break;
    }

    // Generic insights based on risk/antifragile properties
    if (input.antifragileProperties && input.antifragileProperties.length > 0) {
      return `Discovered ${input.antifragileProperties.length} antifragile properties that strengthen under stress`;
    }

    return undefined;
  }

  private generateHistoricalNote(
    input: ThinkingOperationData,
    session: SessionData
  ): string | undefined {
    // Look for repeated patterns or themes across steps
    const stepCount = session.history.length;

    if (stepCount >= 3) {
      // Check for risk awareness pattern
      const riskMentions = session.history.filter(h => h.risks && h.risks.length > 0).length;

      if (riskMentions >= 2) {
        return 'This session demonstrates consistent risk awareness across multiple thinking steps';
      }

      // Check for iterative refinement
      if (input.isRevision || Object.keys(session.branches).length > 0) {
        return 'Solution evolved through iterative refinement and exploration of alternatives';
      }
    }

    return undefined;
  }

  private identifyPattern(input: ThinkingOperationData, session: SessionData): string | undefined {
    const { technique } = input;

    // Pattern detection based on technique combinations
    if (technique === 'concept_extraction' && input.abstractedPatterns) {
      return `Cross-domain pattern transfer: ${input.abstractedPatterns.join(', ')}`;
    }

    if (technique === 'yes_and' && input.synthesis) {
      return 'Collaborative building pattern: initial idea → additions → synthesis';
    }

    // Detect constraint-driven innovation based on problem description
    if (session.problem.toLowerCase().includes('constraint')) {
      return 'Constraint-driven innovation: limitations sparked creative solutions';
    }

    return undefined;
  }

  private categorizeProblem(problem: string): string {
    const problemLower = problem.toLowerCase();

    if (problemLower.includes('improve') || problemLower.includes('enhance')) {
      return 'optimization';
    }
    if (problemLower.includes('create') || problemLower.includes('design')) {
      return 'creation';
    }
    if (problemLower.includes('solve') || problemLower.includes('fix')) {
      return 'problem-solving';
    }
    if (problemLower.includes('analyze') || problemLower.includes('understand')) {
      return 'analysis';
    }

    return 'general';
  }

  private identifySolutionPattern(session: SessionData): string {
    const techniques = session.history.map(h => h.technique);
    const uniqueTechniques = new Set(techniques);

    if (uniqueTechniques.size > 1) {
      return 'multi-technique synthesis';
    }

    if (Object.keys(session.branches).length > 0) {
      return 'branching exploration';
    }

    // Check history for subtractive patterns
    if (
      session.history.some(
        h =>
          (h.viaNegativaRemovals && h.viaNegativaRemovals.length > 0) ||
          h.scamperAction === 'eliminate'
      )
    ) {
      return 'subtractive innovation';
    }

    // Check history for integrative patterns
    if (session.history.some(h => h.scamperAction === 'combine' || h.synthesis)) {
      return 'integrative solution';
    }

    return 'linear progression';
  }

  private assessBreakthroughLevel(session: SessionData): number {
    let score = 0;

    // Factors that indicate breakthrough thinking
    if (session.history.length > 5) score += 2; // Long exploration
    if (Object.keys(session.branches).length > 0) score += 1;
    if (session.history.some(h => h.blackSwans && h.blackSwans.length > 0)) score += 2;
    if (session.history.some(h => h.antifragileProperties && h.antifragileProperties.length > 0))
      score += 1;
    if (session.history.some(h => h.principles && h.principles.length > 0)) score += 1;

    // Normalize to 0-10 scale
    return Math.min(score * 1.5, 10);
  }

  private extractPathDependencies(session: SessionData): string[] {
    const dependencies: string[] = [];

    // Extract key decisions that shaped the path
    session.history.forEach((step, index) => {
      if (step.technique === 'six_hats' && step.hatColor === 'purple') {
        dependencies.push('Ergodic perspective analysis');
      }

      if (step.isRevision) {
        dependencies.push(`Revision at step ${index + 1}`);
      }

      if (step.risks && step.risks.length > 0) {
        dependencies.push(`Risk identification at step ${index + 1}`);
      }
    });

    return dependencies;
  }

  private identifyNoteworthyPattern(
    input: ThinkingOperationData,
    session: SessionData
  ): LateralThinkingResponse['noteworthyPatterns'] | undefined {
    // Look for patterns worth remembering for future sessions

    // Via Negativa success
    if (input.viaNegativaRemovals && input.viaNegativaRemovals.length > 0) {
      return {
        observed: 'Successful application of Via Negativa principle',
        significance: 'Simplification through removal often more effective than addition',
        applicability: ['complex systems', 'feature creep', 'process optimization'],
      };
    }

    // Antifragile discovery
    if (input.antifragileProperties && input.antifragileProperties.length >= 2) {
      return {
        observed: 'Multiple antifragile properties identified',
        significance: 'Solution gains strength from stressors',
        applicability: ['volatile environments', 'long-term sustainability', 'adaptive systems'],
      };
    }

    // Cross-technique synergy
    if (session.history.length > 4 && new Set(session.history.map(h => h.technique)).size > 1) {
      return {
        observed: 'Effective multi-technique combination',
        significance: 'Different perspectives yielded comprehensive solution',
        applicability: ['complex problems', 'stakeholder alignment', 'holistic solutions'],
      };
    }

    return undefined;
  }

  // Discovery Layer: Analyze problem and recommend techniques
  public discoverTechniques(
    input: unknown
  ): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    try {
      // Validate input
      const args = input as DiscoverTechniquesInput;
      if (!args.problem) {
        throw new ValidationError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Problem description is required',
          'problem'
        );
      }

      // Analyze problem characteristics
      const problemLower = args.problem.toLowerCase();
      const contextLower = (args.context || '').toLowerCase();
      const combined = `${problemLower} ${contextLower}`;

      const recommendations: TechniqueRecommendation[] = [];

      // Six Hats - Good for comprehensive analysis
      if (
        combined.includes('analyze') ||
        combined.includes('comprehensive') ||
        combined.includes('perspective') ||
        combined.includes('team') ||
        combined.includes('decision')
      ) {
        recommendations.push({
          technique: 'six_hats',
          score: 0.9,
          reasoning:
            'Six Hats Plus provides comprehensive multi-perspective analysis with risk awareness',
          bestFor: ['team decisions', 'complex analysis', 'avoiding blind spots', 'group dynamics'],
          limitations: ['time-intensive', 'requires discipline to stay in role'],
        });
      }

      // PO - Good for breaking assumptions
      if (
        combined.includes('stuck') ||
        combined.includes('assumption') ||
        combined.includes('breakthrough') ||
        combined.includes('innovative') ||
        combined.includes('radical')
      ) {
        recommendations.push({
          technique: 'po',
          score: 0.85,
          reasoning:
            'PO technique excels at breaking mental patterns through provocative statements',
          bestFor: ['breaking assumptions', 'radical innovation', 'paradigm shifts'],
          limitations: [
            'requires suspension of judgment',
            'may produce impractical ideas initially',
          ],
        });
      }

      // Random Entry - Good for fresh perspectives
      if (
        combined.includes('creative') ||
        combined.includes('fresh') ||
        combined.includes('new ideas') ||
        combined.includes('inspiration') ||
        args.preferredOutcome === 'innovative'
      ) {
        recommendations.push({
          technique: 'random_entry',
          score: 0.8,
          reasoning: 'Random Entry provides unexpected connections and fresh perspectives',
          bestFor: ['creative blocks', 'new product ideas', 'marketing concepts'],
          limitations: ['may seem disconnected initially', 'requires creative confidence'],
        });
      }

      // SCAMPER - Good for improvement
      if (
        combined.includes('improve') ||
        combined.includes('modify') ||
        combined.includes('redesign') ||
        combined.includes('enhance') ||
        combined.includes('product')
      ) {
        recommendations.push({
          technique: 'scamper',
          score: 0.9,
          reasoning: 'SCAMPER systematically explores modifications with risk assessment',
          bestFor: ['product improvement', 'process optimization', 'iterative design'],
          limitations: ['focused on existing solutions', 'may miss radical innovations'],
        });
      }

      // Concept Extraction - Good for pattern transfer
      if (
        combined.includes('success') ||
        combined.includes('model') ||
        combined.includes('pattern') ||
        combined.includes('transfer') ||
        combined.includes('apply')
      ) {
        recommendations.push({
          technique: 'concept_extraction',
          score: 0.85,
          reasoning: 'Concept Extraction transfers successful patterns with boundary awareness',
          bestFor: ['cross-industry innovation', 'best practice adoption', 'pattern recognition'],
          limitations: ['requires good examples', 'domain boundaries may limit application'],
        });
      }

      // Yes, And - Good for collaboration
      if (
        combined.includes('collaborate') ||
        combined.includes('build on') ||
        combined.includes('team') ||
        combined.includes('workshop') ||
        args.preferredOutcome === 'collaborative'
      ) {
        recommendations.push({
          technique: 'yes_and',
          score: 0.85,
          reasoning: 'Yes, And fosters collaborative ideation with integrated critical evaluation',
          bestFor: ['team brainstorming', 'building on ideas', 'positive environments'],
          limitations: ['requires group participation', 'may delay critical evaluation'],
        });
      }

      // Design Thinking - Good for user-centered problems
      if (
        combined.includes('user') ||
        combined.includes('customer') ||
        combined.includes('experience') ||
        combined.includes('service') ||
        combined.includes('human')
      ) {
        recommendations.push({
          technique: 'design_thinking',
          score: 0.9,
          reasoning: 'Design Thinking provides human-centered innovation with threat modeling',
          bestFor: ['user experience', 'service design', 'customer problems', 'prototyping'],
          limitations: ['time-intensive', 'requires user access', 'may miss technical constraints'],
        });
      }

      // TRIZ - Good for technical contradictions
      if (
        combined.includes('technical') ||
        combined.includes('engineering') ||
        combined.includes('contradiction') ||
        combined.includes('constraint') ||
        combined.includes('optimize') ||
        args.preferredOutcome === 'systematic'
      ) {
        recommendations.push({
          technique: 'triz',
          score: 0.9,
          reasoning:
            'TRIZ systematically resolves contradictions using inventive principles and removal',
          bestFor: [
            'technical problems',
            'engineering challenges',
            'optimization',
            'simplification',
          ],
          limitations: ['requires problem abstraction', 'learning curve for principles'],
        });
      }

      // Neural State Optimization - Good for cognitive optimization
      if (
        combined.includes('focus') ||
        combined.includes('cognit') ||
        combined.includes('attention') ||
        combined.includes('mental') ||
        combined.includes('state') ||
        combined.includes('flow') ||
        combined.includes('productivity') ||
        combined.includes('creative block') ||
        combined.includes('switch') ||
        combined.includes('balance')
      ) {
        recommendations.push({
          technique: 'neural_state',
          score: 0.88,
          reasoning:
            'Neural State Optimization leverages brain network switching for optimal cognition',
          bestFor: [
            'cognitive optimization',
            'creative blocks',
            'focus challenges',
            'mental state management',
            'productivity enhancement',
          ],
          limitations: ['requires self-awareness', 'individual variation in effectiveness'],
        });
      }

      // Temporal Work Design (time, deadline, schedule, circadian, pressure)
      if (
        combined.includes('time') ||
        combined.includes('timeline') ||
        combined.includes('deadline') ||
        combined.includes('due date') ||
        combined.includes('schedule') ||
        combined.includes('circadian') ||
        combined.includes('pressure') ||
        combined.includes('crunch') ||
        combined.includes('sprint') ||
        combined.includes('milestone') ||
        combined.includes('kairos') ||
        combined.includes('chronos') ||
        combined.includes('temporal') ||
        combined.includes('urgent') ||
        combined.includes('rhythm')
      ) {
        recommendations.push({
          technique: 'temporal_work',
          score: 0.85,
          reasoning:
            'Temporal Work Design transforms time constraints into creative catalysts through kairos-chronos integration',
          bestFor: [
            'deadline management',
            'time optimization',
            'creative scheduling',
            'pressure transformation',
            'asynchronous collaboration',
          ],
          limitations: ['requires temporal flexibility', 'team coordination needed'],
        });
      }

      // If no specific matches, provide general recommendations
      if (recommendations.length === 0) {
        if (args.preferredOutcome === 'risk-aware') {
          recommendations.push({
            technique: 'six_hats',
            score: 0.7,
            reasoning: 'Six Hats Plus includes Black Hat for critical risk assessment',
            bestFor: ['risk analysis', 'careful evaluation'],
            limitations: ['time-intensive'],
          });
        } else if (args.preferredOutcome === 'analytical') {
          recommendations.push({
            technique: 'concept_extraction',
            score: 0.7,
            reasoning: 'Concept Extraction provides analytical pattern recognition',
            bestFor: ['pattern analysis', 'systematic transfer'],
            limitations: ['requires examples'],
          });
        } else {
          // Default recommendations
          recommendations.push({
            technique: 'scamper',
            score: 0.6,
            reasoning: 'SCAMPER is versatile and systematic for general improvement',
            bestFor: ['general improvement', 'systematic exploration'],
            limitations: ['may not produce radical innovation'],
          });
          recommendations.push({
            technique: 'six_hats',
            score: 0.6,
            reasoning: 'Six Hats provides comprehensive coverage for any problem',
            bestFor: ['thorough analysis', 'multiple perspectives'],
            limitations: ['time investment needed'],
          });
        }
      }

      // Adjust scores based on preferred outcome and ensure relevant techniques are included
      if (args.preferredOutcome === 'risk-aware') {
        // Ensure Six Hats is included for risk-aware
        if (!recommendations.find(r => r.technique === 'six_hats')) {
          recommendations.push({
            technique: 'six_hats',
            score: 0.85,
            reasoning: 'Six Hats Plus includes Black Hat for critical risk assessment',
            bestFor: ['risk analysis', 'careful evaluation', 'avoiding blind spots'],
            limitations: ['time-intensive'],
          });
        }
        // Boost Six Hats score
        recommendations.forEach(rec => {
          if (rec.technique === 'six_hats') {
            rec.score += 0.3; // Strong boost for risk-aware preference
          }
        });
      } else if (args.preferredOutcome === 'collaborative') {
        // Ensure Yes And is included for collaborative
        if (!recommendations.find(r => r.technique === 'yes_and')) {
          recommendations.push({
            technique: 'yes_and',
            score: 0.85,
            reasoning: 'Yes, And builds collaborative solutions through acceptance and iteration',
            bestFor: ['team building', 'brainstorming', 'collaborative problem solving'],
            limitations: ['requires open-minded participants'],
          });
        }
        // Boost Yes And score
        recommendations.forEach(rec => {
          if (rec.technique === 'yes_and') {
            rec.score += 0.3; // Strong boost for collaborative preference
          }
        });
      }

      // Sort by score
      recommendations.sort((a, b) => b.score - a.score);

      // Generate workflow suggestion for top techniques
      let suggestedWorkflow = '';
      if (recommendations.length > 1 && recommendations[0].score > 0.8) {
        if (
          recommendations[0].technique === 'six_hats' &&
          recommendations.find(r => r.technique === 'scamper')
        ) {
          suggestedWorkflow =
            'Consider using Six Hats for initial analysis, then SCAMPER for systematic improvement';
        } else if (
          recommendations[0].technique === 'design_thinking' &&
          recommendations.find(r => r.technique === 'triz')
        ) {
          suggestedWorkflow =
            'Start with Design Thinking for user insights, then use TRIZ for technical optimization';
        }
      }

      // Check flexibility and generate options if low
      let flexibilityWarning: DiscoverTechniquesOutput['flexibilityWarning'];
      let generatedOptions: DiscoverTechniquesOutput['generatedOptions'];

      // Determine flexibility - use provided value or check session
      let currentFlexibility = args.currentFlexibility;

      if (args.sessionId && !currentFlexibility) {
        const session = this.sessions.get(args.sessionId);
        if (session) {
          this.touchSession(args.sessionId);
          // Calculate flexibility from session state
          currentFlexibility = this.ergodicityManager.getCurrentFlexibility().flexibilityScore;
        }
      }

      // If flexibility is low (below 40%), generate options
      if (currentFlexibility !== undefined && currentFlexibility < 0.4) {
        flexibilityWarning = {
          currentFlexibility,
          isLow: true,
          message: `Warning: Your current flexibility is critically low at ${(currentFlexibility * 100).toFixed(0)}%. Generating options to increase your degrees of freedom before applying creative techniques.`,
        };

        // Generate options if we have session context
        if (args.sessionId) {
          const session = this.sessions.get(args.sessionId);
          if (session) {
            this.touchSession(args.sessionId);
            const optionResult = this.ergodicityManager.generateOptions(session, 5); // Generate top 5 options

            generatedOptions = {
              totalOptions: optionResult.options.length,
              topOptions: optionResult.options.slice(0, 5).map(opt => ({
                name: opt.name,
                description: opt.description,
                strategy: opt.strategy,
                flexibilityGain: opt.flexibilityGain || 0,
                actions: opt.actions,
              })),
              recommendation:
                'Consider implementing one or more of these options before proceeding with creative techniques. This will give you more room to maneuver and better results.',
            };
          }
        }
      }

      // Check if escape velocity analysis is needed
      let escapeVelocityAnalysis: DiscoverTechniquesOutput['escapeVelocityAnalysis'];

      if (currentFlexibility !== undefined && currentFlexibility < 0.3 && args.sessionId) {
        const session = this.sessions.get(args.sessionId);
        if (session) {
          this.touchSession(args.sessionId);
          // Check if escape is needed
          const isEscapeNeeded = this.ergodicityManager.isEscapeVelocityNeeded();
          const urgency = this.ergodicityManager.getEscapeUrgency();

          if (isEscapeNeeded) {
            // Get available protocols based on flexibility
            const availableProtocols =
              this.ergodicityManager.getAvailableEscapeVelocityProtocols(currentFlexibility);

            // Perform escape analysis
            const analysis = this.ergodicityManager.analyzeEscapeVelocity(session);

            escapeVelocityAnalysis = {
              needed: true,
              urgency,
              constraintStrength: analysis.constraintStrength,
              availableProtocols: availableProtocols.map(p => `${p.name} (${p.executionTime})`),
              recommendation:
                urgency === 'critical'
                  ? 'CRITICAL: Your flexibility is severely constrained. Consider executing an escape protocol before attempting creative techniques.'
                  : 'Escape velocity protocols are available to help break free from constraints if needed.',
            };
          }
        }
      }

      const output: DiscoverTechniquesOutput = {
        recommendations: recommendations.slice(0, 3), // Top 3 recommendations
        reasoning: `Based on your problem involving "${args.problem.substring(0, 100)}..."${
          args.preferredOutcome ? ` with ${args.preferredOutcome} outcomes` : ''
        }, I recommend these techniques.`,
        suggestedWorkflow,
        flexibilityWarning,
        generatedOptions,
        escapeVelocityAnalysis,
      };

      return Promise.resolve({
        content: [
          {
            type: 'text',
            text: JSON.stringify(output, null, 2),
          },
        ],
      });
    } catch (error) {
      const errorResponse = createErrorResponse(error, 'execution');
      return Promise.resolve({
        content: [
          {
            type: 'text',
            text: JSON.stringify(errorResponse, null, 2),
          },
        ],
        isError: true,
      });
    }
  }

  // Planning Layer: Create structured workflow
  public planThinkingSession(
    input: unknown
  ): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    try {
      const args = input as PlanThinkingSessionInput;

      if (!args.problem || !args.techniques || args.techniques.length === 0) {
        throw new ValidationError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Problem and at least one technique are required'
        );
      }

      const planId = `plan_${randomUUID()}`;
      const workflow: ThinkingStep[] = [];
      let stepNumber = 1;

      // Build workflow based on techniques
      for (const technique of args.techniques) {
        const techniqueSteps = this.getTechniqueSteps(technique);

        switch (technique) {
          case 'six_hats': {
            const hats: SixHatsColor[] = [
              'blue',
              'white',
              'red',
              'yellow',
              'black',
              'green',
              'purple',
            ];
            for (let i = 0; i < techniqueSteps; i++) {
              const hat = hats[i];
              const hatInfo = this.getSixHatsInfo(hat);
              workflow.push({
                technique,
                stepNumber: stepNumber++,
                description: `${hatInfo.name}: ${hatInfo.enhancedFocus || hatInfo.focus}`,
                expectedOutputs: [
                  `${hat} hat perspective on the problem`,
                  'Identified risks or opportunities',
                  'Insights specific to this thinking mode',
                ],
                riskConsiderations:
                  hat === 'black' ? ['Critical risks', 'Failure modes'] : undefined,
              });
            }
            break;
          }

          case 'po':
            workflow.push(
              {
                technique,
                stepNumber: stepNumber++,
                description: 'Create a provocative statement',
                expectedOutputs: ['Bold Po: statement', 'Challenge to assumptions'],
                riskConsiderations: ['May seem absurd initially'],
              },
              {
                technique,
                stepNumber: stepNumber++,
                description: 'Explore and then challenge the provocation',
                expectedOutputs: ['Creative explorations', 'Critical examination'],
              },
              {
                technique,
                stepNumber: stepNumber++,
                description: 'Extract and verify principles',
                expectedOutputs: ['Key principles', 'Hypothesis tests'],
                riskConsiderations: ['Verification needed'],
              },
              {
                technique,
                stepNumber: stepNumber++,
                description: 'Develop robust solutions',
                expectedOutputs: ['Practical solutions', 'Failure mode analysis'],
                riskConsiderations: ['Implementation challenges'],
              }
            );
            break;

          case 'scamper': {
            const actions: ScamperAction[] = [
              'substitute',
              'combine',
              'adapt',
              'modify',
              'put_to_other_use',
              'eliminate',
              'reverse',
            ];
            for (const action of actions) {
              workflow.push({
                technique,
                stepNumber: stepNumber++,
                description: `${action.charAt(0).toUpperCase() + action.slice(1).replace(/_/g, ' ')}: ${this.getScamperDescription(action)}`,
                expectedOutputs: [`Ideas for ${action}`, 'Risk assessment'],
                riskConsiderations: [`What could go wrong with ${action}?`],
              });
            }
            break;
          }

          case 'design_thinking': {
            const stages: DesignThinkingStage[] = [
              'empathize',
              'define',
              'ideate',
              'prototype',
              'test',
            ];
            const stageDescriptions = {
              empathize: 'Understand users and identify threat vectors',
              define: 'Frame problem and potential failure modes',
              ideate: "Generate solutions with devil's advocate",
              prototype: 'Build quick tests including edge cases',
              test: 'Gather feedback and harvest failures',
            };
            for (const stage of stages) {
              workflow.push({
                technique,
                stepNumber: stepNumber++,
                description: `${stage.charAt(0).toUpperCase() + stage.slice(1)}: ${stageDescriptions[stage]}`,
                expectedOutputs: this.getDesignThinkingOutputs(stage),
                riskConsiderations:
                  stage === 'define' ? ['Failure modes', 'Edge cases'] : undefined,
              });
            }
            break;
          }

          case 'triz':
            workflow.push(
              {
                technique,
                stepNumber: stepNumber++,
                description: 'Identify core contradiction',
                expectedOutputs: ['Clear contradiction statement', 'Conflicting parameters'],
                riskConsiderations: ['Oversimplification risk'],
              },
              {
                technique,
                stepNumber: stepNumber++,
                description: 'Apply Via Negativa - What to remove?',
                expectedOutputs: ['List of removals', 'Simplification opportunities'],
              },
              {
                technique,
                stepNumber: stepNumber++,
                description: 'Apply inventive principles',
                expectedOutputs: ['Relevant TRIZ principles', 'Creative applications'],
              },
              {
                technique,
                stepNumber: stepNumber++,
                description: 'Develop minimal solution',
                expectedOutputs: ['Simplified solution', 'Achieved through removal'],
                riskConsiderations: ['Verify nothing essential removed'],
              }
            );
            break;
          case 'neural_state':
            workflow.push(
              {
                technique,
                stepNumber: stepNumber++,
                description: 'Assess current neural state (DMN vs ECN dominance)',
                expectedOutputs: [
                  'Current dominant network identification',
                  'Cognitive patterns observed',
                  'Attention/focus challenges',
                ],
                riskConsiderations: ['Individual variation in neural patterns'],
              },
              {
                technique,
                stepNumber: stepNumber++,
                description: 'Identify network suppression patterns',
                expectedOutputs: [
                  'Suppression depth analysis',
                  'Stuck patterns identified',
                  'Cognitive flexibility barriers',
                ],
              },
              {
                technique,
                stepNumber: stepNumber++,
                description: 'Develop network switching rhythm',
                expectedOutputs: [
                  'Switching techniques identified',
                  'Rhythm patterns established',
                  'Transition triggers defined',
                ],
                riskConsiderations: ['Avoid forced switching that disrupts flow'],
              },
              {
                technique,
                stepNumber: stepNumber++,
                description: 'Integrate insights for optimal cognition',
                expectedOutputs: [
                  'Personal neural optimization strategy',
                  'Integration of DMN creativity with ECN focus',
                  'Sustainable cognitive patterns',
                ],
              }
            );
            break;

          case 'temporal_work':
            workflow.push(
              {
                technique,
                stepNumber: stepNumber++,
                description: 'Map temporal landscape (fixed deadlines, flexible windows)',
                expectedOutputs: [
                  'Fixed deadline identification',
                  'Flexible time windows',
                  'Pressure points mapped',
                  'Creative dead zones identified',
                  'Kairos opportunities found',
                ],
                riskConsiderations: ['Over-optimization can reduce adaptability'],
              },
              {
                technique,
                stepNumber: stepNumber++,
                description: 'Align with circadian rhythms and energy patterns',
                expectedOutputs: [
                  'Peak creative hours identified',
                  'Off-peak insight windows',
                  'Energy cycle mapping',
                  'Task-time alignment',
                ],
                riskConsiderations: ['Individual variations', 'Team synchronization challenges'],
              },
              {
                technique,
                stepNumber: stepNumber++,
                description: 'Transform deadline pressure into creative catalyst',
                expectedOutputs: [
                  'Pressure transformation techniques',
                  'Creative crunch design',
                  'Recovery period planning',
                  'Stress-to-energy conversion',
                ],
                riskConsiderations: ['Burnout prevention needed'],
              },
              {
                technique,
                stepNumber: stepNumber++,
                description: 'Balance asynchronous and synchronous work',
                expectedOutputs: [
                  'Solo exploration time allocation',
                  'Group integration sessions',
                  'Convergence prevention',
                  'Temporal flexibility maintained',
                ],
              },
              {
                technique,
                stepNumber: stepNumber++,
                description: 'Design temporal escape routes and buffers',
                expectedOutputs: [
                  'Buffer zones created',
                  'Time loan mechanisms',
                  'Graceful degradation plans',
                  'Quality thresholds maintained',
                ],
                riskConsiderations: ['Early rushing creates quality ceiling'],
              }
            );
            break;

          default:
            // Add generic steps for other techniques
            for (let i = 0; i < techniqueSteps; i++) {
              workflow.push({
                technique,
                stepNumber: stepNumber++,
                description: `${technique} step ${i + 1}`,
                expectedOutputs: ['Creative output', 'Insights'],
                riskConsiderations: i === techniqueSteps - 1 ? ['Final validation'] : undefined,
              });
            }
        }
      }

      // Define objectives if not provided
      const objectives = args.objectives || [
        'Generate diverse creative solutions',
        'Identify and mitigate risks',
        'Develop robust, antifragile approaches',
      ];

      // Define success criteria
      const successCriteria = [
        'Multiple solution options generated',
        'Risks identified and addressed',
        'Solutions tested against failure modes',
        ...(args.timeframe === 'thorough' || args.timeframe === 'comprehensive'
          ? ['Thorough analysis from all angles']
          : []),
      ];

      // Check flexibility and add option generation phase if needed
      let optionGenerationPhase: PlanThinkingSessionOutput['optionGenerationPhase'];

      if (args.sessionId || args.includeOptions) {
        let currentFlexibility = 0.5; // Default moderate flexibility

        if (args.sessionId) {
          const session = this.sessions.get(args.sessionId);
          if (session) {
            this.touchSession(args.sessionId);
            currentFlexibility = this.ergodicityManager.getCurrentFlexibility().flexibilityScore;
          }
        }

        // Determine if option generation is needed
        if (currentFlexibility < 0.4) {
          optionGenerationPhase = {
            reason: `Current flexibility is critically low at ${(currentFlexibility * 100).toFixed(0)}%. Option generation is essential before creative techniques can be effective.`,
            suggestedOptions: 5,
            priority: 'critical',
          };
        } else if (currentFlexibility < 0.6 && args.includeOptions) {
          optionGenerationPhase = {
            reason: `Current flexibility is moderate at ${(currentFlexibility * 100).toFixed(0)}%. Option generation recommended for better results.`,
            suggestedOptions: 3,
            priority: 'recommended',
          };
        } else if (args.includeOptions) {
          optionGenerationPhase = {
            reason: `Flexibility is adequate at ${(currentFlexibility * 100).toFixed(0)}%, but additional options can enhance creative outcomes.`,
            suggestedOptions: 2,
            priority: 'optional',
          };
        }
      }

      // Check if escape protocol is needed
      let escapeProtocolPhase: PlanThinkingSessionOutput['escapeProtocolPhase'];

      if (args.sessionId) {
        const session = this.sessions.get(args.sessionId);
        if (session) {
          this.touchSession(args.sessionId);
          const flexibility = this.ergodicityManager.getCurrentFlexibility().flexibilityScore;

          // If flexibility is critically low, recommend escape protocol
          if (flexibility < 0.2) {
            const availableProtocols =
              this.ergodicityManager.getAvailableEscapeVelocityProtocols(flexibility);
            const recommendedProtocol = availableProtocols[0]; // Get the most suitable protocol

            if (recommendedProtocol) {
              escapeProtocolPhase = {
                needed: true,
                protocol: `${recommendedProtocol.name} (${recommendedProtocol.executionTime})`,
                reason: `Flexibility is critically low at ${(flexibility * 100).toFixed(0)}%. Escape protocol recommended to break free from constraints before creative techniques.`,
                prerequisite: true, // Must be done first
              };
            }
          } else if (flexibility < 0.35) {
            // Optional escape protocol for moderate constraints
            const availableProtocols =
              this.ergodicityManager.getAvailableEscapeVelocityProtocols(flexibility);
            if (availableProtocols.length > 0) {
              escapeProtocolPhase = {
                needed: true,
                protocol: availableProtocols.map(p => p.name).join(', '),
                reason:
                  'Escape protocols available to increase flexibility if constraints become too limiting.',
                prerequisite: false, // Can be done during workflow if needed
              };
            }
          }
        }
      }

      const output: PlanThinkingSessionOutput = {
        planId,
        workflow,
        estimatedSteps: workflow.length,
        objectives,
        successCriteria,
        createdAt: Date.now(),
        optionGenerationPhase,
        escapeProtocolPhase,
      };

      // Store the plan
      this.plans.set(planId, output);

      return Promise.resolve({
        content: [
          {
            type: 'text',
            text: JSON.stringify(output, null, 2),
          },
        ],
      });
    } catch (error) {
      const errorResponse = createErrorResponse(error, 'execution');
      return Promise.resolve({
        content: [
          {
            type: 'text',
            text: JSON.stringify(errorResponse, null, 2),
          },
        ],
        isError: true,
      });
    }
  }

  // Execution Layer: Execute individual thinking steps
  public async executeThinkingStep(
    input: unknown
  ): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    const execInput = input as ExecuteThinkingStepInput;

    // Validate planId is provided
    if (!execInput.planId) {
      return Promise.resolve({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: 'planId is required',
                message:
                  'You must first create a plan using plan_thinking_session before executing steps.',
                workflow: 'discover_techniques → plan_thinking_session → execute_thinking_step',
                example: {
                  step1: "discover_techniques({ problem: 'How to improve X' })",
                  step2:
                    "plan_thinking_session({ problem: 'How to improve X', techniques: ['six_hats'] })",
                  step3:
                    "execute_thinking_step({ planId: 'plan_xxx', technique: 'six_hats', ... })",
                },
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      });
    }

    // Validate planId exists
    const plan = this.plans.get(execInput.planId);
    if (!plan) {
      return Promise.resolve({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: 'Invalid planId',
                message: `Plan '${execInput.planId}' not found. Please create a plan first using plan_thinking_session.`,
                availablePlans: Array.from(this.plans.keys()),
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      });
    }

    // Validate technique matches plan
    const plannedTechniques = plan.workflow.map(step => step.technique);
    if (!plannedTechniques.includes(execInput.technique)) {
      return Promise.resolve({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: 'Technique mismatch',
                message: `Technique '${execInput.technique}' is not part of the plan.`,
                plannedTechniques: [...new Set(plannedTechniques)],
                suggestion: 'Use one of the planned techniques or create a new plan.',
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      });
    }

    // Delegate to existing processLateralThinking
    return this.processLateralThinking(execInput);
  }

  private getScamperDescription(action: ScamperAction): string {
    const descriptions: Record<ScamperAction, string> = {
      substitute: 'Replace parts, materials, or people',
      combine: 'Merge with other ideas or functions',
      adapt: 'Adjust for different contexts or uses',
      modify: 'Magnify, minimize, or modify attributes',
      put_to_other_use: 'Find new applications or users',
      eliminate: 'Remove unnecessary elements',
      reverse: 'Invert, reverse, or rearrange',
    };
    return descriptions[action];
  }

  private getDesignThinkingOutputs(stage: DesignThinkingStage): string[] {
    const outputs: Record<DesignThinkingStage, string[]> = {
      empathize: ['User insights', 'Pain points', 'Potential misuse cases'],
      define: ['Problem statement', 'Success metrics', 'Failure modes'],
      ideate: ['Solution ideas', 'Risk assessments', 'Creative alternatives'],
      prototype: ['Prototype description', 'Test plan', 'Edge cases covered'],
      test: ['User feedback', 'Failure insights', 'Iteration opportunities'],
    };
    return outputs[stage];
  }
}

// Discovery Layer Tool
const DISCOVER_TECHNIQUES_TOOL: Tool = {
  name: 'discover_techniques',
  description: `Analyzes your problem and recommends the most suitable creative thinking techniques.
This tool examines the nature of your challenge and suggests which technique(s) would be most effective.

Features:
- Problem analysis and categorization
- Technique matching based on problem characteristics
- Considers your preferred outcomes and constraints
- Provides reasoning for recommendations
- Suggests workflows for complex problems
- Automatically generates options when flexibility is low

Use this when you're not sure which creative thinking technique to apply.`,
  inputSchema: {
    type: 'object',
    properties: {
      problem: {
        type: 'string',
        description: 'The problem or challenge you want to solve',
      },
      context: {
        type: 'string',
        description: 'Additional context about the situation',
      },
      preferredOutcome: {
        type: 'string',
        enum: ['innovative', 'systematic', 'risk-aware', 'collaborative', 'analytical'],
        description: 'The type of solution you prefer',
      },
      constraints: {
        type: 'array',
        items: { type: 'string' },
        description: 'Any constraints or limitations to consider',
      },
      sessionId: {
        type: 'string',
        description: 'Optional: Current session ID to check flexibility and generate options',
      },
      currentFlexibility: {
        type: 'number',
        description:
          'Optional: Current flexibility score (0-1). If not provided, will be calculated from session',
        minimum: 0,
        maximum: 1,
      },
    },
    required: ['problem'],
  },
};

// Planning Layer Tool
const PLAN_THINKING_SESSION_TOOL: Tool = {
  name: 'plan_thinking_session',
  description: `Creates a structured workflow for applying one or more creative thinking techniques.
This tool designs a step-by-step plan tailored to your specific problem and objectives.

Features:
- Multi-technique workflow planning
- Step-by-step guidance with expected outputs
- Risk considerations for each step
- Time-based planning (quick/thorough/comprehensive)
- Success criteria definition
- Automatic flexibility assessment and option generation recommendation

Use this after discovering which techniques to apply, or when you know you need multiple techniques.`,
  inputSchema: {
    type: 'object',
    properties: {
      problem: {
        type: 'string',
        description: 'The problem to solve',
      },
      techniques: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'six_hats',
            'po',
            'random_entry',
            'scamper',
            'concept_extraction',
            'yes_and',
            'design_thinking',
            'triz',
            'neural_state',
            'temporal_work',
          ],
        },
        description: 'The techniques to include in the workflow',
      },
      objectives: {
        type: 'array',
        items: { type: 'string' },
        description: 'Specific objectives for this session',
      },
      constraints: {
        type: 'array',
        items: { type: 'string' },
        description: 'Constraints to work within',
      },
      timeframe: {
        type: 'string',
        enum: ['quick', 'thorough', 'comprehensive'],
        description: 'How much time/depth to invest',
      },
      sessionId: {
        type: 'string',
        description: 'Optional: Current session ID to assess flexibility',
      },
      includeOptions: {
        type: 'boolean',
        description: 'Whether to include option generation phase in the plan',
        default: false,
      },
    },
    required: ['problem', 'techniques'],
  },
};

// Execution Layer Tool (refactored from original)
const EXECUTE_THINKING_STEP_TOOL: Tool = {
  name: 'execute_thinking_step',
  description: `Executes a single step in your creative thinking process.
This requires a plan created by plan_thinking_session.

The three-layer workflow ensures systematic creative thinking:
1. discover_techniques - Find the best techniques for your problem
2. plan_thinking_session - Create a structured workflow  
3. execute_thinking_step - Execute the plan step by step`,
  inputSchema: {
    type: 'object',
    properties: {
      planId: {
        type: 'string',
        description: 'Required: ID from plan_thinking_session',
      },
      technique: {
        type: 'string',
        enum: [
          'six_hats',
          'po',
          'random_entry',
          'scamper',
          'concept_extraction',
          'yes_and',
          'design_thinking',
          'triz',
          'neural_state',
        ],
        description: 'The lateral thinking technique to use',
      },
      problem: {
        type: 'string',
        description: 'The problem or challenge to address',
      },
      currentStep: {
        type: 'integer',
        description: 'Current step number in the technique',
        minimum: 1,
      },
      totalSteps: {
        type: 'integer',
        description: 'Total steps for this technique',
        minimum: 1,
      },
      output: {
        type: 'string',
        description: 'Your creative output for this step',
      },
      nextStepNeeded: {
        type: 'boolean',
        description: 'Whether another step is needed',
      },
      // Include all technique-specific fields...
      hatColor: {
        type: 'string',
        enum: ['blue', 'white', 'red', 'yellow', 'black', 'green'],
      },
      provocation: { type: 'string' },
      principles: { type: 'array', items: { type: 'string' } },
      randomStimulus: { type: 'string' },
      connections: { type: 'array', items: { type: 'string' } },
      scamperAction: {
        type: 'string',
        enum: [
          'substitute',
          'combine',
          'adapt',
          'modify',
          'put_to_other_use',
          'eliminate',
          'reverse',
        ],
      },
      successExample: { type: 'string' },
      extractedConcepts: { type: 'array', items: { type: 'string' } },
      abstractedPatterns: { type: 'array', items: { type: 'string' } },
      applications: { type: 'array', items: { type: 'string' } },
      initialIdea: { type: 'string' },
      additions: { type: 'array', items: { type: 'string' } },
      evaluations: { type: 'array', items: { type: 'string' } },
      synthesis: { type: 'string' },
      designStage: {
        type: 'string',
        enum: ['empathize', 'define', 'ideate', 'prototype', 'test'],
      },
      empathyInsights: { type: 'array', items: { type: 'string' } },
      problemStatement: { type: 'string' },
      failureModesPredicted: { type: 'array', items: { type: 'string' } },
      ideaList: { type: 'array', items: { type: 'string' } },
      prototypeDescription: { type: 'string' },
      stressTestResults: { type: 'array', items: { type: 'string' } },
      userFeedback: { type: 'array', items: { type: 'string' } },
      failureInsights: { type: 'array', items: { type: 'string' } },
      contradiction: { type: 'string' },
      inventivePrinciples: { type: 'array', items: { type: 'string' } },
      viaNegativaRemovals: { type: 'array', items: { type: 'string' } },
      minimalSolution: { type: 'string' },
      risks: { type: 'array', items: { type: 'string' } },
      failureModes: { type: 'array', items: { type: 'string' } },
      mitigations: { type: 'array', items: { type: 'string' } },
      antifragileProperties: { type: 'array', items: { type: 'string' } },
      blackSwans: { type: 'array', items: { type: 'string' } },
      // Neural State Optimization fields
      dominantNetwork: {
        type: 'string',
        enum: ['dmn', 'ecn'],
        description: 'Default Mode Network vs Executive Control Network',
      },
      suppressionDepth: {
        type: 'number',
        minimum: 0,
        maximum: 10,
        description: 'Depth of network suppression (0-10 scale)',
      },
      switchingRhythm: {
        type: 'array',
        items: { type: 'string' },
        description: 'Patterns for network switching',
      },
      integrationInsights: {
        type: 'array',
        items: { type: 'string' },
        description: 'Insights from network integration',
      },
      // Temporal Work Design fields
      temporalLandscape: {
        type: 'object',
        properties: {
          fixedDeadlines: { type: 'array', items: { type: 'string' } },
          flexibleWindows: { type: 'array', items: { type: 'string' } },
          pressurePoints: { type: 'array', items: { type: 'string' } },
          deadZones: { type: 'array', items: { type: 'string' } },
          kairosOpportunities: { type: 'array', items: { type: 'string' } },
        },
        description: 'Temporal landscape mapping',
      },
      circadianAlignment: {
        type: 'array',
        items: { type: 'string' },
        description: 'Circadian rhythm alignments',
      },
      pressureTransformation: {
        type: 'array',
        items: { type: 'string' },
        description: 'Pressure transformation techniques',
      },
      asyncSyncBalance: {
        type: 'array',
        items: { type: 'string' },
        description: 'Async/sync work balance strategies',
      },
      temporalEscapeRoutes: {
        type: 'array',
        items: { type: 'string' },
        description: 'Temporal escape routes and buffers',
      },
      sessionId: { type: 'string' },
      isRevision: { type: 'boolean' },
      revisesStep: { type: 'integer', minimum: 1 },
      branchFromStep: { type: 'integer', minimum: 1 },
      branchId: { type: 'string' },
    },
    required: [
      'planId',
      'technique',
      'problem',
      'currentStep',
      'totalSteps',
      'output',
      'nextStepNeeded',
    ],
  },
};

// Server initialization
// NOTE: Escape Velocity and Option Generation are NOT exposed as separate tools
// They are integrated into the three-layer workflow:
// - Low flexibility warnings and option generation in discover_techniques
// - Option generation phase recommendations in plan_thinking_session
// - Escape protocols can be triggered internally when needed

const server = new Server(
  {
    name: 'creative-thinking-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const lateralServer = new LateralThinkingServer();

server.setRequestHandler(ListToolsRequestSchema, () => ({
  tools: [DISCOVER_TECHNIQUES_TOOL, PLAN_THINKING_SESSION_TOOL, EXECUTE_THINKING_STEP_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async request => {
  switch (request.params.name) {
    case 'discover_techniques':
      return lateralServer.discoverTechniques(request.params.arguments);
    case 'plan_thinking_session':
      return lateralServer.planThinkingSession(request.params.arguments);
    case 'execute_thinking_step':
      return lateralServer.executeThinkingStep(request.params.arguments);
    default:
      return {
        content: [
          {
            type: 'text',
            text: `Unknown tool: ${request.params.name}`,
          },
        ],
        isError: true,
      };
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Creative Thinking MCP Server running on stdio');
}

runServer().catch(error => {
  console.error('Fatal error running server:', error);
  process.exit(1);
});
