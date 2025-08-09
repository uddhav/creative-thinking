/**
 * ProblemAnalyzer - Handles problem categorization and analysis
 * Extracted from discoverTechniques to improve maintainability
 */
import nlp from 'compromise';
export class ProblemAnalyzer {
    /**
     * Categorize the problem based on NLP analysis and patterns
     */
    categorizeProblem(problem, context) {
        const fullText = `${problem} ${context || ''}`;
        const doc = nlp(fullText);
        const lower = fullText.toLowerCase();
        // Check for paradoxes and contradictions using NLP
        if (this.detectParadoxicalPattern(doc, lower)) {
            return 'paradoxical';
        }
        // Check for temporal since it's specific
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
     * Detect paradoxical patterns using NLP
     */
    detectParadoxicalPattern(doc, text) {
        // Direct paradox keywords - but not if it's about time conflicts
        const paradoxKeywords = [
            'paradox',
            'contradict',
            'incompatible',
            'mutually exclusive',
            'trade-off',
            'opposing',
            'dilemma',
            'tension',
        ];
        // Skip "conflicting" if it's about deadlines/schedules or requirements
        const hasConflicting = text.includes('conflicting') &&
            !text.includes('deadline') &&
            !text.includes('schedule') &&
            !text.includes('time') &&
            !text.includes('requirements');
        if (paradoxKeywords.some(k => text.includes(k)) || hasConflicting) {
            return true;
        }
        // Pattern: "both X and Y" or "X but Y" indicating contradiction
        const hasBothBut = doc.has('both') && (doc.has('but') || doc.has('yet'));
        const hasEitherOr = doc.has('either') && doc.has('or');
        const hasOnOneHand = text.includes('on one hand') || text.includes('on the one hand');
        if (hasBothBut || hasEitherOr || hasOnOneHand) {
            return true;
        }
        // Pattern: conflicting verbs/requirements - but only if not about time
        const conflictingVerbs = doc.verbs().out('array');
        const hasConflictingActions = conflictingVerbs.some(v => ['reconcile', 'harmonize', 'juggle'].includes(v.toLowerCase()));
        // "Balance" is too generic - only consider it paradoxical with specific context
        const hasBalanceParadox = text.includes('balance') && (text.includes('opposing') || text.includes('contradictory'));
        // Pattern: opposition words
        const hasOpposition = doc.has('versus') ||
            doc.has('vs') ||
            text.includes('at odds') ||
            text.includes('in conflict');
        return hasConflictingActions || hasOpposition || hasBalanceParadox;
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