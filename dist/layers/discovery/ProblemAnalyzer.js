/**
 * ProblemAnalyzer - Handles problem categorization and analysis
 * Extracted from discoverTechniques to improve maintainability
 * Enhanced with comprehensive NLP analysis using NLPService
 */
import { getNLPService } from '../../nlp/NLPService.js';
export class ProblemAnalyzer {
    nlpService;
    // Pre-compiled regex patterns for performance
    COGNITIVE_PATTERN = /\b(cognitive|mental|focus|productivity)\b/;
    constructor() {
        this.nlpService = getNLPService();
    }
    /**
     * Categorize the problem based on NLP analysis and patterns
     */
    categorizeProblem(problem, context) {
        const fullText = `${problem} ${context || ''}`;
        // Cache toLowerCase result for performance
        const lowerText = fullText.toLowerCase();
        // OPTIMIZATION: Fast-path for explicit technique requests (skip NLP)
        const explicitTechnique = this.checkExplicitTechniqueRequest(fullText, lowerText);
        if (explicitTechnique) {
            return explicitTechnique;
        }
        // Use NLPService for comprehensive analysis with error handling
        let nlpAnalysis;
        try {
            nlpAnalysis = this.nlpService.analyze(fullText);
        }
        catch (error) {
            console.warn('NLP analysis failed, using fallback categorization', error);
            // Fallback to keyword-only detection when NLP fails
            return this.fallbackCategorization(lowerText);
        }
        // 1. Check for paradoxes using NLP results
        if (nlpAnalysis.paradoxes.hasParadox || nlpAnalysis.contradictions.hasContradiction) {
            // Exclude time/requirement conflicts that aren't true paradoxes
            const lower = fullText.toLowerCase();
            if (!lower.includes('deadline') && !lower.includes('conflicting requirements')) {
                return 'paradoxical';
            }
        }
        // 2. Check temporal using NLP results (no redundant string matching)
        if (nlpAnalysis.temporal.hasDeadline ||
            nlpAnalysis.temporal.urgency !== 'none' ||
            nlpAnalysis.temporal.expressions.length > 2) {
            return 'temporal';
        }
        // 3. Check organizational/collaborative using NLP entities
        if (nlpAnalysis.entities.people.length > 2 ||
            nlpAnalysis.topics.categories.includes('people')) {
            return 'organizational';
        }
        // 4. Check for specific pattern categories FIRST (higher priority)
        // These should take precedence over general categories
        // Pass lowerText to detection methods to avoid repeated toLowerCase calls
        // Check for validation/verification patterns first
        if (this.detectValidationPattern(nlpAnalysis, lowerText)) {
            return 'validation';
        }
        // Check for behavioral economics patterns
        if (this.detectBehavioralPattern(nlpAnalysis, lowerText)) {
            return 'behavioral';
        }
        // Check for fundamental/first principles patterns
        if (this.detectFundamentalPattern(nlpAnalysis, lowerText)) {
            return 'fundamental';
        }
        // Check for learning/adaptive patterns
        if (this.detectLearningPattern(nlpAnalysis, lowerText)) {
            return 'learning';
        }
        // Check for computational/algorithmic patterns
        if (this.detectComputationalPattern(nlpAnalysis, lowerText)) {
            return 'computational';
        }
        // 5. Use NLP topic categories for general classification
        const topicCategories = nlpAnalysis.topics.categories;
        const entities = nlpAnalysis.entities;
        const verbs = nlpAnalysis.entities.verbs;
        // Cognitive: Check NLP topics and verbs
        if (topicCategories.includes('psychology') ||
            verbs.some(v => ['focus', 'think', 'concentrate', 'remember'].includes(v.toLowerCase()))) {
            return 'cognitive';
        }
        // Implementation: Check verbs and intent
        if (nlpAnalysis.intent.intents.some(i => i.intent === 'request_action') &&
            verbs.some(v => ['implement', 'execute', 'deploy', 'launch', 'build'].includes(v.toLowerCase()))) {
            return 'implementation';
        }
        // Systems: Use NLP topics and entities
        if (topicCategories.includes('technology') &&
            entities.nouns.some(n => ['system', 'architecture', 'ecosystem', 'component'].includes(n.toLowerCase()))) {
            return 'systems';
        }
        // User-centered: Check entities and topics
        if ((entities.nouns.some(n => ['user', 'customer', 'client'].includes(n.toLowerCase())) ||
            topicCategories.includes('people')) &&
            verbs.some(v => ['experience', 'interact', 'use'].includes(v.toLowerCase()))) {
            return 'user-centered';
        }
        // Technical: Use NLP readability and topics
        if (nlpAnalysis.readability.clarity === 'complex' ||
            nlpAnalysis.readability.clarity === 'very_complex' ||
            topicCategories.includes('science') ||
            topicCategories.includes('technology')) {
            return 'technical';
        }
        // Creative: Check adjectives and intent
        if (entities.adjectives.some(a => ['creative', 'innovative', 'novel', 'original'].includes(a.toLowerCase())) ||
            nlpAnalysis.intent.intents.some(i => i.intent === 'express_opinion' && i.confidence > 0.7)) {
            return 'creative';
        }
        // Process: Check nouns and verbs
        if (entities.nouns.some(n => ['process', 'workflow', 'procedure'].includes(n.toLowerCase())) &&
            verbs.some(v => ['optimize', 'improve', 'streamline'].includes(v.toLowerCase()))) {
            return 'process';
        }
        // Strategic: Use topics and entities
        if (topicCategories.includes('business') ||
            entities.nouns.some(n => ['strategy', 'market', 'competition'].includes(n.toLowerCase()))) {
            return 'strategic';
        }
        return 'general';
    }
    /**
     * Detect paradoxical patterns using enhanced NLP
     * Note: Now called ONLY when needed since categorizeProblem handles most cases
     */
    detectParadoxicalPattern(text) {
        // This method is now rarely used since categorizeProblem handles paradox detection directly
        // Kept for backward compatibility and edge cases
        const paradoxAnalysis = this.nlpService.detectParadoxes(text);
        const contradictionAnalysis = this.nlpService.detectContradictions(text);
        // Trust NLP analysis
        return paradoxAnalysis.hasParadox || contradictionAnalysis.hasContradiction;
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
            return constraintTemporal.hasDeadline || constraintTemporal.urgency !== 'none';
        }
        return false;
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
        // Check for collaborative keywords in NLP-extracted topics
        const collabKeywords = ['team', 'collaboration', 'collective', 'together'];
        return topics.keywords.some(keyword => collabKeywords.some(collab => keyword.toLowerCase().includes(collab)));
    }
    /**
     * Fast-path check for explicit technique requests (avoids NLP overhead)
     */
    checkExplicitTechniqueRequest(text, lowerText) {
        const lower = lowerText || text.toLowerCase();
        // Fast-path for explicit temporal keywords (deadlines, time management)
        if (lower.includes('deadline') ||
            lower.includes('time management') ||
            lower.includes('schedule')) {
            return 'temporal';
        }
        // Fast-path for explicit cultural/global/organizational keywords
        if (lower.includes('cultural') ||
            lower.includes('cross-cultural') ||
            lower.includes('global') ||
            lower.includes('multicultural') ||
            lower.includes('stakeholder') ||
            lower.includes('collective') ||
            lower.includes('crowdsourc') ||
            lower.includes('wisdom of crowds') ||
            lower.includes('team collaboration') ||
            lower.includes('consensus') ||
            lower.includes('swarm intelligence') ||
            lower.includes('multiple perspectives') ||
            lower.includes('bring together') ||
            lower.includes('emergent')) {
            return 'organizational';
        }
        // Fast-path for explicit cognitive/mental keywords
        // Use pre-compiled regex to avoid false positives like 'fundamental' matching 'mental'
        if (this.COGNITIVE_PATTERN.test(lower)) {
            return 'cognitive';
        }
        // Map explicit technique mentions to categories
        const techniqueMap = {
            'first principles': 'fundamental',
            'six hats': 'creative',
            'six thinking hats': 'creative',
            scamper: 'creative',
            'random entry': 'creative',
            'po technique': 'creative',
            'design thinking': 'user-centered',
            triz: 'technical',
            'disney method': 'creative',
            'nine windows': 'systems',
            'temporal creativity': 'temporal',
            'paradoxical problem': 'paradoxical',
            'competing hypotheses': 'validation',
            'criteria-based': 'validation',
            'linguistic forensics': 'validation',
            'reverse benchmarking': 'behavioral',
            'context reframing': 'behavioral',
            'perception optimization': 'behavioral',
            'anecdotal signal': 'behavioral',
            'meta learning': 'learning',
            'meta-learning': 'learning',
            biomimetic: 'biological',
            'neural state': 'cognitive',
            'neuro computational': 'computational',
            'neuro-computational': 'computational',
            'quantum superposition': 'computational',
        };
        // Check for explicit technique requests
        for (const [technique, category] of Object.entries(techniqueMap)) {
            if (lower.includes(technique)) {
                return category;
            }
        }
        return null;
    }
    /**
     * Detect behavioral economics patterns using NLP analysis
     */
    detectBehavioralPattern(nlpAnalysis, lowerText) {
        // Use pre-lowercased text for performance
        const lower = lowerText;
        // Ordered from most to least specific for early exit optimization
        const behavioralKeywords = [
            'customer behavior',
            'user psychology',
            'psychological',
            'psychology',
            'influence',
            'incentive',
            'perception',
            'behavior',
            'behaviour',
            'nudge',
        ];
        // Use find() for early exit on first match instead of checking all
        const hasDirectMatch = behavioralKeywords.find(keyword => lower.includes(keyword));
        if (hasDirectMatch)
            return true;
        const hasKeywords = nlpAnalysis.topics.keywords.some(k => behavioralKeywords.some(b => k.toLowerCase().includes(b)));
        const hasPsychCategory = nlpAnalysis.topics.categories.includes('psychology');
        const hasMoneyEntities = nlpAnalysis.entities.money.length > 0;
        return hasKeywords || hasPsychCategory || hasMoneyEntities;
    }
    /**
     * Detect fundamental/first principles patterns using NLP analysis
     */
    detectFundamentalPattern(nlpAnalysis, lowerText) {
        // Use pre-lowercased text for performance
        const lower = lowerText;
        // Ordered from most to least specific for early exit optimization
        const fundamentalKeywords = [
            'fundamental principle',
            'first principle',
            'root cause',
            'basic component',
            'core issue',
            'essential element',
            'break this down',
            'break down',
            'deconstruct',
            'foundation',
            'fundamental',
            'essential',
            'basic',
            'core',
        ];
        // Use find() for early exit on first match instead of checking all
        const hasDirectMatch = fundamentalKeywords.find(keyword => lower.includes(keyword));
        if (hasDirectMatch)
            return true;
        const hasKeywords = nlpAnalysis.topics.keywords.some(k => fundamentalKeywords.some(f => k.toLowerCase().includes(f)));
        // Check for questions about "why" which often indicate fundamental analysis
        const hasWhyQuestions = nlpAnalysis.pos.sentences.some(s => s.type === 'question' && s.text.toLowerCase().includes('why'));
        return hasKeywords || hasWhyQuestions;
    }
    /**
     * Detect learning/adaptive patterns using NLP analysis
     */
    detectLearningPattern(nlpAnalysis, lowerText) {
        // Use pre-lowercased text for performance
        const lower = lowerText;
        // Ordered from most to least specific for early exit optimization
        const learningKeywords = [
            'learn from',
            'synthesize pattern',
            'past failures',
            'past experience',
            'evolve our',
            'evolve your',
            'evolve the',
            'evolution',
            'feedback',
            'knowledge',
            'adapt',
        ];
        // Use find() for early exit on first match instead of checking all
        const hasDirectMatch = learningKeywords.find(keyword => lower.includes(keyword));
        if (hasDirectMatch)
            return true;
        const hasKeywords = nlpAnalysis.topics.keywords.some(k => learningKeywords.some(l => k.toLowerCase().includes(l)));
        // Check for education or knowledge topics
        const hasEducationCategory = nlpAnalysis.topics.categories.includes('education') ||
            nlpAnalysis.topics.categories.includes('knowledge');
        return hasKeywords || hasEducationCategory;
    }
    /**
     * Detect computational/algorithmic patterns using NLP analysis
     */
    detectComputationalPattern(nlpAnalysis, lowerText) {
        // Use pre-lowercased text for performance
        const lower = lowerText;
        // Ordered from most to least specific for early exit optimization
        const computationalKeywords = [
            'computational efficiency',
            'computational model',
            'process these in parallel',
            'process in parallel',
            'parallel process',
            'neural network',
            'computational',
            'algorithm',
            'neural',
        ];
        // Use find() for early exit on first match instead of checking all
        const hasDirectMatch = computationalKeywords.find(keyword => lower.includes(keyword));
        if (hasDirectMatch)
            return true;
        const hasKeywords = nlpAnalysis.topics.keywords.some(k => computationalKeywords.some(c => k.toLowerCase().includes(c)));
        // Check for technology topics and complex technical language
        const hasTechCategory = nlpAnalysis.topics.categories.includes('technology');
        const hasComplexity = nlpAnalysis.readability.clarity === 'complex' ||
            nlpAnalysis.readability.clarity === 'very_complex';
        return hasKeywords || (hasTechCategory && hasComplexity);
    }
    /**
     * Detect validation/verification patterns using NLP analysis
     */
    detectValidationPattern(nlpAnalysis, lowerText) {
        // Use pre-lowercased text for performance
        const lower = lowerText;
        // Ordered from most to least specific for early exit optimization
        const validationKeywords = [
            'test our',
            'test the',
            'validation',
            'hypothesis',
            'authentic',
            'evidence',
            'validate',
            'verify',
            'prove',
            'truth',
        ];
        // Use find() for early exit on first match instead of checking all
        const hasDirectMatch = validationKeywords.find(keyword => lower.includes(keyword));
        if (hasDirectMatch)
            return true;
        const hasKeywords = nlpAnalysis.topics.keywords.some(k => validationKeywords.some(v => k.toLowerCase().includes(v)));
        // Check for questions about verification
        const hasVerificationQuestions = nlpAnalysis.pos.sentences.some(s => s.type === 'question' &&
            (s.text.toLowerCase().includes('true') ||
                s.text.toLowerCase().includes('real') ||
                s.text.toLowerCase().includes('valid')));
        return hasKeywords || hasVerificationQuestions;
    }
    /**
     * Fallback categorization when NLP service fails
     * Uses simple keyword matching without NLP analysis
     */
    fallbackCategorization(lowerText) {
        // Check most common patterns using simple keyword matching
        if (lowerText.includes('technical') || lowerText.includes('engineer') || lowerText.includes('code')) {
            return 'technical';
        }
        if (lowerText.includes('creative') || lowerText.includes('innovate') || lowerText.includes('idea')) {
            return 'creative';
        }
        if (lowerText.includes('process') || lowerText.includes('workflow') || lowerText.includes('optimize')) {
            return 'process';
        }
        if (lowerText.includes('team') || lowerText.includes('organization') || lowerText.includes('collaborate')) {
            return 'organizational';
        }
        if (lowerText.includes('strategy') || lowerText.includes('business') || lowerText.includes('market')) {
            return 'strategic';
        }
        if (lowerText.includes('system') || lowerText.includes('architect') || lowerText.includes('component')) {
            return 'systems';
        }
        if (lowerText.includes('user') || lowerText.includes('customer') || lowerText.includes('experience')) {
            return 'user-centered';
        }
        // Default to general if no specific category matches
        return 'general';
    }
}
//# sourceMappingURL=ProblemAnalyzer.js.map