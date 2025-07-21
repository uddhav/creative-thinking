/**
 * Enhanced JSON exporter with flexible output options
 */
import { BaseExporter } from './base-exporter.js';
export class JSONExporter extends BaseExporter {
    constructor() {
        super('json');
    }
    // eslint-disable-next-line @typescript-eslint/require-await
    async export(session, options) {
        const data = this.prepareData(session, options);
        const content = JSON.stringify(data, null, 2);
        return {
            content,
            filename: this.generateFilename(session, 'json'),
            mimeType: 'application/json',
            metadata: {
                exportedAt: new Date(),
                sessionId: session.id,
                techniqueUsed: session.technique,
                totalSteps: session.totalSteps,
                completedSteps: session.currentStep,
            },
        };
    }
    prepareData(session, options) {
        const data = {
            exportMetadata: {
                exportedAt: new Date().toISOString(),
                exportVersion: '1.0',
                tool: 'Creative Thinking MCP Tool',
            },
            sessionId: session.id,
            problem: session.problem,
            technique: session.technique,
            status: this.getSessionStatus(session),
            progress: {
                currentStep: session.currentStep,
                totalSteps: session.totalSteps,
                percentComplete: Math.round((session.currentStep / session.totalSteps) * 100),
            },
        };
        // Add optional metadata
        if (options.includeMetadata !== false) {
            data.metadata = {
                name: session.name,
                tags: session.tags || [],
                startTime: session.startTime ? new Date(session.startTime).toISOString() : null,
                endTime: session.endTime ? new Date(session.endTime).toISOString() : null,
                duration: this.calculateDuration(session.startTime, session.endTime),
            };
        }
        // Add history with enhanced structure
        if (options.includeHistory !== false) {
            data.history = session.history.map((entry, index) => this.enhanceHistoryEntry(entry.input, entry.timestamp, index + 1));
        }
        // Add insights
        if (options.includeInsights !== false && session.insights.length > 0) {
            data.insights = {
                count: session.insights.length,
                items: session.insights,
            };
        }
        // Add metrics
        if (options.includeMetrics !== false && session.metrics) {
            data.metrics = {
                ...session.metrics,
                summary: this.generateMetricsSummary(session.metrics),
            };
        }
        // Add branches if present
        if (options.includeBranches !== false && Object.keys(session.branches).length > 0) {
            data.branches = {
                count: Object.keys(session.branches).length,
                details: Object.entries(session.branches).map(([id, branch]) => ({
                    branchId: id,
                    stepsInBranch: branch.length,
                })),
            };
        }
        // Add statistics
        data.statistics = this.generateStatistics(session);
        return data;
    }
    enhanceHistoryEntry(entry, timestamp, stepNumber) {
        const enhanced = {
            step: stepNumber,
            timestamp: timestamp,
            output: entry.output,
            technique: entry.technique,
        };
        // Add technique-specific fields
        if (entry.hatColor)
            enhanced.hatColor = entry.hatColor;
        if (entry.scamperAction)
            enhanced.scamperAction = entry.scamperAction;
        if (entry.provocation)
            enhanced.provocation = entry.provocation;
        if (entry.randomStimulus)
            enhanced.randomStimulus = entry.randomStimulus;
        if (entry.successExample)
            enhanced.successExample = entry.successExample;
        if (entry.initialIdea)
            enhanced.initialIdea = entry.initialIdea;
        // Add arrays if present
        const arrays = {
            risks: 'risks',
            mitigations: 'mitigations',
            connections: 'connections',
            principles: 'principles',
            extractedConcepts: 'extractedConcepts',
            abstractedPatterns: 'abstractedPatterns',
            applications: 'applications',
            additions: 'additions',
            evaluations: 'evaluations',
            antifragileProperties: 'antifragileProperties',
            blackSwans: 'blackSwans',
        };
        Object.entries(arrays).forEach(([key, field]) => {
            const value = entry[key];
            if (Array.isArray(value) && value.length > 0) {
                enhanced[field] = value;
            }
        });
        // Add revision information if present
        if ('isRevision' in entry && entry.isRevision) {
            enhanced.revision = {
                isRevision: true,
                revisesStep: 'revisesStep' in entry ? entry.revisesStep : undefined,
            };
        }
        // Add branch information if present
        if ('branchFromStep' in entry && entry.branchFromStep) {
            enhanced.branch = {
                fromStep: entry.branchFromStep,
                branchId: 'branchId' in entry ? entry.branchId : undefined,
            };
        }
        return enhanced;
    }
    generateMetricsSummary(metrics) {
        return {
            overallCreativity: this.categorizeScore(metrics.creativityScore ?? 0, 'creativity'),
            riskAwareness: this.categorizeScore(metrics.risksCaught ?? 0, 'risk'),
            robustness: this.categorizeScore(metrics.antifragileFeatures ?? 0, 'robustness'),
        };
    }
    categorizeScore(score, type) {
        switch (type) {
            case 'creativity':
                if (score >= 80)
                    return 'Highly Creative';
                if (score >= 60)
                    return 'Creative';
                if (score >= 40)
                    return 'Moderately Creative';
                return 'Developing';
            case 'risk':
                if (score >= 10)
                    return 'Excellent Risk Awareness';
                if (score >= 5)
                    return 'Good Risk Awareness';
                if (score >= 2)
                    return 'Some Risk Awareness';
                return 'Limited Risk Awareness';
            case 'robustness':
                if (score >= 8)
                    return 'Highly Robust';
                if (score >= 4)
                    return 'Robust';
                if (score >= 2)
                    return 'Somewhat Robust';
                return 'Basic';
            default:
                return 'Unknown';
        }
    }
    generateStatistics(session) {
        const stats = {
            totalOutputLength: 0,
            averageOutputLength: 0,
            uniqueConceptsCount: 0,
            revisionCount: 0,
            branchingPoints: 0,
        };
        // Calculate output statistics
        const outputs = session.history.map(h => h.input.output);
        stats.totalOutputLength = outputs.reduce((sum, output) => sum + output.length, 0);
        stats.averageOutputLength = Math.round(stats.totalOutputLength / outputs.length);
        // Count unique concepts across all arrays
        const allConcepts = new Set();
        session.history.forEach(h => {
            [
                'risks',
                'mitigations',
                'connections',
                'principles',
                'extractedConcepts',
                'applications',
                'antifragileProperties',
            ].forEach(field => {
                const items = h.input[field];
                if (items && Array.isArray(items)) {
                    items.forEach(item => {
                        if (typeof item === 'string') {
                            allConcepts.add(item.toLowerCase());
                        }
                    });
                }
            });
        });
        stats.uniqueConceptsCount = allConcepts.size;
        // Count revisions and branches
        stats.revisionCount = session.history.filter(h => {
            return 'isRevision' in h.input && h.input.isRevision === true;
        }).length;
        stats.branchingPoints = Object.keys(session.branches).length;
        return stats;
    }
}
//# sourceMappingURL=json-exporter.js.map