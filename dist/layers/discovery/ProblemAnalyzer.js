/**
 * ProblemAnalyzer - Handles problem categorization and analysis
 * Extracted from discoverTechniques to improve maintainability
 * Enhanced with comprehensive NLP analysis using NLPService
 */
import { getNLPService } from '../../nlp/NLPService.js';
export class ProblemAnalyzer {
    nlpService;
    constructor() {
        this.nlpService = getNLPService();
    }
    /**
     * Categorize the problem based on NLP analysis and patterns
     */
    categorizeProblem(problem, context) {
        const fullText = `${problem} ${context || ''}`;
        // Use NLPService for comprehensive analysis
        const nlpAnalysis = this.nlpService.analyze(fullText);
        // Check for paradoxes and contradictions using enhanced NLP
        if (this.detectParadoxicalPattern(fullText)) {
            return 'paradoxical';
        }
        // Use temporal analysis for time-related problems (check early, before creative)
        if (nlpAnalysis.temporal.hasDeadline || nlpAnalysis.temporal.urgency !== 'none') {
            return 'temporal';
        }
        // Additional temporal checks (already covered by NLP analysis above)
        if (nlpAnalysis.temporal.expressions.length > 2) {
            return 'temporal';
        }
        // Check for explicit deadline/time keywords
        if (fullText.toLowerCase().includes('deadline') ||
            fullText.toLowerCase().includes('time pressure') ||
            fullText.toLowerCase().includes('limited time')) {
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
        // Check for organizational/cultural using NLP analysis
        if (nlpAnalysis.entities.people.length > 2 || this.needsCollaboration(problem, context)) {
            return 'organizational';
        }
        // Check for organizational keywords with NLP topics
        const orgKeywords = [
            'team',
            'collaboration',
            'stakeholder',
            'collective',
            'culture',
            'diverse',
            'crowdsourc',
            'collaborat',
            'consensus',
            'together',
            'perspectives',
            'swarm',
            'wisdom of crowds',
            'bring together',
            'multiple perspectives',
        ];
        if (orgKeywords.some(keyword => fullText.toLowerCase().includes(keyword) ||
            nlpAnalysis.topics.keywords.some(k => k.toLowerCase().includes(keyword)))) {
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
     * Detect paradoxical patterns using enhanced NLP
     */
    detectParadoxicalPattern(text) {
        const lower = text.toLowerCase();
        // Use NLPService for comprehensive paradox detection
        const paradoxAnalysis = this.nlpService.detectParadoxes(text);
        const contradictionAnalysis = this.nlpService.detectContradictions(text);
        // If NLPService detects paradoxes or contradictions, return true
        if (paradoxAnalysis.hasParadox || contradictionAnalysis.hasContradiction) {
            // But exclude time-related conflicts
            if (lower.includes('deadline') || lower.includes('schedule')) {
                // Check if it's specifically about time conflicts
                const temporal = this.nlpService.extractTemporalExpressions(text);
                if (temporal.expressions.length > 0 && !lower.includes('paradox')) {
                    return false; // It's a time conflict, not a paradox
                }
            }
            // Exclude "conflicting requirements" which is not necessarily paradoxical
            if (lower.includes('conflicting') && lower.includes('requirements')) {
                return false;
            }
            return true;
        }
        // Additional paradox keywords that might not be caught by NLPService
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
        const hasConflicting = lower.includes('conflicting') &&
            !lower.includes('deadline') &&
            !lower.includes('schedule') &&
            !lower.includes('time') &&
            !lower.includes('requirements');
        if (paradoxKeywords.some(k => lower.includes(k)) || hasConflicting) {
            return true;
        }
        // Check for structural patterns using NLP relationships
        const relationships = this.nlpService.extractRelationships(text);
        // Look for opposing relationships
        const hasOpposingRelationships = relationships.dependencies.some(dep => dep.type === 'conditional' &&
            (dep.dependency.includes('but') || dep.dependency.includes('however')));
        if (hasOpposingRelationships) {
            return true;
        }
        // Pattern: "on one hand" or similar
        const hasOnOneHand = lower.includes('on one hand') || lower.includes('on the one hand');
        if (hasOnOneHand) {
            return true;
        }
        // "Balance" is too generic - only consider it paradoxical with specific context
        const hasBalanceParadox = lower.includes('balance') && (lower.includes('opposing') || lower.includes('contradictory'));
        // Pattern: opposition words
        const hasOpposition = lower.includes('versus') ||
            lower.includes('vs') ||
            lower.includes('at odds') ||
            lower.includes('in conflict');
        return hasBalanceParadox || hasOpposition;
    }
    /**
     * Check if the problem has time constraints using NLP
     */
    hasTimeConstraint(problem, constraints) {
        // Use NLPService for temporal analysis
        const temporal = this.nlpService.extractTemporalExpressions(problem);
        // Check if there are deadlines or urgent time expressions
        if (temporal.hasDeadline || temporal.urgency !== 'none') {
            return true;
        }
        // Also check constraints if provided
        if (constraints) {
            const constraintText = constraints.join(' ');
            const constraintTemporal = this.nlpService.extractTemporalExpressions(constraintText);
            if (constraintTemporal.hasDeadline || constraintTemporal.urgency !== 'none') {
                return true;
            }
        }
        // Fallback to keyword matching for edge cases
        const timeWords = ['deadline', 'urgent', 'asap', 'quickly', 'time-sensitive'];
        const problemHasTime = timeWords.some(word => problem.toLowerCase().includes(word));
        const constraintsHaveTime = constraints?.some(c => timeWords.some(word => c.toLowerCase().includes(word))) || false;
        return problemHasTime || constraintsHaveTime;
    }
    /**
     * Check if the problem needs collaboration using NLP
     */
    needsCollaboration(problem, context) {
        const fullText = `${problem} ${context || ''}`;
        // Use NLPService to extract entities and topics
        const entities = this.nlpService.extractEntities(fullText);
        const topics = this.nlpService.extractTopics(fullText);
        // Check if there are multiple people mentioned
        if (entities.people.length > 1) {
            return true;
        }
        // Check if topics include collaboration-related categories
        if (topics.categories.includes('people')) {
            return true;
        }
        // Use intent classification to check for collaborative intent
        const intent = this.nlpService.classifyIntent(fullText);
        if (intent.intents.some(i => i.intent === 'request_help' || i.intent === 'express_agreement')) {
            return true;
        }
        // Fallback to keyword matching
        const collabWords = [
            'team',
            'stakeholder',
            'collaboration',
            'together',
            'group',
            'collective',
            'consensus',
            'crowdsourc',
            'collaborat',
            'perspectives',
            'swarm',
            'emergent',
            'bring together',
        ];
        const lower = fullText.toLowerCase();
        return collabWords.some(word => lower.includes(word));
    }
}
//# sourceMappingURL=ProblemAnalyzer.js.map