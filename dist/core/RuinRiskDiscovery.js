/**
 * Dynamic Ruin Risk Discovery Framework
 *
 * This meta-framework helps LLMs discover domain-specific risks during inference
 * rather than relying on hard-coded validations. It uses Socratic questioning
 * to guide risk discovery and then enforces the LLM's own discovered constraints.
 *
 * Enhanced with adaptive domain discovery - learns about domains dynamically
 * without hardcoding specific domain knowledge.
 */
import nlp from 'compromise';
// Type assertion for the nlp library
const nlpTyped = nlp;
/**
 * Risk severity levels based on generic characteristics
 */
export var RiskSeverity;
(function (RiskSeverity) {
    RiskSeverity["LOW"] = "low";
    RiskSeverity["MEDIUM"] = "medium";
    RiskSeverity["HIGH"] = "high";
    RiskSeverity["CRITICAL"] = "critical";
    RiskSeverity["CATASTROPHIC"] = "catastrophic";
})(RiskSeverity || (RiskSeverity = {}));
/**
 * Main discovery framework that guides LLMs through risk identification
 */
export class RuinRiskDiscovery {
    discoveryHistory = new Map();
    /**
     * Get structured prompts for the discovery process - adaptive version
     */
    getDiscoveryPrompts(problem, proposedAction) {
        return {
            domainIdentification: `Analyzing "${problem}":
1. What domain or area of life does this problem belong to? Describe it in your own words.
2. What are the key characteristics of this domain?
   - Can mistakes be undone or are some actions permanent?
   - Do failures in this domain tend to be recoverable or catastrophic?
   - How quickly do consequences manifest (immediate/days/months/years)?
   - Do actions in this domain affect other people or systems?
   - Does success depend on specialized knowledge or expertise?
   - Are there legal, regulatory, or social rules that apply?
3. What makes this domain particularly risky or safe?
4. What patterns have you noticed in how this domain operates?`,
            riskDiscovery: `Based on your understanding of this domain:
1. What could go catastrophically wrong? Be specific.
2. What actions or decisions could lead to irreversible negative outcomes?
3. What are the early warning signs that someone is heading toward failure?
4. What factors tend to make bad situations worse in this domain?
5. Are there any "cliff edges" where small mistakes lead to large consequences?
6. What dependencies exist that could amplify problems?`,
            ruinScenarios: `Let's explore worst-case scenarios in detail:
1. Paint a picture of what complete failure looks like in this context.
2. What chain of events would lead someone to this failure?
3. At what point in this chain does recovery become impossible?
4. How much time typically passes between initial mistake and ruin?
5. What other areas of life get affected when this goes wrong?
6. Are there examples you know of where this has happened?`,
            safetyPractices: `What wisdom exists for avoiding disaster in this domain:
1. What do experts or experienced people in this area do differently?
2. What rules of thumb do they follow to stay safe?
3. What safety margins or buffer zones do they maintain?
4. How do they measure and monitor risk?
5. What practices do they absolutely avoid?
6. What would they tell a beginner to never do?`,
            maxAcceptableLoss: `Help calculate safe limits for this situation:
1. What's the maximum someone could safely risk without threatening their overall wellbeing?
2. How do you determine this limit? Walk through your reasoning.
3. What factors make this limit higher or lower?
4. How should this limit change based on someone's specific circumstances?
5. What additional safety margin would you add for unexpected events?
6. How would you know if someone is approaching this limit?`,
            validation: proposedAction
                ? `Evaluate "${proposedAction}" against the wisdom you've identified:
1. Does this action respect the safety limits you've discovered?
2. What percentage of maximum acceptable risk does this represent?
3. Are there any red flags or warning signs present?
4. What's your confidence level that this is safe? Why?
5. What specific modifications would make this safer?
6. What would need to be true for this to be acceptable?`
                : `How would you evaluate any proposed action to ensure it's safe in this domain?`,
        };
    }
    /**
     * Process LLM's domain assessment response
     */
    processDomainAssessment(response) {
        // Cache the NLP doc to avoid reprocessing
        let nlpDoc;
        try {
            nlpDoc = nlpTyped(response);
        }
        catch (error) {
            console.error('Failed to parse response with NLP:', error);
        }
        // Use NLP to analyze the response
        const nlpAnalysis = this.analyzeWithNLP(response);
        // Extract risk features using generic analysis
        const riskFeatures = this.extractRiskFeatures(response, nlpAnalysis);
        // Extract primary domain from LLM's own description
        const primaryDomain = this.extractDomainFromDescription(response);
        return {
            primaryDomain,
            domainCharacteristics: this.extractCharacteristics(response, nlpDoc),
            confidence: this.assessConfidence(response, riskFeatures),
            discoveredPatterns: this.extractPatterns(response),
            nlpAnalysis,
            riskFeatures,
        };
    }
    /**
     * Process discovered risks from LLM response
     */
    processRiskDiscovery(domain, response) {
        const discovery = {
            domain,
            identifiedRisks: this.extractRisks(response),
            domainSpecificSafetyPractices: this.extractSafetyPractices(response),
            maxAcceptableLoss: this.extractMaxLoss(response),
        };
        // Don't cache by domain - each discovery should be fresh
        // Store in session-specific discovery instead
        return discovery;
    }
    /**
     * Validate an action against discovered risks
     */
    validateAgainstDiscoveredRisks(action, discovery, ruinScenarios) {
        const violatedConstraints = [];
        // Check if action violates any discovered safety practices
        discovery.domainSpecificSafetyPractices.forEach(practice => {
            if (this.actionViolatesPractice(action, practice)) {
                violatedConstraints.push(practice);
            }
        });
        // Assess overall risk level
        const riskLevel = this.assessRiskLevel(action, discovery, ruinScenarios);
        return {
            isValid: violatedConstraints.length === 0 && riskLevel !== 'unacceptable',
            violatedConstraints,
            riskLevel,
            educationalFeedback: this.generateEducationalFeedback(violatedConstraints, discovery),
        };
    }
    /**
     * Force the LLM to calculate specific risk metrics based on discovered characteristics
     */
    getForcedCalculations(domainAssessment, action) {
        const baseCalculations = {
            worstCaseImpact: `If "${action}" fails completely, what's the specific impact?`,
            recoveryTime: `How long would it take to recover from the worst case scenario?`,
            alternativeCount: `How many alternative approaches exist to achieve the same goal?`,
            reversibilityCost: `What would it cost (time/money/effort) to reverse this action?`,
        };
        // Add calculations based on discovered characteristics
        const chars = domainAssessment.domainCharacteristics;
        if (chars.hasIrreversibleActions) {
            baseCalculations['permanentDamage'] =
                'What permanent damage could occur that cannot be fixed later?';
            baseCalculations['pointOfNoReturn'] =
                'At what point in this action does it become irreversible?';
        }
        if (chars.hasNetworkEffects) {
            baseCalculations['affectedParties'] =
                'How many other people/systems would be negatively affected if this fails?';
            baseCalculations['cascadeEffect'] = 'What cascade of failures could this trigger?';
        }
        if (chars.hasTimeDecay) {
            baseCalculations['optionExpiry'] =
                'When do current options expire or become significantly less valuable?';
            baseCalculations['decayRate'] = 'How quickly does the value/opportunity degrade over time?';
        }
        if (chars.requiresExpertise) {
            baseCalculations['expertiseGap'] =
                'What critical expertise is missing that could lead to failure?';
            baseCalculations['learningCurve'] =
                'How long would it take to acquire the necessary expertise?';
        }
        if (chars.hasRegulation) {
            baseCalculations['legalExposure'] =
                'What legal/regulatory penalties could result from failure?';
            baseCalculations['complianceViolations'] = 'Which specific regulations could be violated?';
        }
        if (chars.hasSocialConsequences) {
            baseCalculations['reputationDamage'] =
                'How would this affect reputation/credibility if it fails?';
            baseCalculations['trustRecovery'] =
                'How long would it take to rebuild trust after a failure?';
        }
        // Add calculations based on specific patterns in the domain
        if (domainAssessment.discoveredPatterns) {
            domainAssessment.discoveredPatterns.forEach((pattern, index) => {
                baseCalculations[`pattern_${index}_impact`] =
                    `Given the pattern "${pattern}", what specific risks does this create?`;
            });
        }
        return baseCalculations;
    }
    // Private helper methods
    /**
     * Extract entities (people, places, organizations) from NLP document
     */
    extractEntities(doc) {
        const entities = [];
        // Organizations
        if (doc.organizations) {
            const orgs = doc.organizations().out('array');
            entities.push(...orgs);
        }
        // People
        if (doc.people) {
            const people = doc.people().out('array');
            entities.push(...people);
        }
        // Places
        if (doc.places) {
            const places = doc.places().out('array');
            entities.push(...places);
        }
        return [...new Set(entities)];
    }
    /**
     * Extract topics and important nouns from NLP document
     */
    extractTopics(doc) {
        const topics = doc.topics ? doc.topics().out('array') : [];
        // Important nouns
        const nouns = doc.nouns ? doc.nouns().out('array') : [];
        const importantNouns = nouns.filter(n => n.length > 3 &&
            !['thing', 'things', 'something', 'anything', 'everything'].includes(n.toLowerCase()));
        topics.push(...importantNouns.slice(0, 10)); // Top 10 important nouns
        return [...new Set(topics)];
    }
    /**
     * Extract action verbs from NLP document
     */
    extractActionVerbs(doc) {
        const verbs = doc.verbs ? doc.verbs().out('array') : [];
        const actionVerbs = verbs
            .map(v => {
            const verbDoc = nlpTyped(v);
            if (verbDoc.verbs) {
                const vDoc = verbDoc.verbs();
                return vDoc.out('text');
            }
            return v;
        })
            .filter(v => v && v.length > 0);
        return [...new Set(actionVerbs)];
    }
    /**
     * Extract temporal expressions from NLP document
     */
    extractTemporalExpressions(doc) {
        const temporalExpressions = [];
        const dates = doc.dates ? doc.dates().out('array') : [];
        const durations = doc.match('#Duration').out('array');
        temporalExpressions.push(...dates, ...durations);
        return [...new Set(temporalExpressions)];
    }
    /**
     * Extract constraints and requirements from NLP document
     */
    extractConstraints(doc) {
        const constraints = [];
        const mustStatements = doc.match('(must|cannot|should not|never) #Verb').out('array');
        const requirements = doc.match('(require|need|necessary) #Noun').out('array');
        constraints.push(...mustStatements, ...requirements);
        return [...new Set(constraints)];
    }
    /**
     * Extract relationships between entities from NLP document
     */
    extractRelationships(doc) {
        const relationships = [];
        // Extract subject-verb-object patterns with multiple verb patterns
        const relationVerbs = [
            'affect',
            'affects',
            'impact',
            'impacts',
            'influence',
            'influences',
            'depend on',
            'depends on',
            'rely on',
            'relies on',
            'cause',
            'causes',
            'lead to',
            'leads to',
            'result in',
            'results in',
            'trigger',
            'triggers',
        ];
        // Build match patterns for each verb - handle multi-word nouns
        relationVerbs.forEach(verb => {
            // Try different noun patterns to catch compound nouns like "marketing team"
            const patterns = [
                ...doc
                    .match(`#Determiner? #Adjective? #Noun+ ${verb} #Determiner? #Adjective? #Noun+`)
                    .out('array'),
                ...doc.match(`#Noun ${verb} #Noun`).out('array'),
            ];
            patterns.forEach(pattern => {
                const words = pattern.split(/\s+/);
                // Find the verb position
                const verbWords = verb.split(/\s+/);
                let verbIndex = -1;
                for (let i = 0; i < words.length - verbWords.length + 1; i++) {
                    const slice = words.slice(i, i + verbWords.length).join(' ');
                    if (slice.toLowerCase() === verb.toLowerCase()) {
                        verbIndex = i;
                        break;
                    }
                }
                if (verbIndex > 0 && verbIndex < words.length - 1) {
                    const subject = words.slice(0, verbIndex).join(' ');
                    const object = words.slice(verbIndex + verbWords.length).join(' ');
                    if (subject && object) {
                        relationships.push({
                            subject: subject,
                            relation: verb,
                            object: object,
                        });
                    }
                }
            });
        });
        // Also check for "X which Y" or "X that Y" patterns
        const whichPatterns = doc.match('#Noun which #Verb #Noun').out('array');
        whichPatterns.forEach(pattern => {
            const words = pattern.split(/\s+/);
            if (words.length >= 4) {
                relationships.push({
                    subject: words[0],
                    relation: words.slice(1, -1).join(' '),
                    object: words[words.length - 1],
                });
            }
        });
        return relationships;
    }
    /**
     * Analyze text using Compromise NLP for generic risk features
     */
    analyzeWithNLP(text) {
        try {
            // Validate input
            if (!text || text.length > 10000) {
                throw new Error('Text input is empty or too large (max 10,000 characters)');
            }
            const doc = nlpTyped(text);
            // Use helper methods to extract different types of information
            const entities = this.extractEntities(doc);
            const topics = this.extractTopics(doc);
            const verbs = this.extractActionVerbs(doc);
            const temporalExpressions = this.extractTemporalExpressions(doc);
            const constraints = this.extractConstraints(doc);
            const relationships = this.extractRelationships(doc);
            return {
                entities,
                topics,
                verbs,
                temporalExpressions,
                constraints,
                relationships,
            };
        }
        catch (error) {
            // Return empty analysis on error rather than crashing
            console.error('NLP analysis failed:', error);
            return {
                entities: [],
                topics: [],
                verbs: [],
                temporalExpressions: [],
                constraints: [],
                relationships: [],
            };
        }
    }
    /**
     * Extract risk features using generic analysis
     */
    extractRiskFeatures(response, nlpAnalysis) {
        // Assess if actions can be undone
        const hasUndoableActions = this.detectUndoableActions(response, nlpAnalysis);
        // Assess time pressure
        const timePressure = this.assessTimePressure(response, nlpAnalysis.temporalExpressions);
        // Assess expertise gap
        const expertiseGap = this.assessExpertiseGap(response, nlpAnalysis);
        // Assess impact radius
        const impactRadius = this.assessImpactRadius(response, nlpAnalysis);
        // Assess uncertainty level
        const uncertaintyLevel = this.assessUncertainty(response);
        return {
            hasUndoableActions,
            timePressure,
            expertiseGap,
            impactRadius,
            uncertaintyLevel,
        };
    }
    /**
     * Sanitize input for safe regex matching
     */
    sanitizeForRegex(input) {
        // Escape special regex characters
        return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    /**
     * Extract context descriptor from LLM's response - completely open-ended
     */
    extractDomainFromDescription(response) {
        // Don't try to extract a "domain" - instead extract a context descriptor
        // This is whatever the LLM describes the situation as
        // Look for how the LLM describes the situation
        const contextPatterns = [
            /(?:domain|area|field):\s*([^.!?\n]+)/i, // Explicit domain declaration
            /this (?:is|involves?) (?:a |an |the )?([\w\s]{2,50}?)(?:\s+decision|\s+that|\s+involving|$)/i,
            /dealing with ([\w\s]{2,50})/i,
            /about ([\w\s]{2,50})/i,
            /considering ([\w\s]{2,50})/i,
        ];
        try {
            for (const pattern of contextPatterns) {
                const match = response.match(pattern);
                if (match && match[1]) {
                    // Keep the full description without trying to categorize
                    const context = match[1].trim();
                    if (context && context.length < 100) {
                        return context; // Return exactly what the LLM said, no categorization
                    }
                }
            }
        }
        catch (error) {
            // If regex fails, continue with fallback logic
            console.error('Regex pattern matching failed:', error);
        }
        try {
            // If no explicit domain, extract the main topic from the response
            const firstSentence = response.split(/[.!?]/)[0] || '';
            const doc = nlpTyped(firstSentence);
            const topics = doc.topics ? doc.topics().out('array') : [];
            if (topics.length > 0) {
                return topics[0].toLowerCase();
            }
            // Ultimate fallback - extract the main noun phrase
            const nouns = doc.nouns ? doc.nouns().out('array') : [];
            const significantNoun = nouns.find(n => n.length > 4 &&
                !['this', 'that', 'problem', 'issue', 'matter', 'question', 'decision'].includes(n.toLowerCase()));
            return significantNoun ? significantNoun.toLowerCase() : 'unspecified';
        }
        catch (error) {
            console.error('Failed to extract domain from response:', error);
            return 'unspecified';
        }
    }
    /**
     * Detect if actions can be undone based on language patterns
     */
    detectUndoableActions(response, nlpAnalysis) {
        const lower = response.toLowerCase();
        // Check for explicit irreversibility mentions
        const irreversiblePatterns = [
            'cannot be undone',
            'cannot be reversed',
            'irreversible',
            'permanent',
            'no going back',
            'final',
            'one-way',
            'point of no return',
        ];
        const hasIrreversible = irreversiblePatterns.some(pattern => lower.includes(pattern));
        // Check constraints for irreversibility
        const irreversibleConstraints = nlpAnalysis.constraints.some(c => c.toLowerCase().includes('cannot') &&
            (c.toLowerCase().includes('undo') || c.toLowerCase().includes('reverse')));
        return hasIrreversible || irreversibleConstraints;
    }
    /**
     * Assess time pressure from temporal expressions and urgency language
     */
    assessTimePressure(response, temporalExpressions) {
        const lower = response.toLowerCase();
        const allTemporal = temporalExpressions.join(' ').toLowerCase();
        // Critical pressure indicators
        if (lower.includes('immediately') ||
            lower.includes('right now') ||
            lower.includes('urgent') ||
            lower.includes('emergency') ||
            (allTemporal.includes('hour') &&
                !lower.includes('48 hours') &&
                !lower.includes('24 hours')) ||
            allTemporal.includes('minute')) {
            return 'critical';
        }
        // High pressure
        if (lower.includes('today') ||
            lower.includes('tomorrow') ||
            lower.includes('24 hours') ||
            lower.includes('48 hours') ||
            lower.includes('deadline') ||
            allTemporal.includes('day')) {
            return 'high';
        }
        // Medium pressure
        if (lower.includes('this week') ||
            lower.includes('next week') ||
            lower.includes('soon') ||
            allTemporal.includes('week')) {
            return 'medium';
        }
        // Low pressure
        if (lower.includes('this month') ||
            lower.includes('eventually') ||
            allTemporal.includes('month')) {
            return 'low';
        }
        return 'none';
    }
    /**
     * Assess expertise gap based on technical language and requirements
     */
    assessExpertiseGap(response, nlpAnalysis) {
        const lower = response.toLowerCase();
        let expertiseScore = 0;
        // Check for expertise requirements
        const expertiseIndicators = [
            'expertise',
            'expert',
            'specialized',
            'technical',
            'professional',
            'qualified',
            'certified',
            'experienced',
            'knowledge required',
        ];
        expertiseIndicators.forEach(indicator => {
            if (lower.includes(indicator)) {
                expertiseScore += 0.15;
            }
        });
        // Check constraints for expertise
        const expertiseConstraints = nlpAnalysis.constraints.filter(c => c.toLowerCase().includes('require') || c.toLowerCase().includes('need')).length;
        expertiseScore += expertiseConstraints * 0.1;
        // Complex vocabulary indicates expertise needed
        const complexWords = nlpAnalysis.topics.filter(t => t.length > 10).length;
        expertiseScore += complexWords * 0.05;
        return Math.min(1, expertiseScore);
    }
    /**
     * Assess impact radius based on relationships and network effects
     */
    assessImpactRadius(response, nlpAnalysis) {
        const lower = response.toLowerCase();
        // Check for systemic impact
        if (lower.includes('systemic') ||
            lower.includes('entire system') ||
            lower.includes('widespread') ||
            lower.includes('everyone')) {
            return 'systemic';
        }
        // Check for broad impact
        if (lower.includes('many people') ||
            lower.includes('multiple') ||
            lower.includes('various') ||
            lower.includes('several') ||
            nlpAnalysis.relationships.length > 3) {
            return 'broad';
        }
        // Check for limited impact
        if (lower.includes('few') || lower.includes('some') || nlpAnalysis.relationships.length > 0) {
            return 'limited';
        }
        // Default to self
        return 'self';
    }
    /**
     * Assess uncertainty level from language patterns
     */
    assessUncertainty(response) {
        const lower = response.toLowerCase();
        const uncertaintyIndicators = {
            high: ['unknown', 'unpredictable', 'uncertain', 'unclear', 'ambiguous', 'might', 'could'],
            medium: ['probably', 'likely', 'possibly', 'may', 'perhaps'],
            low: ['certain', 'definite', 'clear', 'obvious', 'guaranteed', 'will'],
        };
        let highCount = 0;
        let lowCount = 0;
        uncertaintyIndicators.high.forEach(indicator => {
            if (lower.includes(indicator))
                highCount++;
        });
        uncertaintyIndicators.low.forEach(indicator => {
            if (lower.includes(indicator))
                lowCount++;
        });
        if (highCount > lowCount)
            return 'high';
        if (lowCount > highCount)
            return 'low';
        return 'medium';
    }
    extractPrimaryDomain(response) {
        // Extract domain from LLM's own description rather than matching hardcoded list
        // Look for patterns like "this is a X domain" or "belongs to X"
        const domainPatterns = [
            /this (?:is|involves?)(?: a| an)?(?: clearly)? (\w+) (?:investment|decision|domain|area|field)/i,
            /(?:financial|medical|career|legal|technical|investment|health|relationship|educational) (?:domain|area|field|decision)/i,
            /this (?:is a|belongs to|relates to)(?: the)? (\w+) (?:domain|area|field)/i,
            /domain:?\s*(\w+)/i,
            /area:?\s*(\w+)/i,
            /field:?\s*(\w+)/i,
        ];
        // Domain always emerges from context - we don't force categorization
        // Then try pattern matching
        for (const pattern of domainPatterns) {
            const match = response.match(pattern);
            if (match && match[1]) {
                return match[1].toLowerCase();
            }
        }
        // Use NLP to extract meaningful domain label
        const doc = nlpTyped(response);
        // Extract nouns that could represent the domain
        const nouns = doc.nouns ? doc.nouns().out('array') : [];
        // Extract topics using NLP
        const topics = doc.topics ? doc.topics().out('array') : [];
        // Look for meaningful domain descriptors
        const meaningfulWords = [...nouns, ...topics]
            .filter(word => word.length > 3)
            .filter(word => {
            // Use NLP to filter out generic terms
            const wordDoc = nlpTyped(word);
            const isGeneric = wordDoc.has('#Determiner') || wordDoc.has('#Preposition') || wordDoc.has('#Conjunction');
            return !isGeneric;
        });
        // Return the first meaningful word as domain, or 'general'
        return meaningfulWords[0]?.toLowerCase() || 'general';
    }
    extractCharacteristics(response, nlpDoc) {
        const lower = response.toLowerCase();
        const doc = nlpDoc || nlpTyped(response);
        // Extract temporal expressions for better time horizon detection
        const dates = doc.dates ? doc.dates().out('array') : [];
        const durations = doc.match('#Duration').out('array') || [];
        // Look for negation patterns
        const negativeContexts = doc.match('(cannot|never|no) #Verb').out('array');
        const positiveRecovery = doc.match('(can|will|able to) recover').out('array');
        // Extract adjectives that might indicate characteristics
        const adjectives = doc.adjectives ? doc.adjectives().out('array') : [];
        // Extract each characteristic based on common patterns in responses
        return {
            hasIrreversibleActions: lower.includes('irreversible') ||
                lower.includes('permanent') ||
                lower.includes('cannot be undone') ||
                lower.includes('cannot be reversed') ||
                lower.includes('no going back') ||
                adjectives.some(adj => ['permanent', 'irreversible', 'final'].includes(adj.toLowerCase())),
            hasAbsorbingBarriers: lower.includes('no return') ||
                lower.includes('absorbing') ||
                lower.includes('trapped') ||
                lower.includes('stuck') ||
                negativeContexts.some(ctx => ctx.toLowerCase().includes('escape') || ctx.toLowerCase().includes('return')),
            allowsRecovery: !lower.includes('cannot recover') &&
                !lower.includes('no recovery') &&
                (lower.includes('can recover') ||
                    lower.includes('recoverable') ||
                    lower.includes('reversible') ||
                    positiveRecovery.length > 0),
            timeHorizon: this.extractTimeHorizonWithNLP(response, dates, durations),
            hasNetworkEffects: lower.includes('affect other') ||
                lower.includes('impact other') ||
                lower.includes('network') ||
                lower.includes('ripple') ||
                lower.includes('spread') ||
                lower.includes('contagion') ||
                doc.has('(affect|impact|influence) #Determiner? (other|others|people|systems)'),
            hasTimeDecay: lower.includes('time sensitive') ||
                lower.includes('expires') ||
                lower.includes('decay') ||
                lower.includes('deteriorate') ||
                lower.includes('degrade over time') ||
                durations.some(d => d.toLowerCase().includes('limit') || d.toLowerCase().includes('expire')),
            requiresExpertise: lower.includes('expertise') ||
                lower.includes('specialized knowledge') ||
                lower.includes('technical') ||
                lower.includes('professional') ||
                lower.includes('expert') ||
                doc.has('(require|need) #Determiner? (expertise|experience|knowledge|skill)'),
            hasRegulation: lower.includes('legal') ||
                lower.includes('regulatory') ||
                lower.includes('compliance') ||
                lower.includes('law') ||
                lower.includes('regulation') ||
                doc.has('(legal|regulatory|compliance) #Noun'),
            hasSocialConsequences: lower.includes('reputation') ||
                lower.includes('social') ||
                lower.includes('relationship') ||
                lower.includes('trust') ||
                lower.includes('credibility') ||
                doc.has('(damage|affect|impact) #Determiner? (reputation|relationship|trust)'),
        };
    }
    extractTimeHorizon(response) {
        if (response.includes('immediate') || response.includes('instant'))
            return 'immediate';
        if (response.includes('days') || response.includes('weeks'))
            return 'short';
        if (response.includes('months'))
            return 'medium';
        return 'long';
    }
    extractTimeHorizonWithNLP(response, dates, durations) {
        const lower = response.toLowerCase();
        // Check durations found by NLP
        const allTimePhrases = [...dates, ...durations].join(' ').toLowerCase();
        // Immediate indicators
        if (lower.includes('immediate') ||
            lower.includes('instant') ||
            lower.includes('right away') ||
            lower.includes('right now') ||
            lower.includes('48 hours') ||
            lower.includes('24 hours') ||
            lower.includes('next few hours') ||
            allTimePhrases.includes('second') ||
            allTimePhrases.includes('minute') ||
            allTimePhrases.includes('hour')) {
            return 'immediate';
        }
        // Short-term indicators
        if (lower.includes('days') ||
            lower.includes('weeks') ||
            lower.includes('short term') ||
            allTimePhrases.includes('day') ||
            allTimePhrases.includes('week')) {
            return 'short';
        }
        // Medium-term indicators
        if (lower.includes('months') ||
            lower.includes('quarter') ||
            lower.includes('medium term') ||
            allTimePhrases.includes('month')) {
            return 'medium';
        }
        // Long-term indicators
        if (lower.includes('years') ||
            lower.includes('decade') ||
            lower.includes('long term') ||
            allTimePhrases.includes('year')) {
            return 'long';
        }
        // Default based on presence of any time references
        return durations.length > 0 ? 'medium' : 'long';
    }
    assessConfidence(response, riskFeatures) {
        // Higher confidence if response is detailed and specific
        const wordCount = response.split(' ').length;
        const hasSpecifics = /\d+%|\$\d+|specific|exactly|precisely/.test(response);
        const hasUncertainty = /maybe|perhaps|possibly|might|could/.test(response.toLowerCase());
        let confidence = Math.min(wordCount / 100, 0.5); // Base confidence from detail
        if (hasSpecifics)
            confidence += 0.2;
        if (hasUncertainty)
            confidence -= 0.1;
        // Adjust confidence based on risk feature clarity
        if (riskFeatures) {
            // Clear time pressure increases confidence
            if (riskFeatures.timePressure && riskFeatures.timePressure !== 'none') {
                confidence += 0.1;
            }
            // High uncertainty reduces confidence
            if (riskFeatures.uncertaintyLevel === 'high') {
                confidence -= 0.15;
            }
            else if (riskFeatures.uncertaintyLevel === 'low') {
                confidence += 0.1;
            }
            // Clear impact assessment increases confidence
            if (riskFeatures.impactRadius && riskFeatures.impactRadius !== 'self') {
                confidence += 0.05;
            }
        }
        return Math.max(0.1, Math.min(1, confidence));
    }
    extractRisks(response) {
        // This would parse structured risks from the response
        // For now, return a placeholder structure
        const risks = [];
        if (response.toLowerCase().includes('bankrupt') || response.toLowerCase().includes('ruin')) {
            risks.push({
                risk: 'Complete financial ruin',
                reversibility: 'irreversible',
                impactMagnitude: 'catastrophic',
            });
        }
        if (response.toLowerCase().includes('permanent') ||
            response.toLowerCase().includes('irreversible')) {
            risks.push({
                risk: 'Irreversible loss or damage',
                reversibility: 'irreversible',
                impactMagnitude: 'severe',
            });
        }
        return risks;
    }
    extractSafetyPractices(response) {
        const practices = [];
        // Look for common safety practice patterns
        const practicePatterns = [
            /never\s+(?:risk|invest|commit)\s+more\s+than\s+(\d+%)/gi,
            /always\s+(?:maintain|keep|have)\s+(.+)/gi,
            /maximum\s+(?:position|exposure|risk)\s+(?:should be|is)\s+(.+)/gi,
            /(?:experts|professionals)\s+(?:recommend|suggest|advise)\s+(.+)/gi,
        ];
        practicePatterns.forEach(pattern => {
            const matches = response.matchAll(pattern);
            for (const match of matches) {
                practices.push(match[0]);
            }
        });
        return practices;
    }
    extractMaxLoss(response) {
        const lossPattern = /maximum\s+(?:acceptable|safe)\s+(?:loss|exposure|risk)[\s\S]{0,20}(\d+%|\$[\d,]+)/i;
        const match = response.match(lossPattern);
        return match ? match[1] : undefined;
    }
    actionViolatesPractice(action, practice) {
        // This would check if the proposed action violates a discovered practice
        // For example, if practice says "never risk more than 10%" and action suggests 50%
        const practiceLimit = this.extractNumericLimit(practice);
        const actionAmount = this.extractNumericAmount(action);
        if (practiceLimit !== null && actionAmount !== null) {
            return actionAmount > practiceLimit;
        }
        return false;
    }
    extractNumericLimit(text) {
        const match = text.match(/(\d+)%/);
        return match ? parseInt(match[1]) : null;
    }
    extractNumericAmount(text) {
        const match = text.match(/(\d+)%/);
        return match ? parseInt(match[1]) : null;
    }
    assessRiskLevel(action, discovery, scenarios) {
        // Count severe/catastrophic risks
        const severeRisks = discovery.identifiedRisks.filter(r => r.impactMagnitude === 'severe' || r.impactMagnitude === 'catastrophic').length;
        // Check if any ruin scenarios are triggered
        const triggeredScenarios = scenarios.filter(s => s.triggers.some(trigger => action.toLowerCase().includes(trigger.toLowerCase()))).length;
        if (triggeredScenarios > 0 || severeRisks > 2)
            return 'unacceptable';
        if (severeRisks > 0)
            return 'high';
        if (discovery.identifiedRisks.length > 3)
            return 'medium';
        return 'low';
    }
    generateEducationalFeedback(violations, discovery) {
        if (violations.length === 0)
            return '';
        return `Your recommendation violates the following safety practices you identified:
${violations.map((v, i) => `${i + 1}. ${v}`).join('\n')}

Remember: In ${discovery.domain}, ${discovery.maxAcceptableLoss
            ? `you determined the maximum acceptable loss is ${discovery.maxAcceptableLoss}`
            : 'these constraints exist to prevent ruin'}.

Consider revising your recommendation to respect these discovered limits.`;
    }
    /**
     * Extract patterns from domain analysis response
     */
    extractPatterns(response) {
        const patterns = [];
        // Look for pattern indicators in the response
        const patternIndicators = [
            /patterns?\s*[:]\s*([^\n]+)/gi,
            /notice(?:d)?\s+that\s+([^\n]+)/gi,
            /typically\s+([^\n]+)/gi,
            /tends?\s+to\s+([^\n]+)/gi,
            /usually\s+([^\n]+)/gi,
            /often\s+([^\n]+)/gi,
            /common(?:ly)?\s+([^\n]+)/gi,
            /characteristic(?:ally)?\s+([^\n]+)/gi,
        ];
        patternIndicators.forEach(regex => {
            const matches = response.matchAll(regex);
            for (const match of matches) {
                if (match[1] && match[1].length > 10) {
                    patterns.push(match[1].trim());
                }
            }
        });
        // Also look for numbered patterns
        const numberedPattern = /^\d{1,3}\.\s{1,3}([^:\n]{1,200}):\s{1,3}([^\n]{1,500})/gm;
        const numberedMatches = response.matchAll(numberedPattern);
        for (const match of numberedMatches) {
            if (match[2] && match[2].toLowerCase().includes('pattern')) {
                patterns.push(match[2].trim());
            }
        }
        return [...new Set(patterns)]; // Remove duplicates
    }
    /**
     * Get session-specific discovered risks (not cached by domain)
     */
    getSessionDiscovery(sessionData) {
        // Return discovery from current session, not from domain cache
        return sessionData?.riskDiscoveryData?.risks;
    }
    /**
     * Assess risk severity based on generic characteristics
     */
    assessRiskSeverity(characteristics) {
        let severityScore = 0;
        // Each characteristic contributes to overall risk
        if (characteristics.hasIrreversibleActions)
            severityScore += 3;
        if (characteristics.hasAbsorbingBarriers)
            severityScore += 3;
        if (!characteristics.allowsRecovery)
            severityScore += 2;
        if (characteristics.timeHorizon === 'immediate')
            severityScore += 2;
        if (characteristics.hasNetworkEffects)
            severityScore += 1;
        if (characteristics.hasTimeDecay)
            severityScore += 1;
        if (characteristics.requiresExpertise)
            severityScore += 1;
        if (characteristics.hasRegulation)
            severityScore += 2;
        if (characteristics.hasSocialConsequences)
            severityScore += 1;
        // Map score to severity level
        if (severityScore >= 12)
            return RiskSeverity.CATASTROPHIC;
        if (severityScore >= 9)
            return RiskSeverity.CRITICAL;
        if (severityScore >= 6)
            return RiskSeverity.HIGH;
        if (severityScore >= 3)
            return RiskSeverity.MEDIUM;
        return RiskSeverity.LOW;
    }
    /**
     * Generate adaptive questions based on discovered characteristics
     */
    getAdaptiveQuestions(assessment) {
        const questions = [];
        const chars = assessment.domainCharacteristics;
        if (chars.hasIrreversibleActions) {
            questions.push('What specific actions would be irreversible and why?');
            questions.push('What safeguards exist to prevent accidental irreversible actions?');
        }
        if (chars.hasNetworkEffects) {
            questions.push('How would failure cascade through connected systems or relationships?');
            questions.push('What firebreaks exist to contain potential damage?');
        }
        if (chars.requiresExpertise) {
            questions.push('What expertise gaps could lead to critical errors?');
            questions.push('How can you verify you have sufficient expertise before proceeding?');
        }
        if (chars.hasTimeDecay) {
            questions.push('What is the rate of value decay or option expiration?');
            questions.push('What triggers or accelerates the time decay?');
        }
        return questions;
    }
}
//# sourceMappingURL=RuinRiskDiscovery.js.map