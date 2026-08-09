/**
 * ProblemAnalyzer - Handles problem categorization and analysis
 * Extracted from discoverTechniques to improve maintainability
 * Enhanced with comprehensive NLP analysis using NLPService
 */
export declare class ProblemAnalyzer {
    private nlpService;
    private readonly COGNITIVE_PATTERN;
    constructor();
    /**
     * Categorize the problem based on NLP analysis and patterns
     */
    categorizeProblem(problem: string, context?: string): string;
    /**
     * End-of-life vocabulary, checked ahead of the broad category detectors.
     *
     * The broad retention detector below runs last, so it can only reclaim
     * problems that would otherwise fall through to 'general'. That placement is
     * deliberately additive, but it leaves the most explicit retention phrasings
     * stranded: "decommission the staging cluster" is claimed by `technical` and
     * "retire the old pipeline" by `organizational` long before it is reached.
     * Those are mis-routes — a cluster is the subject, not the subject matter.
     *
     * Terms here must be near-unambiguous: each one means ending something that
     * already exists, and means little else. Ambiguous words that carry retention
     * meaning only in context ('keep', 'cancel', 'renew') stay in the broad
     * detector, or appear here only paired with a thing being held.
     */
    private detectExplicitEndOfLife;
    /**
     * Detect retention re-decisions — whether to keep something already in place.
     *
     * Distinct from `decision`, which is about choosing forward between options.
     * These problems name an incumbent: a subscription, a module, a meeting, a
     * role. Measured against 20 realistic phrasings, 12 previously fell through
     * to 'general' (which recommends only six_hats) because the decision keyword
     * list contains none of keep, cut, retire, sunset, still need, renew, or
     * earning its keep.
     */
    private detectRetentionPattern;
    /**
     * Explicit requests to be argued with, checked ahead of the topic detectors.
     *
     * The broad detector below runs last, so it can only reclaim problems that
     * would otherwise fall through to 'general'. That placement is additive by
     * design, but measurement showed it leaves the most explicit phrasings
     * stranded: 'red team our incident response process' is claimed by
     * `technical`, 'prove me wrong about dropping the mobile app' by
     * `validation`, and 'convince me I am wrong about consolidating vendors' by
     * `technical` — all long before the rescue block is reached. Those are
     * mis-routes on what the problem is *about* rather than what is being asked
     * of it. An incident response process is the subject; being argued with is
     * the subject matter.
     *
     * Terms here must be near-unambiguous: each one asks for opposition, and
     * means little else.
     */
    private detectExplicitAdversarialAsk;
    /**
     * Softer requests for opposition, placed in the rescue block.
     *
     * Everything here has a plausible non-adversarial reading somewhere, which is
     * why it runs immediately before the fall-through to 'general' and can only
     * reclaim problems no other category wanted. 'worst case' is the clearest
     * example: paired with latency or throughput it is a performance question,
     * and `technical` and `computational` both claim it many lines earlier. By
     * the time control reaches here, the phrase has already failed every topic
     * detector, and what is left really is someone asking what could go wrong.
     */
    private detectAdversarialPattern;
    /**
     * Detect decision/judgment problems — choosing between options, weighing
     * trade-offs, committing to a course of action.
     */
    private detectDecisionPattern;
    /**
     * Detect communication/stakeholder problems — conveying, persuading,
     * aligning, or explaining to an audience.
     */
    private detectCommunicationPattern;
    /**
     * Detect cultural problems — cross-cultural collaboration, localization,
     * and globally distributed contexts.
     */
    private detectCulturalPattern;
    /**
     * Detect biological/evolutionary problems — adaptation, selection, and
     * nature-inspired design.
     */
    private detectBiologicalPattern;
    /**
     * Detect paradoxical patterns using enhanced NLP
     * Note: Now called ONLY when needed since categorizeProblem handles most cases
     */
    private detectParadoxicalPattern;
    /**
     * Check if the problem has time constraints using NLP
     */
    hasTimeConstraint(problem: string, constraints?: string[]): boolean;
    /**
     * Check if the problem needs collaboration using NLP
     */
    needsCollaboration(problem: string, context?: string): boolean;
    /**
     * Fast-path check for explicit technique requests (avoids NLP overhead)
     */
    private checkExplicitTechniqueRequest;
    /**
     * Detect behavioral economics patterns using NLP analysis
     */
    private detectBehavioralPattern;
    /**
     * Detect fundamental/first principles patterns using NLP analysis
     */
    private detectFundamentalPattern;
    /**
     * Detect learning/adaptive patterns using NLP analysis
     */
    private detectLearningPattern;
    /**
     * Detect computational/algorithmic patterns using NLP analysis
     */
    private detectComputationalPattern;
    /**
     * Detect validation/verification patterns using NLP analysis
     */
    private detectValidationPattern;
    /**
     * Fallback categorization when NLP service fails
     * Uses simple keyword matching without NLP analysis
     */
    private fallbackCategorization;
}
//# sourceMappingURL=ProblemAnalyzer.d.ts.map