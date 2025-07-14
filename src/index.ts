#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import chalk from 'chalk';
import { randomUUID } from 'crypto';
import { 
  PersistenceAdapter, 
  createAdapter, 
  getDefaultConfig,
  SessionState as PersistenceSessionState,
  SessionMetadata,
  ExportFormat
} from './persistence/index.js';

export type LateralTechnique = 'six_hats' | 'po' | 'random_entry' | 'scamper' | 'concept_extraction' | 'yes_and';
export type SixHatsColor = 'blue' | 'white' | 'red' | 'yellow' | 'black' | 'green';
export type ScamperAction = 'substitute' | 'combine' | 'adapt' | 'modify' | 'put_to_other_use' | 'eliminate' | 'reverse';

interface LateralThinkingData {
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

interface SessionData {
  technique: LateralTechnique;
  problem: string;
  history: LateralThinkingData[];
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
}

class LateralThinkingServer {
  private sessions: Map<string, SessionData> = new Map();
  private currentSessionId: string | null = null;
  private disableThoughtLogging: boolean;
  private readonly SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private cleanupInterval: NodeJS.Timeout | null = null;
  private persistenceAdapter: PersistenceAdapter | null = null;

  constructor() {
    this.disableThoughtLogging = (process.env.DISABLE_THOUGHT_LOGGING || "").toLowerCase() === "true";
    this.startSessionCleanup();
    this.initializePersistence();
  }

  private async initializePersistence(): Promise<void> {
    try {
      const persistenceType = (process.env.PERSISTENCE_TYPE || 'filesystem') as 'filesystem' | 'memory';
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
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldSessions();
    }, 60 * 60 * 1000);
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
  private async handleSessionOperation(input: LateralThinkingData): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    if (!this.persistenceAdapter) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: "Persistence not available",
            status: 'failed'
          }, null, 2)
        }],
        isError: true
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
          content: [{
            type: "text",
            text: JSON.stringify({
              error: `Unknown session operation: ${input.sessionOperation}`,
              status: 'failed'
            }, null, 2)
          }],
          isError: true
        };
    }
  }

  /**
   * Save current session
   */
  private async handleSaveOperation(input: LateralThinkingData): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      if (!this.currentSessionId || !this.sessions.has(this.currentSessionId)) {
        throw new Error('No active session to save');
      }

      const session = this.sessions.get(this.currentSessionId)!;
      
      // Update session with save options
      if (input.saveOptions?.sessionName) {
        session.name = input.saveOptions.sessionName;
      }
      if (input.saveOptions?.tags) {
        session.tags = input.saveOptions.tags;
      }

      await this.saveSessionToPersistence(this.currentSessionId, session);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            sessionId: this.currentSessionId,
            message: 'Session saved successfully',
            savedAt: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            status: 'failed'
          }, null, 2)
        }]
      };
    }
  }

  /**
   * Load a saved session
   */
  private async handleLoadOperation(input: LateralThinkingData): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      if (!input.loadOptions?.sessionId) {
        throw new Error('Session ID required for load operation');
      }

      const loadedState = await this.persistenceAdapter!.load(input.loadOptions.sessionId);
      if (!loadedState) {
        throw new Error('Session not found');
      }

      // Convert persistence state to session data
      const session: SessionData = {
        technique: loadedState.technique,
        problem: loadedState.problem,
        history: loadedState.history.map((h: any) => h.input),
        branches: loadedState.branches,
        insights: loadedState.insights,
        startTime: loadedState.startTime,
        endTime: loadedState.endTime,
        metrics: loadedState.metrics,
        tags: loadedState.tags,
        name: loadedState.name
      };

      // Load into memory
      this.sessions.set(loadedState.id, session);
      this.currentSessionId = loadedState.id;

      const continueFrom = input.loadOptions.continueFrom || session.history.length;

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            sessionId: loadedState.id,
            technique: session.technique,
            problem: session.problem,
            currentStep: continueFrom,
            totalSteps: session.history[0]?.totalSteps || this.getTechniqueSteps(session.technique),
            message: 'Session loaded successfully',
            continueFrom
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            status: 'failed'
          }, null, 2)
        }]
      };
    }
  }

  /**
   * List saved sessions
   */
  private async handleListOperation(input: LateralThinkingData): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      const options = input.listOptions || {};
      const metadata = await this.persistenceAdapter!.list(options);

      // Format visual output
      const visualOutput = this.formatSessionList(metadata);

      return {
        content: [{
          type: "text",
          text: visualOutput
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            status: 'failed'
          }, null, 2)
        }]
      };
    }
  }

  /**
   * Delete a saved session
   */
  private async handleDeleteOperation(input: LateralThinkingData): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      if (!input.deleteOptions?.sessionId) {
        throw new Error('Session ID required for delete operation');
      }

      const deleted = await this.persistenceAdapter!.delete(input.deleteOptions.sessionId);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: deleted,
            sessionId: input.deleteOptions.sessionId,
            message: deleted ? 'Session deleted successfully' : 'Session not found'
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            status: 'failed'
          }, null, 2)
        }]
      };
    }
  }

  /**
   * Export a session
   */
  private async handleExportOperation(input: LateralThinkingData): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      if (!input.exportOptions?.sessionId || !input.exportOptions?.format) {
        throw new Error('Session ID and format required for export operation');
      }

      const data = await this.persistenceAdapter!.export(
        input.exportOptions.sessionId,
        input.exportOptions.format as ExportFormat
      );

      return {
        content: [{
          type: "text",
          text: data.toString()
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            status: 'failed'
          }, null, 2)
        }]
      };
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
        timestamp: new Date().toISOString(),
        input: item,
        output: item
      })),
      branches: session.branches,
      insights: session.insights,
      startTime: session.startTime,
      endTime: session.endTime,
      metrics: session.metrics,
      tags: session.tags,
      name: session.name
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
      ''
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
      lines.push(`   Progress: ${progress} ${session.stepsCompleted}/${session.totalSteps} steps ${status}`);
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
      yes_and: '🤝'
    };
    return emojis[technique] || '🧠';
  }

  /**
   * Format progress bar
   */
  private formatProgress(completed: number, total: number): string {
    const percentage = Math.round((completed / total) * 100);
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
  private getSixHatsInfo(color: SixHatsColor): { name: string; focus: string; emoji: string; enhancedFocus?: string } {
    const hatsInfo = {
      blue: { 
        name: 'Blue Hat Plus', 
        focus: 'Process control and overview', 
        emoji: '🔵',
        enhancedFocus: 'Process control with meta-uncertainty awareness'
      },
      white: { 
        name: 'White Hat Plus', 
        focus: 'Facts and information', 
        emoji: '⚪',
        enhancedFocus: 'Facts and information including unknown unknowns'
      },
      red: { 
        name: 'Red Hat Plus', 
        focus: 'Emotions and intuition', 
        emoji: '🔴',
        enhancedFocus: 'Emotions, intuition, and collective behavior prediction'
      },
      yellow: { 
        name: 'Yellow Hat Plus', 
        focus: 'Optimism and benefits', 
        emoji: '🟡',
        enhancedFocus: 'Optimism, benefits, and positive black swans'
      },
      black: { 
        name: 'Black Hat Plus', 
        focus: 'Critical judgment and caution', 
        emoji: '⚫',
        enhancedFocus: 'Critical judgment and catastrophic discontinuities'
      },
      green: { 
        name: 'Green Hat Plus', 
        focus: 'Creativity and alternatives', 
        emoji: '🟢',
        enhancedFocus: 'Creativity and antifragile innovations'
      }
    };
    return hatsInfo[color];
  }

  /**
   * Get SCAMPER action information with pre-mortem risk questions
   * @param action - The SCAMPER action to get information for
   * @returns Action information with description, emoji, and risk question
   */
  private getScamperInfo(action: ScamperAction): { description: string; emoji: string; riskQuestion?: string } {
    const scamperInfo = {
      substitute: { 
        description: 'Replace parts with alternatives', 
        emoji: '🔄',
        riskQuestion: 'What could go wrong with this substitution?'
      },
      combine: { 
        description: 'Merge with other ideas or functions', 
        emoji: '🔗',
        riskQuestion: 'What conflicts might arise from combining?'
      },
      adapt: { 
        description: 'Adjust for different contexts', 
        emoji: '🔧',
        riskQuestion: 'What assumptions might fail in new contexts?'
      },
      modify: { 
        description: 'Magnify, minimize, or modify attributes', 
        emoji: '🔍',
        riskQuestion: 'What breaks when scaled up or down?'
      },
      put_to_other_use: { 
        description: 'Find new applications', 
        emoji: '🎯',
        riskQuestion: 'What unintended uses could be harmful?'
      },
      eliminate: { 
        description: 'Remove unnecessary elements', 
        emoji: '✂️',
        riskQuestion: 'What dependencies might we be overlooking?'
      },
      reverse: { 
        description: 'Invert or rearrange components', 
        emoji: '🔃',
        riskQuestion: 'What assumptions break when reversed?'
      }
    };
    return scamperInfo[action];
  }

  private validateInput(input: unknown): LateralThinkingData {
    const data = input as Record<string, unknown>;

    if (!data.technique || !['six_hats', 'po', 'random_entry', 'scamper', 'concept_extraction', 'yes_and'].includes(data.technique as string)) {
      throw new Error('Invalid technique: must be one of six_hats, po, random_entry, scamper, concept_extraction, or yes_and');
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
    
    if (technique === 'six_hats' && data.hatColor && 
        !['blue', 'white', 'red', 'yellow', 'black', 'green'].includes(data.hatColor as string)) {
      throw new Error('Invalid hatColor for six_hats technique');
    }
    
    if (technique === 'scamper' && data.scamperAction && 
        !['substitute', 'combine', 'adapt', 'modify', 'put_to_other_use', 'eliminate', 'reverse'].includes(data.scamperAction as string)) {
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
    if (data.failureModes && (!Array.isArray(data.failureModes) || data.failureModes.some(f => typeof f !== 'string'))) {
      throw new Error('failureModes must be an array of strings');
    }
    if (data.mitigations && (!Array.isArray(data.mitigations) || data.mitigations.some(m => typeof m !== 'string'))) {
      throw new Error('mitigations must be an array of strings');
    }
    if (data.antifragileProperties && (!Array.isArray(data.antifragileProperties) || data.antifragileProperties.some(a => typeof a !== 'string'))) {
      throw new Error('antifragileProperties must be an array of strings');
    }
    if (data.blackSwans && (!Array.isArray(data.blackSwans) || data.blackSwans.some(b => typeof b !== 'string'))) {
      throw new Error('blackSwans must be an array of strings');
    }

    // Validate session management operations
    if (data.sessionOperation) {
      if (!['save', 'load', 'list', 'delete', 'export'].includes(data.sessionOperation as string)) {
        throw new Error('Invalid sessionOperation: must be one of save, load, list, delete, export');
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
      if (data.sessionOperation === 'load' && !(data.loadOptions as any)?.sessionId) {
        throw new Error('sessionId is required in loadOptions for load operation');
      }
      if (data.sessionOperation === 'delete' && !(data.deleteOptions as any)?.sessionId) {
        throw new Error('sessionId is required in deleteOptions for delete operation');
      }
      if (data.sessionOperation === 'export') {
        if (!(data.exportOptions as any)?.sessionId) {
          throw new Error('sessionId is required in exportOptions for export operation');
        }
        if (!(data.exportOptions as any)?.format) {
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
      risks: data.risks as string[] | undefined,
      failureModes: data.failureModes as string[] | undefined,
      mitigations: data.mitigations as string[] | undefined,
      antifragileProperties: data.antifragileProperties as string[] | undefined,
      blackSwans: data.blackSwans as string[] | undefined,
      isRevision: data.isRevision as boolean | undefined,
      revisesStep: data.revisesStep as number | undefined,
      branchFromStep: data.branchFromStep as number | undefined,
      branchId: data.branchId as string | undefined,
      sessionOperation: data.sessionOperation as 'save' | 'load' | 'list' | 'delete' | 'export' | undefined,
      saveOptions: data.saveOptions as { sessionName?: string; tags?: string[]; asTemplate?: boolean } | undefined,
      loadOptions: data.loadOptions as { sessionId: string; continueFrom?: number } | undefined,
      listOptions: data.listOptions as { limit?: number; technique?: LateralTechnique; status?: 'active' | 'completed' | 'all'; tags?: string[]; searchTerm?: string } | undefined,
      deleteOptions: data.deleteOptions as { sessionId: string; confirm?: boolean } | undefined,
      exportOptions: data.exportOptions as { sessionId: string; format: 'json' | 'markdown' | 'csv'; outputPath?: string } | undefined,
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
      scamper: [] // Risk questions integrated into each action
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
      symbol: isCritical ? '⚠️ ' : '✨ '
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
  private formatMitigationSection(mitigations: string[], maxLength: number, hasRisks: boolean): string[] {
    const parts: string[] = [];
    const border = '─'.repeat(maxLength);
    
    if (!hasRisks) parts.push(`├${border}┤`);
    parts.push(`│ ${chalk.green('✓ Mitigations:'.padEnd(maxLength - 2))} │`);
    mitigations.forEach(mitigation => {
      parts.push(`│ ${chalk.green(`• ${mitigation}`.padEnd(maxLength - 2))} │`);
    });
    
    return parts;
  }

  private formatOutput(data: LateralThinkingData): string {
    const { technique, currentStep, totalSteps, output, hatColor, scamperAction, randomStimulus, provocation, successExample, initialIdea } = data;
    
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
      case 'concept_extraction':
        emoji = '🔍';
        const stepNames = [
          'Identify Success', 
          'Extract & Analyze Limitations', 
          'Abstract with Boundaries', 
          'Apply with Risk Assessment'
        ];
        techniqueInfo = stepNames[currentStep - 1];
        if (successExample && currentStep === 1) {
          techniqueInfo += `: ${successExample}`;
        }
        break;
      case 'yes_and':
        emoji = '🤝';
        const yesAndSteps = ['Accept (Yes)', 'Build (And)', 'Evaluate (But)', 'Integrate'];
        techniqueInfo = yesAndSteps[currentStep - 1];
        if (initialIdea && currentStep === 1) {
          techniqueInfo += `: ${initialIdea}`;
        }
        break;
    }

    if (data.isRevision) {
      header = chalk.yellow(`🔄 Revision of Step ${data.revisesStep}`);
    } else if (data.branchFromStep) {
      header = chalk.green(`🌿 Branch from Step ${data.branchFromStep} (ID: ${data.branchId})`);
    } else {
      header = chalk.blue(`${emoji} ${technique.replace('_', ' ').toUpperCase()} - Step ${currentStep}/${totalSteps} ${mode.symbol}`);
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
    
    parts.push(`└${border}┘`);
    
    return parts.join('\n');
  }

  private initializeSession(technique: LateralTechnique, problem: string): string {
    const sessionId = `session_${randomUUID()}`;
    this.sessions.set(sessionId, {
      technique,
      problem,
      history: [],
      branches: {},
      insights: [],
      startTime: Date.now(),
      metrics: {
        creativityScore: 0,
        risksCaught: 0,
        antifragileFeatures: 0
      }
    });
    return sessionId;
  }

  private getTechniqueSteps(technique: LateralTechnique): number {
    switch (technique) {
      case 'six_hats': return 6;
      case 'po': return 4; // Create provocation, verify provocation, extract & test principles, develop robust solutions
      case 'random_entry': return 3; // Random stimulus, generate connections, develop solutions
      case 'scamper': return 7;
      case 'concept_extraction': return 4; // Identify success, extract concepts, abstract patterns, apply to problem
      case 'yes_and': return 4; // Accept (Yes), Build (And), Evaluate (But), Integrate
      default: return 5;
    }
  }

  private extractInsights(session: SessionData): string[] {
    const insights: string[] = [];
    
    // Extract technique-specific insights
    switch (session.technique) {
      case 'six_hats':
        insights.push('Comprehensive analysis from multiple perspectives completed');
        break;
      case 'po':
        const principles = session.history.filter(h => h.principles).flatMap(h => h.principles || []);
        if (principles.length > 0) {
          insights.push(`Extracted principles: ${principles.join(', ')}`);
        }
        break;
      case 'random_entry':
        const connections = session.history.filter(h => h.connections).flatMap(h => h.connections || []);
        if (connections.length > 0) {
          insights.push(`Creative connections discovered: ${connections.length}`);
        }
        break;
      case 'scamper':
        insights.push('Systematic transformation completed across all dimensions');
        break;
      case 'concept_extraction':
        const concepts = session.history.filter(h => h.extractedConcepts).flatMap(h => h.extractedConcepts || []);
        const patterns = session.history.filter(h => h.abstractedPatterns).flatMap(h => h.abstractedPatterns || []);
        const applications = session.history.filter(h => h.applications).flatMap(h => h.applications || []);
        
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
      case 'yes_and':
        const additions = session.history.filter(h => h.additions).flatMap(h => h.additions || []);
        const evaluations = session.history.filter(h => h.evaluations).flatMap(h => h.evaluations || []);
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
    
    return insights;
  }

  public async processLateralThinking(input: unknown): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    try {
      const validatedInput = this.validateInput(input);
      
      // Handle session operations first
      if (validatedInput.sessionOperation) {
        return await this.handleSessionOperation(validatedInput);
      }
      
      let sessionId: string;
      let session: SessionData | undefined;
      
      // Handle session initialization or continuation
      if (validatedInput.currentStep === 1 && !validatedInput.isRevision && !validatedInput.sessionId) {
        // Create new session
        sessionId = this.initializeSession(validatedInput.technique, validatedInput.problem);
        validatedInput.totalSteps = this.getTechniqueSteps(validatedInput.technique);
        session = this.sessions.get(sessionId);
      } else if (validatedInput.sessionId) {
        // Continue existing session
        sessionId = validatedInput.sessionId;
        session = this.sessions.get(sessionId);
        if (!session) {
          throw new Error(`Session ${sessionId} not found. It may have expired.`);
        }
      } else {
        throw new Error('No session ID provided for continuing session. Include sessionId from previous response.');
      }
      
      if (!session) {
        throw new Error('Failed to get or create session.');
      }
      
      // Add to history
      session.history.push(validatedInput);
      
      // Update metrics
      if (session.metrics) {
        // Count risks identified
        if (validatedInput.risks && validatedInput.risks.length > 0) {
          session.metrics.risksCaught = (session.metrics.risksCaught || 0) + validatedInput.risks.length;
        }
        // Count antifragile properties
        if (validatedInput.antifragileProperties && validatedInput.antifragileProperties.length > 0) {
          session.metrics.antifragileFeatures = (session.metrics.antifragileFeatures || 0) + validatedInput.antifragileProperties.length;
        }
        // Simple creativity score based on output length and variety
        session.metrics.creativityScore = (session.metrics.creativityScore || 0) + Math.min(validatedInput.output.length / 100, 5);
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
        const formattedOutput = this.formatOutput(validatedInput);
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
        branches: Object.keys(session.branches)
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
            antifragileFeatures: session.metrics.antifragileFeatures
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
        }
      }
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(response, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            status: 'failed'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
  
  private getNextStepGuidance(data: LateralThinkingData): string {
    const nextStep = data.currentStep + 1;
    
    switch (data.technique) {
      case 'six_hats':
        const hatOrder: SixHatsColor[] = ['blue', 'white', 'red', 'yellow', 'black', 'green'];
        if (nextStep <= 6) {
          const nextHat = hatOrder[nextStep - 1];
          const hatInfo = this.getSixHatsInfo(nextHat);
          return `Next: ${hatInfo.name} - Focus on ${hatInfo.enhancedFocus || hatInfo.focus}`;
        }
        break;
        
      case 'po':
        const poSteps = [
          'Create a provocative statement (Po:)',
          'Suspend judgment and explore the provocation (then challenge it)',
          'Extract and verify principles through hypothesis testing',
          'Develop robust solutions addressing failure modes'
        ];
        return poSteps[nextStep - 1] || 'Complete the process';
        
      case 'random_entry':
        const randomSteps = [
          'Introduce a random stimulus word/concept',
          'Generate connections with systematic doubt ("Is this always true?")',
          'Validate insights before developing solutions'
        ];
        return randomSteps[nextStep - 1] || 'Complete the process';
        
      case 'scamper':
        const scamperOrder: ScamperAction[] = [
          'substitute', 'combine', 'adapt', 'modify', 
          'put_to_other_use', 'eliminate', 'reverse'
        ];
        if (nextStep <= 7) {
          const nextAction = scamperOrder[nextStep - 1];
          const actionInfo = this.getScamperInfo(nextAction);
          return `Next: ${nextAction.toUpperCase()} - ${actionInfo.description}`;
        }
        break;
        
      case 'concept_extraction':
        const conceptSteps = [
          'Identify a successful solution/example from any domain',
          'Extract key concepts and analyze where they wouldn\'t work',
          'Abstract patterns with domain boundary identification',
          'Apply patterns only where success probability is high'
        ];
        return conceptSteps[nextStep - 1] || 'Complete the process';
        
      case 'yes_and':
        const yesAndSteps = [
          'Accept the initial idea or contribution (Yes)',
          'Build upon it with creative additions (And)',
          'Critically evaluate potential issues (But)',
          'Integrate insights into a robust solution'
        ];
        return yesAndSteps[nextStep - 1] || 'Complete the process';
    }
    
    return 'Continue with the next step';
  }
}

const LATERAL_THINKING_TOOL: Tool = {
  name: "lateralthinking",
  description: `A unified creative-adversarial thinking tool that combines generative techniques with systematic verification.
This enhanced framework integrates creative problem-solving with critical analysis and risk assessment.

Enhanced Techniques (with Unified Framework):

1. **six_hats**: Six Thinking Hats Plus with Black Swan Awareness
   - Blue Hat Plus: Process control with meta-uncertainty awareness
   - White Hat Plus: Facts including unknown unknowns consideration
   - Red Hat Plus: Emotions with collective behavior prediction
   - Yellow Hat Plus: Optimism seeking positive black swans
   - Black Hat Plus: Critical judgment of catastrophic discontinuities
   - Green Hat Plus: Creativity focused on antifragile innovations

2. **po**: Provocative Operation with Systematic Verification
   - Create provocative statements
   - Challenge assumptions after exploration
   - Test principles through hypothesis verification
   - Develop robust solutions addressing failure modes

3. **random_entry**: Random Stimulus with Systematic Doubt
   - Introduce random elements
   - Generate connections with Cartesian doubt ("Is this always true?")
   - Validate insights before solution development

4. **scamper**: Transformations with Pre-Mortem Analysis
   - Each action includes "What could go wrong?" assessment
   - Risk mitigation built into solutions
   - Stress-testing for each transformation

5. **concept_extraction**: Pattern Transfer with Failure Mode Analysis
   - Identify successful examples
   - Extract concepts and analyze where they wouldn't work
   - Define domain boundaries for patterns
   - Apply only where success probability is high

6. **yes_and**: Collaborative Ideation with Critical Evaluation
   - Accept initial ideas (Yes)
   - Build creatively (And)
   - Evaluate risks and issues (But)
   - Integrate into robust solutions

Key Features:
- Dual creative/critical thinking modes
- Risk and failure mode identification
- Antifragile solution design
- Black swan consideration
- Visual indicators for generative vs adversarial modes
- Meta-learning metrics tracking

When to use:
- Complex problems requiring both innovation and risk assessment
- Situations with high uncertainty or potential failure costs
- When robust, stress-tested solutions are needed
- Breaking mental models while maintaining critical thinking`,
  inputSchema: {
    type: "object",
    properties: {
      sessionId: {
        type: "string",
        description: "Session ID from previous response (required for steps 2+)"
      },
      technique: {
        type: "string",
        enum: ["six_hats", "po", "random_entry", "scamper", "concept_extraction", "yes_and"],
        description: "The lateral thinking technique to use"
      },
      problem: {
        type: "string",
        description: "The problem or challenge to address"
      },
      currentStep: {
        type: "integer",
        description: "Current step number in the technique",
        minimum: 1
      },
      totalSteps: {
        type: "integer",
        description: "Total steps for this technique",
        minimum: 1
      },
      output: {
        type: "string",
        description: "Your creative output for this step"
      },
      nextStepNeeded: {
        type: "boolean",
        description: "Whether another step is needed"
      },
      hatColor: {
        type: "string",
        enum: ["blue", "white", "red", "yellow", "black", "green"],
        description: "Current hat color (for six_hats technique)"
      },
      provocation: {
        type: "string",
        description: "The provocative statement (for po technique)"
      },
      principles: {
        type: "array",
        items: { type: "string" },
        description: "Extracted principles (for po technique)"
      },
      randomStimulus: {
        type: "string",
        description: "The random word/concept (for random_entry technique)"
      },
      connections: {
        type: "array",
        items: { type: "string" },
        description: "Generated connections (for random_entry technique)"
      },
      scamperAction: {
        type: "string",
        enum: ["substitute", "combine", "adapt", "modify", "put_to_other_use", "eliminate", "reverse"],
        description: "Current SCAMPER action"
      },
      successExample: {
        type: "string",
        description: "A successful solution/example to analyze (for concept_extraction technique)"
      },
      extractedConcepts: {
        type: "array",
        items: { type: "string" },
        description: "Key concepts extracted from the success example (for concept_extraction technique)"
      },
      abstractedPatterns: {
        type: "array",
        items: { type: "string" },
        description: "Abstracted patterns from the concepts (for concept_extraction technique)"
      },
      applications: {
        type: "array",
        items: { type: "string" },
        description: "Applications of patterns to the problem (for concept_extraction technique)"
      },
      initialIdea: {
        type: "string",
        description: "The initial idea or contribution to build upon (for yes_and technique)"
      },
      additions: {
        type: "array",
        items: { type: "string" },
        description: "Creative additions building on the idea (for yes_and technique)"
      },
      evaluations: {
        type: "array",
        items: { type: "string" },
        description: "Critical evaluations of potential issues (for yes_and technique)"
      },
      synthesis: {
        type: "string",
        description: "Final integrated solution combining insights (for yes_and technique)"
      },
      isRevision: {
        type: "boolean",
        description: "Whether this revises a previous step"
      },
      revisesStep: {
        type: "integer",
        description: "Which step is being revised",
        minimum: 1
      },
      branchFromStep: {
        type: "integer",
        description: "Step number to branch from",
        minimum: 1
      },
      branchId: {
        type: "string",
        description: "Identifier for the branch"
      },
      risks: {
        type: "array",
        items: { type: "string" },
        description: "Risks or potential issues identified (unified framework)"
      },
      failureModes: {
        type: "array",
        items: { type: "string" },
        description: "Ways this solution could fail (unified framework)"
      },
      mitigations: {
        type: "array",
        items: { type: "string" },
        description: "Strategies to address risks (unified framework)"
      },
      antifragileProperties: {
        type: "array",
        items: { type: "string" },
        description: "Ways the solution benefits from stress/change (unified framework)"
      },
      blackSwans: {
        type: "array",
        items: { type: "string" },
        description: "Low probability, high impact events to consider (unified framework)"
      },
      sessionOperation: {
        type: "string",
        enum: ["save", "load", "list", "delete", "export"],
        description: "Session management operation to perform"
      },
      saveOptions: {
        type: "object",
        properties: {
          sessionName: {
            type: "string",
            description: "Name for the saved session"
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Tags to categorize the session"
          },
          asTemplate: {
            type: "boolean",
            description: "Save as a template for reuse"
          }
        },
        description: "Options for save operation"
      },
      loadOptions: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "ID of the session to load"
          },
          continueFrom: {
            type: "integer",
            description: "Step to continue from",
            minimum: 1
          }
        },
        required: ["sessionId"],
        description: "Options for load operation"
      },
      listOptions: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            description: "Maximum number of sessions to return"
          },
          technique: {
            type: "string",
            enum: ["six_hats", "po", "random_entry", "scamper", "concept_extraction", "yes_and"],
            description: "Filter by technique"
          },
          status: {
            type: "string",
            enum: ["active", "completed", "all"],
            description: "Filter by session status"
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Filter by tags"
          },
          searchTerm: {
            type: "string",
            description: "Search in session content"
          }
        },
        description: "Options for list operation"
      },
      deleteOptions: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "ID of the session to delete"
          },
          confirm: {
            type: "boolean",
            description: "Confirmation flag"
          }
        },
        required: ["sessionId"],
        description: "Options for delete operation"
      },
      exportOptions: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "ID of the session to export"
          },
          format: {
            type: "string",
            enum: ["json", "markdown", "csv"],
            description: "Export format"
          },
          outputPath: {
            type: "string",
            description: "Optional output file path"
          }
        },
        required: ["sessionId", "format"],
        description: "Options for export operation"
      },
      autoSave: {
        type: "boolean",
        description: "Enable automatic session saving"
      }
    },
    required: ["technique", "problem", "currentStep", "totalSteps", "output", "nextStepNeeded"]
  }
};

const server = new Server(
  {
    name: "creative-thinking-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const lateralServer = new LateralThinkingServer();

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [LATERAL_THINKING_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "lateralthinking") {
    return lateralServer.processLateralThinking(request.params.arguments);
  }

  return {
    content: [{
      type: "text",
      text: `Unknown tool: ${request.params.name}`
    }],
    isError: true
  };
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Creative Thinking MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
