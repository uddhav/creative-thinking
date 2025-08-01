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
import type { CompromiseDoc, CompromiseLibrary } from './nlp-types.js';

// Type assertion for the nlp library
const nlpTyped = nlp as CompromiseLibrary;

/**
 * Risk severity levels based on generic characteristics
 */
export enum RiskSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  CATASTROPHIC = 'catastrophic',
}

/**
 * Generic domain characteristics discovered through questioning
 */
export interface DomainCharacteristics {
  hasIrreversibleActions: boolean;
  hasAbsorbingBarriers: boolean;
  allowsRecovery: boolean;
  timeHorizon: 'immediate' | 'short' | 'medium' | 'long';
  hasNetworkEffects: boolean; // Actions affect others
  hasTimeDecay: boolean; // Value/options decrease over time
  requiresExpertise: boolean; // Domain needs specialized knowledge
  hasRegulation: boolean; // Legal/regulatory constraints
  hasSocialConsequences: boolean; // Reputation/relationship impacts
}

/**
 * Result of domain identification by the LLM
 */
export interface DomainAssessment {
  primaryDomain: string; // Domain as described by LLM, not categorized
  subDomains?: string[];
  domainCharacteristics: DomainCharacteristics;
  confidence: number; // 0-1
  discoveredPatterns?: string[]; // Patterns the LLM identified
  nlpAnalysis?: {
    entities: string[];
    topics: string[];
    verbs: string[];
    temporalExpressions: string[];
    constraints: string[];
    relationships: Array<{
      subject: string;
      relation: string;
      object: string;
    }>;
  };
  riskFeatures?: {
    hasUndoableActions: boolean;
    timePressure: 'none' | 'low' | 'medium' | 'high' | 'critical';
    expertiseGap: number; // 0-1 scale
    impactRadius: 'self' | 'limited' | 'broad' | 'systemic';
    uncertaintyLevel: 'low' | 'medium' | 'high';
  };
}

/**
 * Discovered risks in a specific domain
 */
export interface RiskDiscovery {
  domain: string;
  identifiedRisks: Array<{
    risk: string;
    reversibility: 'reversible' | 'difficult' | 'irreversible';
    impactMagnitude: 'minor' | 'moderate' | 'severe' | 'catastrophic';
    likelihood?: 'rare' | 'unlikely' | 'possible' | 'likely' | 'certain';
  }>;
  domainSpecificSafetyPractices: string[];
  maxAcceptableLoss?: string;
  recoveryMechanisms?: string[];
}

/**
 * Ruin scenario discovered by the LLM
 */
export interface RuinScenario {
  scenario: string;
  triggers: string[];
  consequences: string[];
  recoveryPossible: boolean;
  timeToRuin?: string;
  warningSignals?: string[];
}

/**
 * Result of validating an action against discovered risks
 */
export interface ValidationResult {
  isValid: boolean;
  violatedConstraints: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'unacceptable';
  requiredMitigations?: string[];
  alternativeActions?: string[];
  educationalFeedback?: string;
}

/**
 * Structured prompts for discovery phases
 */
export interface DiscoveryPrompts {
  domainIdentification: string;
  riskDiscovery: string;
  ruinScenarios: string;
  safetyPractices: string;
  maxAcceptableLoss: string;
  validation: string;
}

/**
 * Main discovery framework that guides LLMs through risk identification
 */
export class RuinRiskDiscovery {
  private discoveryHistory: Map<string, RiskDiscovery> = new Map();

  /**
   * Get structured prompts for the discovery process - adaptive version
   */
  getDiscoveryPrompts(problem: string, proposedAction?: string): DiscoveryPrompts {
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
  processDomainAssessment(response: string): DomainAssessment {
    // Cache the NLP doc to avoid reprocessing
    let nlpDoc: CompromiseDoc | undefined;
    try {
      nlpDoc = nlpTyped(response) as CompromiseDoc;
    } catch (error) {
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
  processRiskDiscovery(domain: string, response: string): RiskDiscovery {
    const discovery: RiskDiscovery = {
      domain,
      identifiedRisks: this.extractRisks(response),
      domainSpecificSafetyPractices: this.extractSafetyPractices(response),
      maxAcceptableLoss: this.extractMaxLoss(response),
    };

    // Cache for future reference
    this.discoveryHistory.set(domain, discovery);

    return discovery;
  }

  /**
   * Validate an action against discovered risks
   */
  validateAgainstDiscoveredRisks(
    action: string,
    discovery: RiskDiscovery,
    ruinScenarios: RuinScenario[]
  ): ValidationResult {
    const violatedConstraints: string[] = [];

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
  getForcedCalculations(
    domainAssessment: DomainAssessment,
    action: string
  ): Record<string, string> {
    const baseCalculations: Record<string, string> = {
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
  private extractEntities(doc: CompromiseDoc): string[] {
    const entities: string[] = [];

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
  private extractTopics(doc: CompromiseDoc): string[] {
    const topics = doc.topics ? doc.topics().out('array') : [];

    // Important nouns
    const nouns = doc.nouns ? doc.nouns().out('array') : [];
    const importantNouns = nouns.filter(
      n =>
        n.length > 3 &&
        !['thing', 'things', 'something', 'anything', 'everything'].includes(n.toLowerCase())
    );
    topics.push(...importantNouns.slice(0, 10)); // Top 10 important nouns

    return [...new Set(topics)];
  }

  /**
   * Extract action verbs from NLP document
   */
  private extractActionVerbs(doc: CompromiseDoc): string[] {
    const verbs = doc.verbs ? doc.verbs().out('array') : [];
    const actionVerbs = verbs
      .map(v => {
        const verbDoc = nlpTyped(v) as CompromiseDoc;
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
  private extractTemporalExpressions(doc: CompromiseDoc): string[] {
    const temporalExpressions: string[] = [];
    const dates = doc.dates ? doc.dates().out('array') : [];
    const durations = doc.match('#Duration').out('array');
    temporalExpressions.push(...dates, ...durations);

    return [...new Set(temporalExpressions)];
  }

  /**
   * Extract constraints and requirements from NLP document
   */
  private extractConstraints(doc: CompromiseDoc): string[] {
    const constraints: string[] = [];
    const mustStatements = doc.match('(must|cannot|should not|never) #Verb').out('array');
    const requirements = doc.match('(require|need|necessary) #Noun').out('array');
    constraints.push(...mustStatements, ...requirements);

    return [...new Set(constraints)];
  }

  /**
   * Extract relationships between entities from NLP document
   */
  private extractRelationships(doc: CompromiseDoc): Array<{ subject: string; relation: string; object: string }> {
    const relationships: Array<{ subject: string; relation: string; object: string }> = [];

    // Extract subject-verb-object patterns with multiple verb patterns
    const relationVerbs = [
      'affect', 'affects', 'impact', 'impacts', 'influence', 'influences',
      'depend on', 'depends on', 'rely on', 'relies on', 'cause', 'causes',
      'lead to', 'leads to', 'result in', 'results in', 'trigger', 'triggers',
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
  private analyzeWithNLP(text: string): NonNullable<DomainAssessment['nlpAnalysis']> {
    try {
      // Validate input
      if (!text || text.length > 10000) {
        throw new Error('Text input is empty or too large (max 10,000 characters)');
      }

      const doc = nlpTyped(text) as CompromiseDoc;

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
    } catch (error) {
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
  private extractRiskFeatures(
    response: string,
    nlpAnalysis: NonNullable<DomainAssessment['nlpAnalysis']>
  ): NonNullable<DomainAssessment['riskFeatures']> {
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
   * Extract domain from LLM's description without categorization
   */
  private extractDomainFromDescription(response: string): string {
    try {
    // Look for explicit domain mentions
    const domainPatterns = [
      /this (?:is|involves?|relates to|concerns?)(?: a| an| the)? ([^.!?]+) (?:domain|area|field|decision|problem)/i,
      /in the (?:domain|area|field) of ([^.!?]+)/i,
      /(?:domain|area|field):\s*([^.!?\n]+)/i,
    ];

    for (const pattern of domainPatterns) {
      const match = response.match(pattern);
      if (match && match[1]) {
        // Clean up the match - remove articles and extra words
        const domain = match[1]
          .replace(/^(a|an|the)\s+/i, '')
          .replace(/\s+(domain|area|field|decision|problem)$/i, '')
          .trim();

        if (domain && domain.length < 50) {
          // Reasonable length for a domain name
          return domain.toLowerCase();
        }
      }
    }

    // If no explicit domain, extract the main topic from the response
    const firstSentence = response.split(/[.!?]/)[0] || '';
    const doc = nlpTyped(firstSentence) as CompromiseDoc;
    const topics = doc.topics ? doc.topics().out('array') : [];

    if (topics.length > 0) {
      return topics[0].toLowerCase();
    }

    // Ultimate fallback - extract the main noun phrase
    const nouns = doc.nouns ? doc.nouns().out('array') : [];
    const significantNoun = nouns.find(
      n =>
        n.length > 4 &&
        !['this', 'that', 'problem', 'issue', 'matter', 'question', 'decision'].includes(
          n.toLowerCase()
        )
    );

    return significantNoun ? significantNoun.toLowerCase() : 'unspecified';
    } catch (error) {
      console.error('Failed to extract domain from response:', error);
      return 'unspecified';
    }
  }

  /**
   * Detect if actions can be undone based on language patterns
   */
  private detectUndoableActions(
    response: string,
    nlpAnalysis: NonNullable<DomainAssessment['nlpAnalysis']>
  ): boolean {
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
    const irreversibleConstraints = nlpAnalysis.constraints.some(
      c =>
        c.toLowerCase().includes('cannot') &&
        (c.toLowerCase().includes('undo') || c.toLowerCase().includes('reverse'))
    );

    return hasIrreversible || irreversibleConstraints;
  }

  /**
   * Assess time pressure from temporal expressions and urgency language
   */
  private assessTimePressure(
    response: string,
    temporalExpressions: string[]
  ): NonNullable<DomainAssessment['riskFeatures']>['timePressure'] {
    const lower = response.toLowerCase();
    const allTemporal = temporalExpressions.join(' ').toLowerCase();

    // Critical pressure indicators
    if (
      lower.includes('immediately') ||
      lower.includes('right now') ||
      lower.includes('urgent') ||
      lower.includes('emergency') ||
      (allTemporal.includes('hour') &&
        !lower.includes('48 hours') &&
        !lower.includes('24 hours')) ||
      allTemporal.includes('minute')
    ) {
      return 'critical';
    }

    // High pressure
    if (
      lower.includes('today') ||
      lower.includes('tomorrow') ||
      lower.includes('24 hours') ||
      lower.includes('48 hours') ||
      lower.includes('deadline') ||
      allTemporal.includes('day')
    ) {
      return 'high';
    }

    // Medium pressure
    if (
      lower.includes('this week') ||
      lower.includes('next week') ||
      lower.includes('soon') ||
      allTemporal.includes('week')
    ) {
      return 'medium';
    }

    // Low pressure
    if (
      lower.includes('this month') ||
      lower.includes('eventually') ||
      allTemporal.includes('month')
    ) {
      return 'low';
    }

    return 'none';
  }

  /**
   * Assess expertise gap based on technical language and requirements
   */
  private assessExpertiseGap(
    response: string,
    nlpAnalysis: NonNullable<DomainAssessment['nlpAnalysis']>
  ): number {
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
    const expertiseConstraints = nlpAnalysis.constraints.filter(
      c => c.toLowerCase().includes('require') || c.toLowerCase().includes('need')
    ).length;

    expertiseScore += expertiseConstraints * 0.1;

    // Complex vocabulary indicates expertise needed
    const complexWords = nlpAnalysis.topics.filter(t => t.length > 10).length;
    expertiseScore += complexWords * 0.05;

    return Math.min(1, expertiseScore);
  }

  /**
   * Assess impact radius based on relationships and network effects
   */
  private assessImpactRadius(
    response: string,
    nlpAnalysis: NonNullable<DomainAssessment['nlpAnalysis']>
  ): NonNullable<DomainAssessment['riskFeatures']>['impactRadius'] {
    const lower = response.toLowerCase();

    // Check for systemic impact
    if (
      lower.includes('systemic') ||
      lower.includes('entire system') ||
      lower.includes('widespread') ||
      lower.includes('everyone')
    ) {
      return 'systemic';
    }

    // Check for broad impact
    if (
      lower.includes('many people') ||
      lower.includes('multiple') ||
      lower.includes('various') ||
      lower.includes('several') ||
      nlpAnalysis.relationships.length > 3
    ) {
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
  private assessUncertainty(
    response: string
  ): NonNullable<DomainAssessment['riskFeatures']>['uncertaintyLevel'] {
    const lower = response.toLowerCase();

    const uncertaintyIndicators = {
      high: ['unknown', 'unpredictable', 'uncertain', 'unclear', 'ambiguous', 'might', 'could'],
      medium: ['probably', 'likely', 'possibly', 'may', 'perhaps'],
      low: ['certain', 'definite', 'clear', 'obvious', 'guaranteed', 'will'],
    };

    let highCount = 0;
    let lowCount = 0;

    uncertaintyIndicators.high.forEach(indicator => {
      if (lower.includes(indicator)) highCount++;
    });

    uncertaintyIndicators.low.forEach(indicator => {
      if (lower.includes(indicator)) lowCount++;
    });

    if (highCount > lowCount) return 'high';
    if (lowCount > highCount) return 'low';
    return 'medium';
  }

  private extractPrimaryDomain(response: string): string {
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
    const doc = nlpTyped(response) as CompromiseDoc;

    // Extract nouns that could represent the domain
    const nouns = (doc.nouns ? doc.nouns().out('array') : []) as string[];

    // Extract topics using NLP
    const topics = (doc.topics ? doc.topics().out('array') : []) as string[];

    // Look for meaningful domain descriptors
    const meaningfulWords = [...nouns, ...topics]
      .filter(word => word.length > 3)
      .filter(word => {
        // Use NLP to filter out generic terms
        const wordDoc = nlpTyped(word) as CompromiseDoc;
        const isGeneric =
          wordDoc.has('#Determiner') || wordDoc.has('#Preposition') || wordDoc.has('#Conjunction');
        return !isGeneric;
      });

    // Return the first meaningful word as domain, or 'general'
    return meaningfulWords[0]?.toLowerCase() || 'general';
  }

  private extractCharacteristics(response: string, nlpDoc?: CompromiseDoc): DomainAssessment['domainCharacteristics'] {
    const lower = response.toLowerCase();
    const doc = nlpDoc || (nlpTyped(response) as CompromiseDoc);

    // Extract temporal expressions for better time horizon detection
    const docTyped = doc as {
      dates?: () => { out: (format: string) => string[] };
      adjectives?: () => { out: (format: string) => string[] };
    };
    const dates = docTyped.dates ? docTyped.dates().out('array') : [];
    const durations = (doc.match('#Duration').out('array') || []) as string[];

    // Look for negation patterns
    const negativeContexts = doc.match('(cannot|never|no) #Verb').out('array') as string[];
    const positiveRecovery = doc.match('(can|will|able to) recover').out('array') as string[];

    // Extract adjectives that might indicate characteristics
    const adjectives = docTyped.adjectives ? docTyped.adjectives().out('array') : [];

    // Extract each characteristic based on common patterns in responses
    return {
      hasIrreversibleActions:
        lower.includes('irreversible') ||
        lower.includes('permanent') ||
        lower.includes('cannot be undone') ||
        lower.includes('cannot be reversed') ||
        lower.includes('no going back') ||
        adjectives.some(adj => ['permanent', 'irreversible', 'final'].includes(adj.toLowerCase())),

      hasAbsorbingBarriers:
        lower.includes('no return') ||
        lower.includes('absorbing') ||
        lower.includes('trapped') ||
        lower.includes('stuck') ||
        negativeContexts.some(
          ctx => ctx.toLowerCase().includes('escape') || ctx.toLowerCase().includes('return')
        ),

      allowsRecovery:
        !lower.includes('cannot recover') &&
        !lower.includes('no recovery') &&
        (lower.includes('can recover') ||
          lower.includes('recoverable') ||
          lower.includes('reversible') ||
          positiveRecovery.length > 0),

      timeHorizon: this.extractTimeHorizonWithNLP(response, dates, durations),

      hasNetworkEffects:
        lower.includes('affect other') ||
        lower.includes('impact other') ||
        lower.includes('network') ||
        lower.includes('ripple') ||
        lower.includes('spread') ||
        lower.includes('contagion') ||
        doc.has('(affect|impact|influence) #Determiner? (other|others|people|systems)'),

      hasTimeDecay:
        lower.includes('time sensitive') ||
        lower.includes('expires') ||
        lower.includes('decay') ||
        lower.includes('deteriorate') ||
        lower.includes('degrade over time') ||
        durations.some(
          d => d.toLowerCase().includes('limit') || d.toLowerCase().includes('expire')
        ),

      requiresExpertise:
        lower.includes('expertise') ||
        lower.includes('specialized knowledge') ||
        lower.includes('technical') ||
        lower.includes('professional') ||
        lower.includes('expert') ||
        doc.has('(require|need) #Determiner? (expertise|experience|knowledge|skill)'),

      hasRegulation:
        lower.includes('legal') ||
        lower.includes('regulatory') ||
        lower.includes('compliance') ||
        lower.includes('law') ||
        lower.includes('regulation') ||
        doc.has('(legal|regulatory|compliance) #Noun'),

      hasSocialConsequences:
        lower.includes('reputation') ||
        lower.includes('social') ||
        lower.includes('relationship') ||
        lower.includes('trust') ||
        lower.includes('credibility') ||
        doc.has('(damage|affect|impact) #Determiner? (reputation|relationship|trust)'),
    };
  }

  private extractTimeHorizon(response: string): 'immediate' | 'short' | 'medium' | 'long' {
    if (response.includes('immediate') || response.includes('instant')) return 'immediate';
    if (response.includes('days') || response.includes('weeks')) return 'short';
    if (response.includes('months')) return 'medium';
    return 'long';
  }

  private extractTimeHorizonWithNLP(
    response: string,
    dates: string[],
    durations: string[]
  ): 'immediate' | 'short' | 'medium' | 'long' {
    const lower = response.toLowerCase();

    // Check durations found by NLP
    const allTimePhrases = [...dates, ...durations].join(' ').toLowerCase();

    // Immediate indicators
    if (
      lower.includes('immediate') ||
      lower.includes('instant') ||
      lower.includes('right away') ||
      lower.includes('right now') ||
      lower.includes('48 hours') ||
      lower.includes('24 hours') ||
      lower.includes('next few hours') ||
      allTimePhrases.includes('second') ||
      allTimePhrases.includes('minute') ||
      allTimePhrases.includes('hour')
    ) {
      return 'immediate';
    }

    // Short-term indicators
    if (
      lower.includes('days') ||
      lower.includes('weeks') ||
      lower.includes('short term') ||
      allTimePhrases.includes('day') ||
      allTimePhrases.includes('week')
    ) {
      return 'short';
    }

    // Medium-term indicators
    if (
      lower.includes('months') ||
      lower.includes('quarter') ||
      lower.includes('medium term') ||
      allTimePhrases.includes('month')
    ) {
      return 'medium';
    }

    // Long-term indicators
    if (
      lower.includes('years') ||
      lower.includes('decade') ||
      lower.includes('long term') ||
      allTimePhrases.includes('year')
    ) {
      return 'long';
    }

    // Default based on presence of any time references
    return durations.length > 0 ? 'medium' : 'long';
  }

  private assessConfidence(
    response: string,
    riskFeatures?: DomainAssessment['riskFeatures']
  ): number {
    // Higher confidence if response is detailed and specific
    const wordCount = response.split(' ').length;
    const hasSpecifics = /\d+%|\$\d+|specific|exactly|precisely/.test(response);
    const hasUncertainty = /maybe|perhaps|possibly|might|could/.test(response.toLowerCase());

    let confidence = Math.min(wordCount / 100, 0.5); // Base confidence from detail
    if (hasSpecifics) confidence += 0.2;
    if (hasUncertainty) confidence -= 0.1;

    // Adjust confidence based on risk feature clarity
    if (riskFeatures) {
      // Clear time pressure increases confidence
      if (riskFeatures.timePressure && riskFeatures.timePressure !== 'none') {
        confidence += 0.1;
      }

      // High uncertainty reduces confidence
      if (riskFeatures.uncertaintyLevel === 'high') {
        confidence -= 0.15;
      } else if (riskFeatures.uncertaintyLevel === 'low') {
        confidence += 0.1;
      }

      // Clear impact assessment increases confidence
      if (riskFeatures.impactRadius && riskFeatures.impactRadius !== 'self') {
        confidence += 0.05;
      }
    }

    return Math.max(0.1, Math.min(1, confidence));
  }

  private extractRisks(response: string): RiskDiscovery['identifiedRisks'] {
    // This would parse structured risks from the response
    // For now, return a placeholder structure
    const risks = [];

    if (response.toLowerCase().includes('bankrupt') || response.toLowerCase().includes('ruin')) {
      risks.push({
        risk: 'Complete financial ruin',
        reversibility: 'irreversible' as const,
        impactMagnitude: 'catastrophic' as const,
      });
    }

    if (
      response.toLowerCase().includes('permanent') ||
      response.toLowerCase().includes('irreversible')
    ) {
      risks.push({
        risk: 'Irreversible loss or damage',
        reversibility: 'irreversible' as const,
        impactMagnitude: 'severe' as const,
      });
    }

    return risks;
  }

  private extractSafetyPractices(response: string): string[] {
    const practices: string[] = [];

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

  private extractMaxLoss(response: string): string | undefined {
    const lossPattern =
      /maximum\s+(?:acceptable|safe)\s+(?:loss|exposure|risk)[\s\S]{0,20}(\d+%|\$[\d,]+)/i;
    const match = response.match(lossPattern);
    return match ? match[1] : undefined;
  }

  private actionViolatesPractice(action: string, practice: string): boolean {
    // This would check if the proposed action violates a discovered practice
    // For example, if practice says "never risk more than 10%" and action suggests 50%

    const practiceLimit = this.extractNumericLimit(practice);
    const actionAmount = this.extractNumericAmount(action);

    if (practiceLimit !== null && actionAmount !== null) {
      return actionAmount > practiceLimit;
    }

    return false;
  }

  private extractNumericLimit(text: string): number | null {
    const match = text.match(/(\d+)%/);
    return match ? parseInt(match[1]) : null;
  }

  private extractNumericAmount(text: string): number | null {
    const match = text.match(/(\d+)%/);
    return match ? parseInt(match[1]) : null;
  }

  private assessRiskLevel(
    action: string,
    discovery: RiskDiscovery,
    scenarios: RuinScenario[]
  ): ValidationResult['riskLevel'] {
    // Count severe/catastrophic risks
    const severeRisks = discovery.identifiedRisks.filter(
      r => r.impactMagnitude === 'severe' || r.impactMagnitude === 'catastrophic'
    ).length;

    // Check if any ruin scenarios are triggered
    const triggeredScenarios = scenarios.filter(s =>
      s.triggers.some(trigger => action.toLowerCase().includes(trigger.toLowerCase()))
    ).length;

    if (triggeredScenarios > 0 || severeRisks > 2) return 'unacceptable';
    if (severeRisks > 0) return 'high';
    if (discovery.identifiedRisks.length > 3) return 'medium';
    return 'low';
  }

  private generateEducationalFeedback(violations: string[], discovery: RiskDiscovery): string {
    if (violations.length === 0) return '';

    return `Your recommendation violates the following safety practices you identified:
${violations.map((v, i) => `${i + 1}. ${v}`).join('\n')}

Remember: In ${discovery.domain}, ${
      discovery.maxAcceptableLoss
        ? `you determined the maximum acceptable loss is ${discovery.maxAcceptableLoss}`
        : 'these constraints exist to prevent ruin'
    }.

Consider revising your recommendation to respect these discovered limits.`;
  }

  /**
   * Extract patterns from domain analysis response
   */
  private extractPatterns(response: string): string[] {
    const patterns: string[] = [];

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
    const numberedPattern = /\d+\.\s*([^:]+):\s*([^\n]+)/g;
    const numberedMatches = response.matchAll(numberedPattern);
    for (const match of numberedMatches) {
      if (match[2] && match[2].toLowerCase().includes('pattern')) {
        patterns.push(match[2].trim());
      }
    }

    return [...new Set(patterns)]; // Remove duplicates
  }

  /**
   * Get previously discovered risks for a domain (if any)
   */
  getCachedDiscovery(domain: string): RiskDiscovery | undefined {
    return this.discoveryHistory.get(domain);
  }

  /**
   * Assess risk severity based on generic characteristics
   */
  assessRiskSeverity(characteristics: DomainCharacteristics): RiskSeverity {
    let severityScore = 0;

    // Each characteristic contributes to overall risk
    if (characteristics.hasIrreversibleActions) severityScore += 3;
    if (characteristics.hasAbsorbingBarriers) severityScore += 3;
    if (!characteristics.allowsRecovery) severityScore += 2;
    if (characteristics.timeHorizon === 'immediate') severityScore += 2;
    if (characteristics.hasNetworkEffects) severityScore += 1;
    if (characteristics.hasTimeDecay) severityScore += 1;
    if (characteristics.requiresExpertise) severityScore += 1;
    if (characteristics.hasRegulation) severityScore += 2;
    if (characteristics.hasSocialConsequences) severityScore += 1;

    // Map score to severity level
    if (severityScore >= 12) return RiskSeverity.CATASTROPHIC;
    if (severityScore >= 9) return RiskSeverity.CRITICAL;
    if (severityScore >= 6) return RiskSeverity.HIGH;
    if (severityScore >= 3) return RiskSeverity.MEDIUM;
    return RiskSeverity.LOW;
  }

  /**
   * Generate adaptive questions based on discovered characteristics
   */
  getAdaptiveQuestions(assessment: DomainAssessment): string[] {
    const questions: string[] = [];
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
