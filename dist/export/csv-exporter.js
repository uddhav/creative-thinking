/**
 * CSV exporter for data analysis and spreadsheet import
 */
import { CSV_HEADERS } from './types.js';
import { BaseExporter } from './base-exporter.js';
export class CSVExporter extends BaseExporter {
    constructor() {
        super('csv');
    }
    async export(session, options) {
        const content = this.generateCSV(session, options);
        return {
            content,
            filename: this.generateFilename(session, 'csv'),
            mimeType: 'text/csv',
            metadata: {
                exportedAt: new Date(),
                sessionId: session.id,
                techniqueUsed: session.technique,
                totalSteps: session.totalSteps,
                completedSteps: session.currentStep
            }
        };
    }
    generateCSV(session, options) {
        // Determine which type of CSV to generate based on options
        if (options.includeMetrics && !options.includeHistory) {
            return this.generateMetricsCSV([session]);
        }
        else {
            return this.generateDetailedCSV(session, options);
        }
    }
    generateDetailedCSV(session, options) {
        const rows = [];
        // Determine headers based on what data is available
        const headers = this.determineHeaders(session);
        rows.push(headers);
        // Process each history entry
        session.history.forEach((entry, index) => {
            const row = this.createDetailedRow(entry.input, index + 1, session);
            rows.push(row);
        });
        // Convert to CSV format
        return rows.map(row => row.map(cell => this.escapeCSV(cell)).join(',')).join('\n');
    }
    determineHeaders(session) {
        const baseHeaders = ['Step', 'Timestamp', 'Technique'];
        const dynamicHeaders = [];
        // Check what fields are present in the history
        const sampleEntry = session.history[0]?.input;
        if (!sampleEntry)
            return baseHeaders.concat(['Output']);
        // Technique-specific headers
        if (session.technique === 'six_hats' && sampleEntry.hatColor) {
            dynamicHeaders.push('Hat Color');
        }
        if (session.technique === 'scamper' && sampleEntry.scamperAction) {
            dynamicHeaders.push('SCAMPER Action');
        }
        if (session.technique === 'po' && sampleEntry.provocation) {
            dynamicHeaders.push('Provocation');
        }
        if (session.technique === 'random_entry' && sampleEntry.randomStimulus) {
            dynamicHeaders.push('Random Stimulus');
        }
        if (session.technique === 'concept_extraction' && sampleEntry.successExample) {
            dynamicHeaders.push('Success Example');
        }
        if (session.technique === 'yes_and' && sampleEntry.initialIdea) {
            dynamicHeaders.push('Initial Idea');
        }
        // Main output
        dynamicHeaders.push('Output');
        // Check for arrays in any entry
        const hasRisks = session.history.some(h => h.input.risks && h.input.risks.length > 0);
        const hasMitigations = session.history.some(h => h.input.mitigations && h.input.mitigations.length > 0);
        const hasConnections = session.history.some(h => h.input.connections && h.input.connections.length > 0);
        const hasPrinciples = session.history.some(h => h.input.principles && h.input.principles.length > 0);
        const hasConcepts = session.history.some(h => h.input.extractedConcepts && h.input.extractedConcepts.length > 0);
        const hasApplications = session.history.some(h => h.input.applications && h.input.applications.length > 0);
        if (hasRisks)
            dynamicHeaders.push('Risks');
        if (hasMitigations)
            dynamicHeaders.push('Mitigations');
        if (hasConnections)
            dynamicHeaders.push('Connections');
        if (hasPrinciples)
            dynamicHeaders.push('Principles');
        if (hasConcepts)
            dynamicHeaders.push('Concepts');
        if (hasApplications)
            dynamicHeaders.push('Applications');
        // Revision/branch info
        const hasRevisions = session.history.some(h => h.input.isRevision);
        const hasBranches = session.history.some(h => h.input.branchFromStep);
        if (hasRevisions)
            dynamicHeaders.push('Is Revision', 'Revises Step');
        if (hasBranches)
            dynamicHeaders.push('Branch From', 'Branch ID');
        return baseHeaders.concat(dynamicHeaders);
    }
    createDetailedRow(entry, stepNumber, session) {
        const row = [
            stepNumber.toString(),
            this.formatDate(new Date(Date.now())), // timestamp is on the parent object
            this.getTechniqueDisplayName(session.technique)
        ];
        // Technique-specific fields
        if (session.technique === 'six_hats' && entry.hatColor !== undefined) {
            row.push(entry.hatColor.toUpperCase());
        }
        if (session.technique === 'scamper' && entry.scamperAction !== undefined) {
            row.push(entry.scamperAction.toUpperCase());
        }
        if (session.technique === 'po' && entry.provocation !== undefined) {
            row.push(entry.provocation);
        }
        if (session.technique === 'random_entry' && entry.randomStimulus !== undefined) {
            row.push(entry.randomStimulus);
        }
        if (session.technique === 'concept_extraction' && entry.successExample !== undefined) {
            row.push(entry.successExample);
        }
        if (session.technique === 'yes_and' && entry.initialIdea !== undefined) {
            row.push(entry.initialIdea);
        }
        // Main output
        row.push(entry.output);
        // Arrays (join with semicolons)
        const headers = this.determineHeaders(session);
        if (headers.includes('Risks')) {
            row.push(entry.risks ? entry.risks.join('; ') : '');
        }
        if (headers.includes('Mitigations')) {
            row.push(entry.mitigations ? entry.mitigations.join('; ') : '');
        }
        if (headers.includes('Connections')) {
            row.push(entry.connections ? entry.connections.join('; ') : '');
        }
        if (headers.includes('Principles')) {
            row.push(entry.principles ? entry.principles.join('; ') : '');
        }
        if (headers.includes('Concepts')) {
            row.push(entry.extractedConcepts ? entry.extractedConcepts.join('; ') : '');
        }
        if (headers.includes('Applications')) {
            row.push(entry.applications ? entry.applications.join('; ') : '');
        }
        // Revision/branch info
        if (headers.includes('Is Revision')) {
            row.push(entry.isRevision ? 'Yes' : 'No');
            row.push(entry.revisesStep ? entry.revisesStep.toString() : '');
        }
        if (headers.includes('Branch From')) {
            row.push(entry.branchFromStep ? entry.branchFromStep.toString() : '');
            row.push(entry.branchId || '');
        }
        return row;
    }
    generateMetricsCSV(sessions) {
        const rows = [];
        // Headers for metrics CSV
        rows.push(CSV_HEADERS.metrics);
        // Process each session
        sessions.forEach(session => {
            const duration = session.startTime && session.endTime
                ? Math.round((session.endTime - session.startTime) / 60000) // minutes
                : 0;
            const row = [
                session.id,
                session.problem,
                this.getTechniqueDisplayName(session.technique),
                duration.toString(),
                `${session.currentStep}/${session.totalSteps}`,
                (session.metrics?.creativityScore || 0).toString(),
                (session.metrics?.risksCaught || 0).toString(),
                session.insights.length.toString()
            ];
            rows.push(row);
        });
        // Convert to CSV format
        return rows.map(row => row.map(cell => this.escapeCSV(cell)).join(',')).join('\n');
    }
    /**
     * Special method to export multiple sessions as a comparative CSV
     */
    async exportMultiple(sessions, options) {
        const content = this.generateMetricsCSV(sessions);
        const date = new Date().toISOString().split('T')[0];
        return {
            content,
            filename: `creative-thinking-sessions-${date}.csv`,
            mimeType: 'text/csv',
            metadata: {
                exportedAt: new Date(),
                sessionCount: sessions.length,
                exportFormat: 'csv'
            }
        };
    }
}
//# sourceMappingURL=csv-exporter.js.map