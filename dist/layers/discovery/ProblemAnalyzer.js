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
        // OPTIMIZATION: Fast-path for explicit technique requests (skip NLP)
        const explicitTechnique = this.checkExplicitTechniqueRequest(fullText);
        if (explicitTechnique) {
            return explicitTechnique;
        }
        // Use NLPService for comprehensive analysis (only once!)
        const nlpAnalysis = this.nlpService.analyze(fullText);
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
        // Pass fullText to detection methods for direct matching
        // Check for validation/verification patterns first
        if (this.detectValidationPattern(nlpAnalysis, fullText)) {
            return 'validation';
        }
        // Check for behavioral economics patterns
        if (this.detectBehavioralPattern(nlpAnalysis, fullText)) {
            return 'behavioral';
        }
        // Check for fundamental/first principles patterns
        if (this.detectFundamentalPattern(nlpAnalysis, fullText)) {
            return 'fundamental';
        }
        // Check for learning/adaptive patterns
        if (this.detectLearningPattern(nlpAnalysis, fullText)) {
            return 'learning';
        }
        // Check for computational/algorithmic patterns
        if (this.detectComputationalPattern(nlpAnalysis, fullText)) {
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
    checkExplicitTechniqueRequest(text) {
        const lower = text.toLowerCase();
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
        // Use word boundaries to avoid false positives like 'fundamental' matching 'mental'
        const cognitivePattern = /\b(cognitive|mental|focus|productivity)\b/;
        if (cognitivePattern.test(lower)) {
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
    detectBehavioralPattern(nlpAnalysis, fullText) {
        // Check the full text for behavioral keywords
        const lower = fullText.toLowerCase();
        const behavioralKeywords = [
            'behavior',
            'behaviour',
            'perception',
            'psychology',
            'psychological',
            'incentive',
            'nudge',
            'influence',
            'customer behavior',
            'user psychology',
        ];
        // Direct text matching for better detection
        const hasDirectMatch = behavioralKeywords.some(keyword => lower.includes(keyword));
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
    detectFundamentalPattern(nlpAnalysis, fullText) {
        // Check the full text for fundamental keywords
        const lower = fullText.toLowerCase();
        const fundamentalKeywords = [
            'fundamental principle',
            'fundamental',
            'basic component',
            'basic',
            'core issue',
            'core',
            'essential element',
            'essential',
            'foundation',
            'root cause',
            'first principle',
            'break down',
            'break this down',
            'deconstruct',
        ];
        // Direct text matching for better detection
        const hasDirectMatch = fundamentalKeywords.some(keyword => lower.includes(keyword));
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
    detectLearningPattern(nlpAnalysis, fullText) {
        // Check the full text for learning keywords
        const lower = fullText.toLowerCase();
        const learningKeywords = [
            'learn from',
            'adapt',
            'synthesize pattern',
            'evolve our',
            'evolve your',
            'evolve the',
            'evolution',
            'feedback',
            'knowledge',
            'past failures',
            'past experience',
        ];
        // Direct text matching for better detection
        const hasDirectMatch = learningKeywords.some(keyword => lower.includes(keyword));
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
    detectComputationalPattern(nlpAnalysis, fullText) {
        // Check the full text for computational keywords
        const lower = fullText.toLowerCase();
        const computationalKeywords = [
            'algorithm',
            'computational',
            'neural network',
            'neural',
            'parallel process',
            'process these in parallel',
            'process in parallel',
            'computational model',
            'computational efficiency',
        ];
        // Direct text matching for better detection
        const hasDirectMatch = computationalKeywords.some(keyword => lower.includes(keyword));
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
    detectValidationPattern(nlpAnalysis, fullText) {
        // Check the full text for validation keywords
        const lower = fullText.toLowerCase();
        const validationKeywords = [
            'truth',
            'verify',
            'authentic',
            'validate',
            'evidence',
            'hypothesis',
            'test our',
            'test the',
            'prove',
            'validation',
        ];
        // Direct text matching for better detection
        const hasDirectMatch = validationKeywords.some(keyword => lower.includes(keyword));
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
}
//# sourceMappingURL=ProblemAnalyzer.js.map