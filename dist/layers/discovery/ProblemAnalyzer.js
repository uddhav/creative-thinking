/**
 * ProblemAnalyzer - Handles problem categorization and analysis
 * Extracted from discoverTechniques to improve maintainability
 */
export class ProblemAnalyzer {
    /**
     * Categorize the problem based on keywords and context
     */
    categorizeProblem(problem, context) {
        const fullText = `${problem} ${context || ''}`.toLowerCase();
        // Check for temporal first since it's more specific
        if (fullText.includes('time') ||
            fullText.includes('deadline') ||
            fullText.includes('schedule') ||
            fullText.includes('temporal') ||
            fullText.includes('timing') ||
            fullText.includes('calendar')) {
            return 'temporal';
        }
        // Check for cognitive/focus problems
        if (fullText.includes('focus') ||
            fullText.includes('cognitive') ||
            fullText.includes('attention') ||
            fullText.includes('mental') ||
            fullText.includes('brain') ||
            fullText.includes('productivity')) {
            return 'cognitive';
        }
        // Check for implementation/execution problems
        if (fullText.includes('implement') ||
            fullText.includes('execute') ||
            fullText.includes('deploy') ||
            fullText.includes('launch') ||
            fullText.includes('realize') ||
            fullText.includes('make it happen') ||
            fullText.includes('put into practice')) {
            return 'implementation';
        }
        // Check for system-level analysis problems
        if (fullText.includes('system') ||
            fullText.includes('ecosystem') ||
            fullText.includes('holistic') ||
            fullText.includes('comprehensive') ||
            fullText.includes('multi-level') ||
            fullText.includes('scale') ||
            fullText.includes('component')) {
            return 'systems';
        }
        // Check for organizational/cultural keywords before user-centered (to prioritize cross-cultural work)
        if (fullText.includes('team') ||
            fullText.includes('collaboration') ||
            fullText.includes('communication') ||
            fullText.includes('stakeholder') ||
            fullText.includes('collective') ||
            fullText.includes('consensus') ||
            fullText.includes('crowd') ||
            fullText.includes('together') ||
            fullText.includes('perspectives') ||
            fullText.includes('synthesize') ||
            fullText.includes('wisdom') ||
            fullText.includes('swarm') ||
            fullText.includes('bring') ||
            fullText.includes('multiple') ||
            fullText.includes('emergent') ||
            fullText.includes('global') ||
            fullText.includes('culture') ||
            fullText.includes('diverse') ||
            fullText.includes('inclusive') ||
            fullText.includes('multicultural')) {
            return 'organizational';
        }
        if (fullText.includes('user') ||
            fullText.includes('customer') ||
            fullText.includes('experience')) {
            return 'user-centered';
        }
        if (fullText.includes('technical') ||
            fullText.includes('system') ||
            fullText.includes('architecture') ||
            fullText.includes('energy') ||
            fullText.includes('machine') ||
            fullText.includes('motion') ||
            fullText.includes('physics') ||
            fullText.includes('engineering')) {
            return 'technical';
        }
        if (fullText.includes('creative') ||
            fullText.includes('innovative') ||
            fullText.includes('new')) {
            return 'creative';
        }
        if (fullText.includes('process') ||
            fullText.includes('workflow') ||
            fullText.includes('efficiency')) {
            return 'process';
        }
        if (fullText.includes('strategy') ||
            fullText.includes('business') ||
            fullText.includes('market')) {
            return 'strategic';
        }
        return 'general';
    }
    /**
     * Check if the problem has time constraints
     */
    hasTimeConstraint(problem, constraints) {
        const timeWords = ['deadline', 'urgent', 'asap', 'quickly', 'time-sensitive'];
        const problemHasTime = timeWords.some(word => problem.toLowerCase().includes(word));
        const constraintsHaveTime = constraints?.some(c => timeWords.some(word => c.toLowerCase().includes(word))) || false;
        return problemHasTime || constraintsHaveTime;
    }
    /**
     * Check if the problem needs collaboration
     */
    needsCollaboration(problem, context) {
        const collabWords = ['team', 'stakeholder', 'collaboration', 'together', 'group'];
        const fullText = `${problem} ${context || ''}`.toLowerCase();
        return collabWords.some(word => fullText.includes(word));
    }
}
//# sourceMappingURL=ProblemAnalyzer.js.map