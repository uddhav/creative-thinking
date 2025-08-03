/**
 * Parallelism Detection System
 * Analyzes user input to detect intent for parallel execution
 */
/**
 * Detects user intent for parallel execution through natural language analysis
 */
export class ParallelismDetector {
    /**
     * Keywords indicating parallel execution intent
     */
    static PARALLEL_KEYWORDS = [
        'parallel creative thinking',
        'fan out',
        'explore multiple approaches',
        'concurrent exploration',
        'simultaneous techniques',
        'multiple perspectives at once',
        'divergent exploration',
        'broad exploration',
        'explore in parallel',
        'multiple angles simultaneously',
        'all at once',
        'try everything',
        'shotgun approach',
        'wide net',
        'comprehensive exploration',
    ];
    /**
     * Keywords indicating convergence intent
     */
    static CONVERGENCE_KEYWORDS = [
        'converge',
        'synthesize',
        'bring together',
        'combine insights',
        'merge results',
        'unify findings',
        'integrate approaches',
        'consolidate',
        'harmonize',
        'fuse ideas',
        'blend perspectives',
        'weave together',
    ];
    /**
     * Keywords indicating LLM handoff for convergence
     */
    static LLM_HANDOFF_KEYWORDS = [
        'hand off to llm',
        'let llm decide',
        'llm synthesis',
        'flexible convergence',
        'adaptive synthesis',
        'intelligent merge',
        'ai convergence',
        'smart synthesis',
        'dynamic integration',
        'contextual merge',
    ];
    /**
     * Find matching keywords in text
     */
    findKeywordMatches(text, keywords) {
        const matches = [];
        const lowerText = text.toLowerCase();
        for (const keyword of keywords) {
            if (lowerText.includes(keyword.toLowerCase())) {
                matches.push(keyword);
            }
        }
        return matches;
    }
    /**
     * Calculate confidence score based on keyword matches
     */
    calculateConfidence(matches, text) {
        if (matches.length === 0)
            return 0;
        // Base confidence from match count (increased multiplier)
        const matchConfidence = Math.min(matches.length * 0.4, 0.9);
        // Boost confidence if keywords appear early in text
        const textLength = text.length;
        let positionBoost = 0;
        for (const match of matches) {
            const position = text.toLowerCase().indexOf(match.toLowerCase());
            if (position >= 0 && position < textLength * 0.3) {
                positionBoost += 0.1;
            }
        }
        // Cap total confidence at 0.95
        return Math.min(matchConfidence + positionBoost, 0.95);
    }
    /**
     * Detect execution mode from problem text
     */
    detectExecutionMode(problem, context) {
        const text = `${problem} ${context || ''}`.toLowerCase();
        // Check for parallel keywords
        const parallelMatches = this.findKeywordMatches(text, ParallelismDetector.PARALLEL_KEYWORDS);
        if (parallelMatches.length > 0) {
            return {
                executionMode: 'parallel',
                confidence: this.calculateConfidence(parallelMatches, text),
                detectedKeywords: parallelMatches,
            };
        }
        // Check for explicit sequential keywords (future enhancement)
        // For now, default to sequential with high confidence
        return {
            executionMode: 'sequential',
            confidence: 1.0,
            detectedKeywords: [],
        };
    }
    /**
     * Detect convergence intent from problem text
     */
    detectConvergenceIntent(problem, context) {
        const text = `${problem} ${context || ''}`.toLowerCase();
        // Check for LLM handoff first (more specific)
        const llmMatches = this.findKeywordMatches(text, ParallelismDetector.LLM_HANDOFF_KEYWORDS);
        if (llmMatches.length > 0) {
            return {
                method: 'llm_handoff',
                confidence: this.calculateConfidence(llmMatches, text),
                detectedKeywords: llmMatches,
            };
        }
        // Check for general convergence
        const convergenceMatches = this.findKeywordMatches(text, ParallelismDetector.CONVERGENCE_KEYWORDS);
        if (convergenceMatches.length > 0) {
            return {
                method: 'execute_thinking_step',
                confidence: this.calculateConfidence(convergenceMatches, text),
                detectedKeywords: convergenceMatches,
            };
        }
        // Default for parallel execution
        return {
            method: 'execute_thinking_step',
            confidence: 0.5,
            detectedKeywords: [],
        };
    }
    /**
     * Check if text suggests automatic mode selection
     */
    detectAutoMode(problem, context) {
        const autoKeywords = [
            'automatically decide',
            'auto select',
            'smart mode',
            'intelligent choice',
            'optimal approach',
            'best method',
        ];
        const text = `${problem} ${context || ''}`.toLowerCase();
        const matches = this.findKeywordMatches(text, autoKeywords);
        return matches.length > 0;
    }
}
//# sourceMappingURL=ParallelismDetector.js.map