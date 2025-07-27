#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import chalk from 'chalk';
import { randomUUID } from 'crypto';
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
  | 'triz';
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
}

export interface LateralThinkingData {
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

  // Session management operations
  sessionOperation?: 'save' | 'load' | 'list' | 'delete' | 'export';

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

  // Auto-save preference
  autoSave?: boolean;
}

export interface SessionData {
  technique: LateralTechnique;
  problem: string;
  history: Array<LateralThinkingData & { timestamp: string }>;
  branches: Record<string, LateralThinkingData[]>;
  insights: string[];
  // Meta-learning data
  startTime?: number;
  endTime?: number;
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
}

export class LateralThinkingServer {
  private sessions: Map<string, SessionData> = new Map();
  private plans: Map<string, PlanThinkingSessionOutput> = new Map();
  private currentSessionId: string | null = null;
  private disableThoughtLogging: boolean;
  private readonly SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly PLAN_TTL = 4 * 60 * 60 * 1000; // 4 hours for plans
  private cleanupInterval: NodeJS.Timeout | null = null;
  private persistenceAdapter: PersistenceAdapter | null = null;
  private ergodicityManager: ErgodicityManager;

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
    // Run cleanup every hour
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupOldSessions();
      },
      60 * 60 * 1000
    );
  }

  private cleanupOldSessions(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      // Clean up old sessions with startTime
      if (session.startTime && now - session.startTime > this.SESSION_TTL) {
        this.sessions.delete(id);
        if (this.currentSessionId === id) {
          this.currentSessionId = null;
        }
      }
      // Fallback: Clean up sessions without startTime that have been completed
      else if (!session.startTime && session.endTime && now - session.endTime > this.SESSION_TTL) {
        this.sessions.delete(id);
        if (this.currentSessionId === id) {
          this.currentSessionId = null;
        }
      }
      // Additional fallback: Clean up very old sessions without any timestamps
      else if (!session.startTime && !session.endTime && session.history.length === 0) {
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
    input: LateralThinkingData
  ): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    if (!this.persistenceAdapter) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: 'Persistence not available',
                status: 'failed',
              },
              null,
              2
            ),
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
      default:
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: `Unknown session operation: ${input.sessionOperation}`,
                  status: 'failed',
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
    }
  }

  /**
   * Save current session
   */
  private async handleSaveOperation(
    input: LateralThinkingData
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      if (!this.currentSessionId || !this.sessions.has(this.currentSessionId)) {
        throw new Error('No active session to save');
      }

      const session = this.sessions.get(this.currentSessionId);
      if (!session) {
        throw new Error('Session not found');
      }

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
      return Promise.resolve({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: error instanceof Error ? error.message : String(error),
                status: 'failed',
              },
              null,
              2
            ),
          },
        ],
      });
    }
  }

  /**
   * Load a saved session
   */
  private async handleLoadOperation(
    input: LateralThinkingData
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      if (!input.loadOptions?.sessionId) {
        throw new Error('Session ID required for load operation');
      }

      if (!this.persistenceAdapter) {
        throw new Error('Persistence adapter not initialized');
      }
      const loadedState = await this.persistenceAdapter.load(input.loadOptions.sessionId);
      if (!loadedState) {
        throw new Error('Session not found');
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
            acc[key] = value as LateralThinkingData[];
            return acc;
          },
          {} as Record<string, LateralThinkingData[]>
        ),
        insights: loadedState.insights,
        startTime: loadedState.startTime,
        endTime: loadedState.endTime,
        metrics: loadedState.metrics,
        tags: loadedState.tags,
        name: loadedState.name,
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
      return Promise.resolve({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: error instanceof Error ? error.message : String(error),
                status: 'failed',
              },
              null,
              2
            ),
          },
        ],
      });
    }
  }

  /**
   * List saved sessions
   */
  private async handleListOperation(
    input: LateralThinkingData
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      const options = input.listOptions || {};
      if (!this.persistenceAdapter) {
        throw new Error('Persistence adapter not initialized');
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
      return Promise.resolve({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: error instanceof Error ? error.message : String(error),
                status: 'failed',
              },
              null,
              2
            ),
          },
        ],
      });
    }
  }

  /**
   * Delete a saved session
   */
  private async handleDeleteOperation(
    input: LateralThinkingData
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      if (!input.deleteOptions?.sessionId) {
        throw new Error('Session ID required for delete operation');
      }

      if (!this.persistenceAdapter) {
        throw new Error('Persistence adapter not initialized');
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
      return Promise.resolve({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: error instanceof Error ? error.message : String(error),
                status: 'failed',
              },
              null,
              2
            ),
          },
        ],
      });
    }
  }

  /**
   * Export a session
   */
  private async handleExportOperation(
    input: LateralThinkingData
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      if (!input.exportOptions?.sessionId || !input.exportOptions?.format) {
        throw new Error('Session ID and format required for export operation');
      }

      if (!this.persistenceAdapter) {
        throw new Error('Persistence adapter not initialized');
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
      return Promise.resolve({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: error instanceof Error ? error.message : String(error),
                status: 'failed',
              },
              null,
              2
            ),
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

  private validateInput(input: unknown): LateralThinkingData {
    const data = input as Record<string, unknown>;

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
      ].includes(data.technique as string)
    ) {
      throw new Error(
        'Invalid technique: must be one of six_hats, po, random_entry, scamper, concept_extraction, yes_and, design_thinking, or triz'
      );
    }
    if (!data.problem || typeof data.problem !== 'string') {
      throw new Error('Invalid problem: must be a string');
    }
    if (!data.currentStep || typeof data.currentStep !== 'number') {
      throw new Error('Invalid currentStep: must be a number');
    }
    if (!data.totalSteps || typeof data.totalSteps !== 'number') {
      throw new Error('Invalid totalSteps: must be a number');
    }
    if (!data.output || typeof data.output !== 'string') {
      throw new Error('Invalid output: must be a string');
    }
    if (typeof data.nextStepNeeded !== 'boolean') {
      throw new Error('Invalid nextStepNeeded: must be a boolean');
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
      throw new Error('Invalid hatColor for six_hats technique');
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
      throw new Error('Invalid scamperAction for scamper technique');
    }

    // Validate concept extraction specific fields
    if (technique === 'concept_extraction') {
      if (data.extractedConcepts && !Array.isArray(data.extractedConcepts)) {
        throw new Error('extractedConcepts must be an array for concept_extraction technique');
      }
      if (data.abstractedPatterns && !Array.isArray(data.abstractedPatterns)) {
        throw new Error('abstractedPatterns must be an array for concept_extraction technique');
      }
      if (data.applications && !Array.isArray(data.applications)) {
        throw new Error('applications must be an array for concept_extraction technique');
      }
    }

    // Validate unified framework fields
    if (data.risks && (!Array.isArray(data.risks) || data.risks.some(r => typeof r !== 'string'))) {
      throw new Error('risks must be an array of strings');
    }
    if (
      data.failureModes &&
      (!Array.isArray(data.failureModes) || data.failureModes.some(f => typeof f !== 'string'))
    ) {
      throw new Error('failureModes must be an array of strings');
    }
    if (
      data.mitigations &&
      (!Array.isArray(data.mitigations) || data.mitigations.some(m => typeof m !== 'string'))
    ) {
      throw new Error('mitigations must be an array of strings');
    }
    if (
      data.antifragileProperties &&
      (!Array.isArray(data.antifragileProperties) ||
        data.antifragileProperties.some(a => typeof a !== 'string'))
    ) {
      throw new Error('antifragileProperties must be an array of strings');
    }
    if (
      data.blackSwans &&
      (!Array.isArray(data.blackSwans) || data.blackSwans.some(b => typeof b !== 'string'))
    ) {
      throw new Error('blackSwans must be an array of strings');
    }

    // Validate session management operations
    if (data.sessionOperation) {
      if (!['save', 'load', 'list', 'delete', 'export'].includes(data.sessionOperation as string)) {
        throw new Error(
          'Invalid sessionOperation: must be one of save, load, list, delete, export'
        );
      }

      // For regular operations, technique and problem are not required
      if (data.sessionOperation !== 'save') {
        // Override the required field checks for session operations
        data.technique = data.technique || 'six_hats'; // dummy value
        data.problem = data.problem || 'session operation'; // dummy value
        data.currentStep = data.currentStep || 1; // dummy value
        data.totalSteps = data.totalSteps || 1; // dummy value
        data.output = data.output || ''; // dummy value
        data.nextStepNeeded = data.nextStepNeeded ?? false; // dummy value
      }

      // Validate operation-specific options
      if (
        data.sessionOperation === 'load' &&
        !(data.loadOptions as Record<string, unknown>)?.sessionId
      ) {
        throw new Error('sessionId is required in loadOptions for load operation');
      }
      if (
        data.sessionOperation === 'delete' &&
        !(data.deleteOptions as Record<string, unknown>)?.sessionId
      ) {
        throw new Error('sessionId is required in deleteOptions for delete operation');
      }
      if (data.sessionOperation === 'export') {
        if (!(data.exportOptions as Record<string, unknown>)?.sessionId) {
          throw new Error('sessionId is required in exportOptions for export operation');
        }
        if (!(data.exportOptions as Record<string, unknown>)?.format) {
          throw new Error('format is required in exportOptions for export operation');
        }
      }
    }

    return {
      sessionId: data.sessionId as string | undefined,
      technique: data.technique as LateralTechnique,
      problem: data.problem as string,
      currentStep: data.currentStep as number,
      totalSteps: data.totalSteps as number,
      output: data.output as string,
      nextStepNeeded: data.nextStepNeeded as boolean,
      hatColor: data.hatColor as SixHatsColor | undefined,
      provocation: data.provocation as string | undefined,
      principles: data.principles as string[] | undefined,
      randomStimulus: data.randomStimulus as string | undefined,
      connections: data.connections as string[] | undefined,
      scamperAction: data.scamperAction as ScamperAction | undefined,
      successExample: data.successExample as string | undefined,
      extractedConcepts: data.extractedConcepts as string[] | undefined,
      abstractedPatterns: data.abstractedPatterns as string[] | undefined,
      applications: data.applications as string[] | undefined,
      initialIdea: data.initialIdea as string | undefined,
      additions: data.additions as string[] | undefined,
      evaluations: data.evaluations as string[] | undefined,
      synthesis: data.synthesis as string | undefined,
      designStage: data.designStage as DesignThinkingStage | undefined,
      empathyInsights: data.empathyInsights as string[] | undefined,
      problemStatement: data.problemStatement as string | undefined,
      failureModesPredicted: data.failureModesPredicted as string[] | undefined,
      ideaList: data.ideaList as string[] | undefined,
      prototypeDescription: data.prototypeDescription as string | undefined,
      stressTestResults: data.stressTestResults as string[] | undefined,
      userFeedback: data.userFeedback as string[] | undefined,
      failureInsights: data.failureInsights as string[] | undefined,
      contradiction: data.contradiction as string | undefined,
      inventivePrinciples: data.inventivePrinciples as string[] | undefined,
      viaNegativaRemovals: data.viaNegativaRemovals as string[] | undefined,
      minimalSolution: data.minimalSolution as string | undefined,
      risks: data.risks as string[] | undefined,
      failureModes: data.failureModes as string[] | undefined,
      mitigations: data.mitigations as string[] | undefined,
      antifragileProperties: data.antifragileProperties as string[] | undefined,
      blackSwans: data.blackSwans as string[] | undefined,
      isRevision: data.isRevision as boolean | undefined,
      revisesStep: data.revisesStep as number | undefined,
      branchFromStep: data.branchFromStep as number | undefined,
      branchId: data.branchId as string | undefined,
      sessionOperation: data.sessionOperation as
        | 'save'
        | 'load'
        | 'list'
        | 'delete'
        | 'export'
        | undefined,
      saveOptions: data.saveOptions as
        | { sessionName?: string; tags?: string[]; asTemplate?: boolean }
        | undefined,
      loadOptions: data.loadOptions as { sessionId: string; continueFrom?: number } | undefined,
      listOptions: data.listOptions as
        | {
            limit?: number;
            technique?: LateralTechnique;
            status?: 'active' | 'completed' | 'all';
            tags?: string[];
            searchTerm?: string;
          }
        | undefined,
      deleteOptions: data.deleteOptions as { sessionId: string; confirm?: boolean } | undefined,
      exportOptions: data.exportOptions as
        | { sessionId: string; format: 'json' | 'markdown' | 'csv'; outputPath?: string }
        | undefined,
      autoSave: data.autoSave as boolean | undefined,
    };
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
    };
    return criticalSteps[technique] || [];
  }

  /**
   * Determine whether current step is in creative or critical mode
   * @param data - The lateral thinking data with current step info
   * @returns Color and symbol for visual mode indication
   */
  private getModeIndicator(data: LateralThinkingData): { color: typeof chalk; symbol: string } {
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
  private calculatePathImpact(data: LateralThinkingData): {
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

  private formatOutput(data: LateralThinkingData): string {
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
        throw new Error('Failed to generate unique session ID after 10 attempts');
      }
    } while (this.sessions.has(sessionId));

    const ergodicityManager = new ErgodicityManager();

    this.sessions.set(sessionId, {
      technique,
      problem,
      history: [],
      branches: {},
      insights: [],
      ergodicityManager,
      startTime: Date.now(),
      metrics: {
        creativityScore: 0,
        risksCaught: 0,
        antifragileFeatures: 0,
      },
    });
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
    }

    return insights;
  }

  public async processLateralThinking(
    input: unknown
  ): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    try {
      const validatedInput = this.validateInput(input);

      // Handle session operations first
      if (validatedInput.sessionOperation) {
        return await this.handleSessionOperation(validatedInput);
      }

      let sessionId: string;
      let session: SessionData | undefined;

      // Handle session initialization or continuation
      if (validatedInput.sessionId) {
        // Continue existing session
        sessionId = validatedInput.sessionId;
        session = this.sessions.get(sessionId);
        if (!session) {
          throw new Error(`Session ${sessionId} not found. It may have expired.`);
        }
      } else {
        // Create new session (even if not step 1, for testing purposes)
        sessionId = this.initializeSession(validatedInput.technique, validatedInput.problem);
        if (!validatedInput.totalSteps) {
          validatedInput.totalSteps = this.getTechniqueSteps(validatedInput.technique);
        }
        session = this.sessions.get(sessionId);
      }

      if (!session) {
        throw new Error('Failed to get or create session.');
      }

      // Add to history with proper timestamp
      const historyEntry = {
        ...validatedInput,
        timestamp: new Date().toISOString(),
      };
      session.history.push(historyEntry);

      // Track path dependencies if ergodicity manager exists
      if (session.ergodicityManager) {
        const pathImpact = this.calculatePathImpact(validatedInput);
        const sessionData: SessionData = {
          history: session.history,
          insights: session.insights,
          metrics: session.metrics,
          technique: validatedInput.technique,
          problem: validatedInput.problem,
          branches: session.branches,
          startTime: session.history[0]?.timestamp
            ? new Date(session.history[0].timestamp).getTime()
            : Date.now(),
        };

        const { warnings, earlyWarningState, escapeRecommendation } =
          await session.ergodicityManager.recordThinkingStep(
            validatedInput.technique,
            validatedInput.currentStep,
            validatedInput.output,
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
        if (validatedInput.risks && validatedInput.risks.length > 0) {
          session.metrics.risksCaught =
            (session.metrics.risksCaught || 0) + validatedInput.risks.length;
        }
        // Count antifragile properties
        if (
          validatedInput.antifragileProperties &&
          validatedInput.antifragileProperties.length > 0
        ) {
          session.metrics.antifragileFeatures =
            (session.metrics.antifragileFeatures || 0) +
            validatedInput.antifragileProperties.length;
        }
        // Simple creativity score based on output length and variety
        session.metrics.creativityScore =
          (session.metrics.creativityScore || 0) + Math.min(validatedInput.output.length / 100, 5);
      }

      // Handle branches
      if (validatedInput.branchFromStep && validatedInput.branchId) {
        if (!session.branches[validatedInput.branchId]) {
          session.branches[validatedInput.branchId] = [];
        }
        session.branches[validatedInput.branchId].push(validatedInput);
      }

      // Log formatted output
      if (!this.disableThoughtLogging) {
        const formattedOutput = this.formatOutput({ ...validatedInput, sessionId });
        console.error(formattedOutput);
      }

      // Generate response
      const response: LateralThinkingResponse = {
        sessionId: sessionId,
        technique: validatedInput.technique,
        currentStep: validatedInput.currentStep,
        totalSteps: validatedInput.totalSteps,
        nextStepNeeded: validatedInput.nextStepNeeded,
        historyLength: session.history.length,
        branches: Object.keys(session.branches),
      };

      // Add completion summary if done
      if (!validatedInput.nextStepNeeded) {
        session.endTime = Date.now();
        response.completed = true;
        response.insights = this.extractInsights(session);
        response.summary = `Lateral thinking session completed using ${validatedInput.technique} technique`;

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
      if (validatedInput.nextStepNeeded) {
        response.nextStepGuidance = this.getNextStepGuidance(validatedInput);
      }

      // Auto-save if enabled
      if (validatedInput.autoSave && this.persistenceAdapter && session) {
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
      return Promise.resolve({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: error instanceof Error ? error.message : String(error),
                status: 'failed',
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      });
    }
  }

  private getNextStepGuidance(data: LateralThinkingData): string {
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
    }

    return 'Continue with the next step';
  }

  // Discovery Layer: Analyze problem and recommend techniques
  public discoverTechniques(
    input: unknown
  ): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    try {
      // Validate input
      const args = input as DiscoverTechniquesInput;
      if (!args.problem) {
        throw new Error('Problem description is required');
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
      return Promise.resolve({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: error instanceof Error ? error.message : String(error),
                status: 'failed',
              },
              null,
              2
            ),
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
        throw new Error('Problem and at least one technique are required');
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
      return Promise.resolve({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: error instanceof Error ? error.message : String(error),
                status: 'failed',
              },
              null,
              2
            ),
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

    // Convert to LateralThinkingData and continue with existing logic
    const lateralInput: LateralThinkingData = {
      ...execInput,
      // Associate with plan for tracking
    };

    // Delegate to existing processLateralThinking
    return this.processLateralThinking(lateralInput);
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
