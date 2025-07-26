#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import chalk from 'chalk';
import { randomUUID } from 'crypto';
import { createAdapter, getDefaultConfig } from './persistence/index.js';
class LateralThinkingServer {
    sessions = new Map();
    currentSessionId = null;
    disableThoughtLogging;
    SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours
    cleanupInterval = null;
    persistenceAdapter = null;
    constructor() {
        this.disableThoughtLogging =
            (process.env.DISABLE_THOUGHT_LOGGING || '').toLowerCase() === 'true';
        this.startSessionCleanup();
        void this.initializePersistence();
    }
    async initializePersistence() {
        try {
            const persistenceType = (process.env.PERSISTENCE_TYPE || 'filesystem');
            const config = getDefaultConfig(persistenceType);
            // Override with environment variables if provided
            if (process.env.PERSISTENCE_PATH) {
                config.options.path = process.env.PERSISTENCE_PATH;
            }
            this.persistenceAdapter = await createAdapter(config);
        }
        catch (error) {
            console.error('Failed to initialize persistence:', error);
            // Continue without persistence
        }
    }
    startSessionCleanup() {
        // Run cleanup every hour
        this.cleanupInterval = setInterval(() => {
            this.cleanupOldSessions();
        }, 60 * 60 * 1000);
    }
    cleanupOldSessions() {
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
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.sessions.clear();
    }
    /**
     * Handle session management operations
     */
    async handleSessionOperation(input) {
        if (!this.persistenceAdapter) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            error: 'Persistence not available',
                            status: 'failed',
                        }, null, 2),
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
                            text: JSON.stringify({
                                error: `Unknown session operation: ${input.sessionOperation}`,
                                status: 'failed',
                            }, null, 2),
                        },
                    ],
                    isError: true,
                };
        }
    }
    /**
     * Save current session
     */
    async handleSaveOperation(input) {
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
                        text: JSON.stringify({
                            success: true,
                            sessionId: this.currentSessionId,
                            message: 'Session saved successfully',
                            savedAt: new Date().toISOString(),
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            error: error instanceof Error ? error.message : String(error),
                            status: 'failed',
                        }, null, 2),
                    },
                ],
            };
        }
    }
    /**
     * Load a saved session
     */
    async handleLoadOperation(input) {
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
            const session = {
                technique: loadedState.technique,
                problem: loadedState.problem,
                history: loadedState.history.map(h => ({
                    ...h.input,
                    timestamp: h.timestamp,
                    // Ensure technique-specific fields are typed correctly
                    hatColor: h.input.hatColor,
                    scamperAction: h.input.scamperAction,
                    designStage: h.input.designStage,
                })),
                branches: Object.entries(loadedState.branches).reduce((acc, [key, value]) => {
                    acc[key] = value;
                    return acc;
                }, {}),
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
                        text: JSON.stringify({
                            success: true,
                            sessionId: loadedState.id,
                            technique: session.technique,
                            problem: session.problem,
                            currentStep: continueFrom,
                            totalSteps: session.history[0]?.totalSteps || this.getTechniqueSteps(session.technique),
                            message: 'Session loaded successfully',
                            continueFrom,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            error: error instanceof Error ? error.message : String(error),
                            status: 'failed',
                        }, null, 2),
                    },
                ],
            };
        }
    }
    /**
     * List saved sessions
     */
    async handleListOperation(input) {
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
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            error: error instanceof Error ? error.message : String(error),
                            status: 'failed',
                        }, null, 2),
                    },
                ],
            };
        }
    }
    /**
     * Delete a saved session
     */
    async handleDeleteOperation(input) {
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
                        text: JSON.stringify({
                            success: deleted,
                            sessionId: input.deleteOptions.sessionId,
                            message: deleted ? 'Session deleted successfully' : 'Session not found',
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            error: error instanceof Error ? error.message : String(error),
                            status: 'failed',
                        }, null, 2),
                    },
                ],
            };
        }
    }
    /**
     * Export a session
     */
    async handleExportOperation(input) {
        try {
            if (!input.exportOptions?.sessionId || !input.exportOptions?.format) {
                throw new Error('Session ID and format required for export operation');
            }
            if (!this.persistenceAdapter) {
                throw new Error('Persistence adapter not initialized');
            }
            const data = await this.persistenceAdapter.export(input.exportOptions.sessionId, input.exportOptions.format);
            return {
                content: [
                    {
                        type: 'text',
                        text: data.toString(),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            error: error instanceof Error ? error.message : String(error),
                            status: 'failed',
                        }, null, 2),
                    },
                ],
            };
        }
    }
    /**
     * Save session to persistence adapter
     */
    async saveSessionToPersistence(sessionId, session) {
        if (!this.persistenceAdapter)
            return;
        const state = {
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
    formatSessionList(metadata) {
        const lines = [
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
    getTechniqueEmoji(technique) {
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
    formatProgress(completed, total) {
        const _percentage = Math.round((completed / total) * 100);
        const filled = Math.round((completed / total) * 10);
        const empty = 10 - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
    }
    /**
     * Format time ago
     */
    formatTimeAgo(date) {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (days > 0)
            return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0)
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0)
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'just now';
    }
    /**
     * Get enhanced Six Thinking Hats information including Black Swan awareness
     * @param color - The hat color to get information for
     * @returns Hat information with name, focus, emoji, and enhanced focus
     */
    getSixHatsInfo(color) {
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
        };
        return hatsInfo[color];
    }
    /**
     * Get SCAMPER action information with pre-mortem risk questions
     * @param action - The SCAMPER action to get information for
     * @returns Action information with description, emoji, and risk question
     */
    getScamperInfo(action) {
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
    getDesignThinkingInfo(stage) {
        const stageInfo = {
            empathize: {
                description: 'Understand user needs deeply',
                emoji: '💭',
                criticalLens: 'Threat Modeling',
                prompts: [
                    'What are the user\'s core needs and pain points?',
                    'How might this solution be misused or abused?',
                    'What are the extreme use cases we need to consider?'
                ],
            },
            define: {
                description: 'Frame the problem clearly',
                emoji: '🎯',
                criticalLens: 'Problem Inversion',
                prompts: [
                    'What is the core problem we\'re solving?',
                    'How might we fail to solve this problem?',
                    'What are the failure modes we must avoid?'
                ],
            },
            ideate: {
                description: 'Generate creative solutions',
                emoji: '💡',
                criticalLens: 'Devil\'s Advocate',
                prompts: [
                    'What are all possible solutions?',
                    'What could go wrong with each idea?',
                    'How can we rank ideas by innovation AND robustness?'
                ],
            },
            prototype: {
                description: 'Build quick tests',
                emoji: '🔨',
                criticalLens: 'Stress Testing',
                prompts: [
                    'What\'s the simplest way to test this idea?',
                    'What edge cases must our prototype handle?',
                    'How can we ensure it fails gracefully?'
                ],
            },
            test: {
                description: 'Learn from user feedback',
                emoji: '🧪',
                criticalLens: 'Failure Harvesting',
                prompts: [
                    'What do users think of our solution?',
                    'What failures or issues did we discover?',
                    'What insights can we extract from both successes and failures?'
                ],
            },
        };
        return stageInfo[stage];
    }
    validateInput(input) {
        const data = input;
        if (!data.technique ||
            !['six_hats', 'po', 'random_entry', 'scamper', 'concept_extraction', 'yes_and', 'design_thinking', 'triz'].includes(data.technique)) {
            throw new Error('Invalid technique: must be one of six_hats, po, random_entry, scamper, concept_extraction, yes_and, design_thinking, or triz');
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
        const technique = data.technique;
        if (technique === 'six_hats' &&
            data.hatColor &&
            !['blue', 'white', 'red', 'yellow', 'black', 'green'].includes(data.hatColor)) {
            throw new Error('Invalid hatColor for six_hats technique');
        }
        if (technique === 'scamper' &&
            data.scamperAction &&
            ![
                'substitute',
                'combine',
                'adapt',
                'modify',
                'put_to_other_use',
                'eliminate',
                'reverse',
            ].includes(data.scamperAction)) {
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
        if (data.failureModes &&
            (!Array.isArray(data.failureModes) || data.failureModes.some(f => typeof f !== 'string'))) {
            throw new Error('failureModes must be an array of strings');
        }
        if (data.mitigations &&
            (!Array.isArray(data.mitigations) || data.mitigations.some(m => typeof m !== 'string'))) {
            throw new Error('mitigations must be an array of strings');
        }
        if (data.antifragileProperties &&
            (!Array.isArray(data.antifragileProperties) ||
                data.antifragileProperties.some(a => typeof a !== 'string'))) {
            throw new Error('antifragileProperties must be an array of strings');
        }
        if (data.blackSwans &&
            (!Array.isArray(data.blackSwans) || data.blackSwans.some(b => typeof b !== 'string'))) {
            throw new Error('blackSwans must be an array of strings');
        }
        // Validate session management operations
        if (data.sessionOperation) {
            if (!['save', 'load', 'list', 'delete', 'export'].includes(data.sessionOperation)) {
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
            if (data.sessionOperation === 'load' &&
                !data.loadOptions?.sessionId) {
                throw new Error('sessionId is required in loadOptions for load operation');
            }
            if (data.sessionOperation === 'delete' &&
                !data.deleteOptions?.sessionId) {
                throw new Error('sessionId is required in deleteOptions for delete operation');
            }
            if (data.sessionOperation === 'export') {
                if (!data.exportOptions?.sessionId) {
                    throw new Error('sessionId is required in exportOptions for export operation');
                }
                if (!data.exportOptions?.format) {
                    throw new Error('format is required in exportOptions for export operation');
                }
            }
        }
        return {
            sessionId: data.sessionId,
            technique: data.technique,
            problem: data.problem,
            currentStep: data.currentStep,
            totalSteps: data.totalSteps,
            output: data.output,
            nextStepNeeded: data.nextStepNeeded,
            hatColor: data.hatColor,
            provocation: data.provocation,
            principles: data.principles,
            randomStimulus: data.randomStimulus,
            connections: data.connections,
            scamperAction: data.scamperAction,
            successExample: data.successExample,
            extractedConcepts: data.extractedConcepts,
            abstractedPatterns: data.abstractedPatterns,
            applications: data.applications,
            initialIdea: data.initialIdea,
            additions: data.additions,
            evaluations: data.evaluations,
            synthesis: data.synthesis,
            designStage: data.designStage,
            empathyInsights: data.empathyInsights,
            problemStatement: data.problemStatement,
            failureModesPredicted: data.failureModesPredicted,
            ideaList: data.ideaList,
            prototypeDescription: data.prototypeDescription,
            stressTestResults: data.stressTestResults,
            userFeedback: data.userFeedback,
            failureInsights: data.failureInsights,
            contradiction: data.contradiction,
            inventivePrinciples: data.inventivePrinciples,
            viaNegativaRemovals: data.viaNegativaRemovals,
            minimalSolution: data.minimalSolution,
            risks: data.risks,
            failureModes: data.failureModes,
            mitigations: data.mitigations,
            antifragileProperties: data.antifragileProperties,
            blackSwans: data.blackSwans,
            isRevision: data.isRevision,
            revisesStep: data.revisesStep,
            branchFromStep: data.branchFromStep,
            branchId: data.branchId,
            sessionOperation: data.sessionOperation,
            saveOptions: data.saveOptions,
            loadOptions: data.loadOptions,
            listOptions: data.listOptions,
            deleteOptions: data.deleteOptions,
            exportOptions: data.exportOptions,
            autoSave: data.autoSave,
        };
    }
    /**
     * Get critical thinking steps for a technique where adversarial mode is emphasized
     * @param technique - The lateral thinking technique
     * @returns Array of step numbers that are critical/adversarial
     */
    getCriticalSteps(technique) {
        const criticalSteps = {
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
    getModeIndicator(data) {
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
    truncateWord(word, maxLength) {
        if (word.length <= maxLength)
            return word;
        return word.substring(0, maxLength - 3) + '...';
    }
    /**
     * Format the risk identification section for visual output
     * @param risks - Array of identified risks
     * @param maxLength - Maximum line length for formatting
     * @returns Formatted lines for the risk section
     */
    formatRiskSection(risks, maxLength) {
        const parts = [];
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
    formatMitigationSection(mitigations, maxLength, hasRisks) {
        const parts = [];
        const border = '─'.repeat(maxLength);
        if (!hasRisks)
            parts.push(`├${border}┤`);
        parts.push(`│ ${chalk.green('✓ Mitigations:'.padEnd(maxLength - 2))} │`);
        mitigations.forEach(mitigation => {
            parts.push(`│ ${chalk.green(`• ${mitigation}`.padEnd(maxLength - 2))} │`);
        });
        return parts;
    }
    formatOutput(data) {
        const { technique, currentStep, totalSteps, output, hatColor, scamperAction, randomStimulus, provocation, successExample, initialIdea, } = data;
        const parts = [];
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
                const stages = ['empathize', 'define', 'ideate', 'prototype', 'test'];
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
                    'Minimal Solution'
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
        }
        else if (data.branchFromStep) {
            header = chalk.green(`🌿 Branch from Step ${data.branchFromStep} (ID: ${data.branchId})`);
        }
        else {
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
            }
            else {
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
    initializeSession(technique, problem) {
        let sessionId;
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
                antifragileFeatures: 0,
            },
        });
        return sessionId;
    }
    getTechniqueSteps(technique) {
        switch (technique) {
            case 'six_hats':
                return 6;
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
    extractInsights(session) {
        const insights = [];
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
                const ideas = session.history
                    .filter(h => h.ideaList)
                    .flatMap(h => h.ideaList || []);
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
    async processLateralThinking(input) {
        try {
            const validatedInput = this.validateInput(input);
            // Handle session operations first
            if (validatedInput.sessionOperation) {
                return await this.handleSessionOperation(validatedInput);
            }
            let sessionId;
            let session;
            // Handle session initialization or continuation
            if (validatedInput.currentStep === 1 &&
                !validatedInput.isRevision &&
                !validatedInput.sessionId) {
                // Create new session
                sessionId = this.initializeSession(validatedInput.technique, validatedInput.problem);
                validatedInput.totalSteps = this.getTechniqueSteps(validatedInput.technique);
                session = this.sessions.get(sessionId);
            }
            else if (validatedInput.sessionId) {
                // Continue existing session
                sessionId = validatedInput.sessionId;
                session = this.sessions.get(sessionId);
                if (!session) {
                    throw new Error(`Session ${sessionId} not found. It may have expired.`);
                }
            }
            else {
                throw new Error('No session ID provided for continuing session. Include sessionId from previous response.');
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
            // Update metrics
            if (session.metrics) {
                // Count risks identified
                if (validatedInput.risks && validatedInput.risks.length > 0) {
                    session.metrics.risksCaught =
                        (session.metrics.risksCaught || 0) + validatedInput.risks.length;
                }
                // Count antifragile properties
                if (validatedInput.antifragileProperties &&
                    validatedInput.antifragileProperties.length > 0) {
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
                const formattedOutput = this.formatOutput(validatedInput);
                console.error(formattedOutput);
            }
            // Generate response
            const response = {
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
                }
                catch (error) {
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
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            error: error instanceof Error ? error.message : String(error),
                            status: 'failed',
                        }, null, 2),
                    },
                ],
                isError: true,
            };
        }
    }
    getNextStepGuidance(data) {
        const nextStep = data.currentStep + 1;
        switch (data.technique) {
            case 'six_hats': {
                const hatOrder = ['blue', 'white', 'red', 'yellow', 'black', 'green'];
                if (nextStep <= 6) {
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
                const scamperOrder = [
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
                const stages = ['empathize', 'define', 'ideate', 'prototype', 'test'];
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
                    'Synthesize a minimal solution that does more with less'
                ];
                return trizSteps[nextStep - 1] || 'Complete the process';
            }
        }
        return 'Continue with the next step';
    }
}
const LATERAL_THINKING_TOOL = {
    name: 'lateralthinking',
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

7. **design_thinking**: Design Thinking with Embedded Risk Management
   - Empathize + Threat Modeling: Understand user needs AND potential misuse
   - Define + Problem Inversion: Frame problem AND "How might we fail?"
   - Ideate + Devil's Advocate: Generate solutions with internal critic
   - Prototype + Stress Testing: Build tests including edge cases
   - Test + Failure Harvesting: User feedback plus failure analysis

8. **triz**: TRIZ Enhanced with Via Negativa
   - Identify contradictions in the problem
   - Ask "What can we remove?" before adding
   - Apply inventive principles both additively and subtractively
   - Create minimal solutions that achieve more by doing less

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
        type: 'object',
        properties: {
            sessionId: {
                type: 'string',
                description: 'Session ID from previous response (required for steps 2+)',
            },
            technique: {
                type: 'string',
                enum: ['six_hats', 'po', 'random_entry', 'scamper', 'concept_extraction', 'yes_and', 'design_thinking', 'triz'],
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
            hatColor: {
                type: 'string',
                enum: ['blue', 'white', 'red', 'yellow', 'black', 'green'],
                description: 'Current hat color (for six_hats technique)',
            },
            provocation: {
                type: 'string',
                description: 'The provocative statement (for po technique)',
            },
            principles: {
                type: 'array',
                items: { type: 'string' },
                description: 'Extracted principles (for po technique)',
            },
            randomStimulus: {
                type: 'string',
                description: 'The random word/concept (for random_entry technique)',
            },
            connections: {
                type: 'array',
                items: { type: 'string' },
                description: 'Generated connections (for random_entry technique)',
            },
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
                description: 'Current SCAMPER action',
            },
            successExample: {
                type: 'string',
                description: 'A successful solution/example to analyze (for concept_extraction technique)',
            },
            extractedConcepts: {
                type: 'array',
                items: { type: 'string' },
                description: 'Key concepts extracted from the success example (for concept_extraction technique)',
            },
            abstractedPatterns: {
                type: 'array',
                items: { type: 'string' },
                description: 'Abstracted patterns from the concepts (for concept_extraction technique)',
            },
            applications: {
                type: 'array',
                items: { type: 'string' },
                description: 'Applications of patterns to the problem (for concept_extraction technique)',
            },
            initialIdea: {
                type: 'string',
                description: 'The initial idea or contribution to build upon (for yes_and technique)',
            },
            additions: {
                type: 'array',
                items: { type: 'string' },
                description: 'Creative additions building on the idea (for yes_and technique)',
            },
            evaluations: {
                type: 'array',
                items: { type: 'string' },
                description: 'Critical evaluations of potential issues (for yes_and technique)',
            },
            synthesis: {
                type: 'string',
                description: 'Final integrated solution combining insights (for yes_and technique)',
            },
            isRevision: {
                type: 'boolean',
                description: 'Whether this revises a previous step',
            },
            revisesStep: {
                type: 'integer',
                description: 'Which step is being revised',
                minimum: 1,
            },
            branchFromStep: {
                type: 'integer',
                description: 'Step number to branch from',
                minimum: 1,
            },
            branchId: {
                type: 'string',
                description: 'Identifier for the branch',
            },
            risks: {
                type: 'array',
                items: { type: 'string' },
                description: 'Risks or potential issues identified (unified framework)',
            },
            failureModes: {
                type: 'array',
                items: { type: 'string' },
                description: 'Ways this solution could fail (unified framework)',
            },
            mitigations: {
                type: 'array',
                items: { type: 'string' },
                description: 'Strategies to address risks (unified framework)',
            },
            antifragileProperties: {
                type: 'array',
                items: { type: 'string' },
                description: 'Ways the solution benefits from stress/change (unified framework)',
            },
            blackSwans: {
                type: 'array',
                items: { type: 'string' },
                description: 'Low probability, high impact events to consider (unified framework)',
            },
            designStage: {
                type: 'string',
                enum: ['empathize', 'define', 'ideate', 'prototype', 'test'],
                description: 'Current Design Thinking stage (for design_thinking technique)',
            },
            empathyInsights: {
                type: 'array',
                items: { type: 'string' },
                description: 'User needs and potential misuse cases (for design_thinking - empathize stage)',
            },
            problemStatement: {
                type: 'string',
                description: 'Framed problem with failure modes (for design_thinking - define stage)',
            },
            failureModesPredicted: {
                type: 'array',
                items: { type: 'string' },
                description: 'Predicted failure modes (for design_thinking - define stage)',
            },
            ideaList: {
                type: 'array',
                items: { type: 'string' },
                description: 'Generated ideas with risk assessment (for design_thinking - ideate stage)',
            },
            prototypeDescription: {
                type: 'string',
                description: 'Prototype description including edge cases (for design_thinking - prototype stage)',
            },
            stressTestResults: {
                type: 'array',
                items: { type: 'string' },
                description: 'Results from stress testing (for design_thinking - prototype stage)',
            },
            userFeedback: {
                type: 'array',
                items: { type: 'string' },
                description: 'User feedback from testing (for design_thinking - test stage)',
            },
            failureInsights: {
                type: 'array',
                items: { type: 'string' },
                description: 'Insights from failure analysis (for design_thinking - test stage)',
            },
            contradiction: {
                type: 'string',
                description: 'The contradiction to resolve (for triz technique)',
            },
            inventivePrinciples: {
                type: 'array',
                items: { type: 'string' },
                description: 'TRIZ inventive principles applied (for triz technique)',
            },
            viaNegativaRemovals: {
                type: 'array',
                items: { type: 'string' },
                description: 'Elements removed via negativa approach (for triz technique)',
            },
            minimalSolution: {
                type: 'string',
                description: 'The minimal solution achieved (for triz technique)',
            },
            sessionOperation: {
                type: 'string',
                enum: ['save', 'load', 'list', 'delete', 'export'],
                description: 'Session management operation to perform',
            },
            saveOptions: {
                type: 'object',
                properties: {
                    sessionName: {
                        type: 'string',
                        description: 'Name for the saved session',
                    },
                    tags: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Tags to categorize the session',
                    },
                    asTemplate: {
                        type: 'boolean',
                        description: 'Save as a template for reuse',
                    },
                },
                description: 'Options for save operation',
            },
            loadOptions: {
                type: 'object',
                properties: {
                    sessionId: {
                        type: 'string',
                        description: 'ID of the session to load',
                    },
                    continueFrom: {
                        type: 'integer',
                        description: 'Step to continue from',
                        minimum: 1,
                    },
                },
                required: ['sessionId'],
                description: 'Options for load operation',
            },
            listOptions: {
                type: 'object',
                properties: {
                    limit: {
                        type: 'integer',
                        description: 'Maximum number of sessions to return',
                    },
                    technique: {
                        type: 'string',
                        enum: ['six_hats', 'po', 'random_entry', 'scamper', 'concept_extraction', 'yes_and', 'design_thinking', 'triz'],
                        description: 'Filter by technique',
                    },
                    status: {
                        type: 'string',
                        enum: ['active', 'completed', 'all'],
                        description: 'Filter by session status',
                    },
                    tags: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Filter by tags',
                    },
                    searchTerm: {
                        type: 'string',
                        description: 'Search in session content',
                    },
                },
                description: 'Options for list operation',
            },
            deleteOptions: {
                type: 'object',
                properties: {
                    sessionId: {
                        type: 'string',
                        description: 'ID of the session to delete',
                    },
                    confirm: {
                        type: 'boolean',
                        description: 'Confirmation flag',
                    },
                },
                required: ['sessionId'],
                description: 'Options for delete operation',
            },
            exportOptions: {
                type: 'object',
                properties: {
                    sessionId: {
                        type: 'string',
                        description: 'ID of the session to export',
                    },
                    format: {
                        type: 'string',
                        enum: ['json', 'markdown', 'csv'],
                        description: 'Export format',
                    },
                    outputPath: {
                        type: 'string',
                        description: 'Optional output file path',
                    },
                },
                required: ['sessionId', 'format'],
                description: 'Options for export operation',
            },
            autoSave: {
                type: 'boolean',
                description: 'Enable automatic session saving',
            },
        },
        required: ['technique', 'problem', 'currentStep', 'totalSteps', 'output', 'nextStepNeeded'],
    },
};
const server = new Server({
    name: 'creative-thinking-server',
    version: '0.1.0',
}, {
    capabilities: {
        tools: {},
    },
});
const lateralServer = new LateralThinkingServer();
server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: [LATERAL_THINKING_TOOL],
}));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === 'lateralthinking') {
        return lateralServer.processLateralThinking(request.params.arguments);
    }
    return {
        content: [
            {
                type: 'text',
                text: `Unknown tool: ${request.params.name}`,
            },
        ],
        isError: true,
    };
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
//# sourceMappingURL=index.js.map