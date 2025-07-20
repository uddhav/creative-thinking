/**
 * Base exporter class with common functionality
 */
export class BaseExporter {
    format;
    constructor(format) {
        this.format = format;
    }
    /**
     * Generate a default filename for the export
     */
    generateFilename(session, extension) {
        const date = new Date().toISOString().split('T')[0];
        const technique = session.technique.replace(/_/g, '-');
        const problemSlug = session.problem
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .substring(0, 50);
        return `${technique}-${problemSlug}-${date}.${extension}`;
    }
    /**
     * Format a date according to options
     */
    formatDate(date, format) {
        if (!date)
            return 'N/A';
        const d = typeof date === 'number' ? new Date(date) : date;
        if (format === 'iso') {
            return d.toISOString();
        }
        else if (format === 'locale') {
            return d.toLocaleString();
        }
        else {
            // Default: YYYY-MM-DD HH:MM
            return d.toISOString().replace('T', ' ').substring(0, 16);
        }
    }
    /**
     * Calculate session duration in human-readable format
     */
    calculateDuration(startTime, endTime) {
        if (!startTime)
            return 'N/A';
        const end = endTime || Date.now();
        const durationMs = end - startTime;
        const minutes = Math.floor(durationMs / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''}, ${hours % 24} hour${hours % 24 !== 1 ? 's' : ''}`;
        }
        else if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''}, ${minutes % 60} minute${minutes % 60 !== 1 ? 's' : ''}`;
        }
        else {
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }
    }
    /**
     * Get a human-readable status for the session
     */
    getSessionStatus(session) {
        if (session.endTime) {
            return `Completed (${session.currentStep}/${session.totalSteps} steps)`;
        }
        else if (session.currentStep === session.totalSteps) {
            return 'Awaiting completion';
        }
        else {
            return `In progress (${session.currentStep}/${session.totalSteps} steps)`;
        }
    }
    /**
     * Get technique display name
     */
    getTechniqueDisplayName(technique) {
        const names = {
            six_hats: 'Six Thinking Hats',
            po: 'Provocative Operation (PO)',
            random_entry: 'Random Entry',
            scamper: 'SCAMPER',
            concept_extraction: 'Concept Extraction',
            yes_and: 'Yes, And...',
        };
        return names[technique] || technique.replace(/_/g, ' ').toUpperCase();
    }
    /**
     * Escape special characters for CSV
     */
    escapeCSV(value) {
        if (value.includes('"') || value.includes(',') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    }
}
//# sourceMappingURL=base-exporter.js.map