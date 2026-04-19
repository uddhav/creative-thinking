/**
 * Comprehensive NLP Service using compromise.js
 *
 * This service provides advanced natural language processing capabilities
 * utilizing the full feature set of compromise.js including:
 * - Part-of-speech tagging with 83 tags
 * - Grammar interpretation and syntactic parsing
 * - Entity extraction and recognition
 * - Semantic analysis and pattern detection
 * - Temporal expression processing
 *
 * Designed to be extensible for future MCP Sampling integration.
 */

import nlp from 'compromise';
import type {
  CompromiseDoc,
  CompromiseLibrary,
  CompromiseTerm,
  CompromiseSentence,
} from '../core/nlp-types.js';
import type { SamplingManager } from '../sampling/SamplingManager.js';

// Type assertion for the nlp library
const nlpTyped = nlp as CompromiseLibrary;

/**
 * Entity types that can be extracted
 */
export interface EntityExtraction {
  people: string[];
  places: string[];
  organizations: string[];
  dates: string[];
  money: string[];
  percentages: string[];
  emails: string[];
  phoneNumbers: string[];
  urls: string[];
  hashtags: string[];
  topics: string[];
  nouns: string[];
  verbs: string[];
  adjectives: string[];
  adverbs: string[];
}

/**
 * Part-of-speech tagging result
 */
export interface POSTagging {
  tokens: Array<{
    text: string;
    tags: string[];
    normal: string;
    implicit?: string;
  }>;
  sentences: Array<{
    text: string;
    type: 'statement' | 'question' | 'exclamation' | 'command';
  }>;
}

/**
 * Contradiction analysis result
 */
export interface ContradictionAnalysis {
  hasContradiction: boolean;
  contradictions: Array<{
    type: 'negation' | 'opposition' | 'mutual_exclusion' | 'semantic';
    elements: [string, string];
    confidence: number;
    context: string;
  }>;
  negations: Array<{
    verb: string;
    negated: boolean;
    context: string;
  }>;
}

/**
 * Paradox analysis result
 */
export interface ParadoxAnalysis {
  hasParadox: boolean;
  paradoxes: Array<{
    type: 'self_reference' | 'circular' | 'contradictory_requirements' | 'impossible_conditions';
    description: string;
    elements: string[];
    confidence: number;
  }>;
  conflictingGoals: Array<{
    goal1: string;
    goal2: string;
    conflict: string;
  }>;
}

/**
 * Relationship extraction result
 */
export interface RelationshipGraph {
  relationships: Array<{
    subject: string;
    verb: string;
    object: string;
    modifiers: string[];
    type: 'action' | 'state' | 'possession' | 'comparison';
  }>;
  dependencies: Array<{
    dependent: string;
    dependency: string;
    type: 'causal' | 'conditional' | 'temporal' | 'logical';
  }>;
}

/**
 * Topic modeling result
 */
export interface TopicModeling {
  mainTopics: string[];
  keywords: string[];
  concepts: Array<{
    concept: string;
    frequency: number;
    importance: number;
  }>;
  categories: string[];
}

/**
 * Sentiment analysis result
 */
export interface SentimentAnalysis {
  overall: 'positive' | 'negative' | 'neutral' | 'mixed';
  score: number; // -1 to 1
  emotions: Array<{
    emotion: string;
    intensity: number;
  }>;
  subjectivity: number; // 0 to 1
  confidence: number;
}

/**
 * Intent classification result
 */
export interface IntentClassification {
  primaryIntent: string;
  intents: Array<{
    intent: string;
    confidence: number;
  }>;
  questionType?: 'what' | 'why' | 'how' | 'when' | 'where' | 'who' | 'which' | 'yes_no';
  actionRequired: boolean;
}

/**
 * Temporal analysis result
 */
export interface TemporalAnalysis {
  expressions: Array<{
    text: string;
    type: 'date' | 'time' | 'duration' | 'frequency' | 'deadline';
    normalized?: string;
  }>;
  timeline: Array<{
    event: string;
    temporal: string;
    order: number;
  }>;
  urgency: 'immediate' | 'high' | 'medium' | 'low' | 'none';
  hasDeadline: boolean;
}

/**
 * Readability metrics
 */
export interface ReadabilityMetrics {
  avgWordLength: number;
  avgSentenceLength: number;
  syllableCount: number;
  complexWordCount: number;
  passiveVoiceCount: number;
  readabilityScore: number; // 0-100
  gradeLevel: number;
  clarity: 'very_clear' | 'clear' | 'moderate' | 'complex' | 'very_complex';
}

/**
 * N-gram analysis result
 */
export interface NGramAnalysis {
  n: number;
  grams: Array<{
    text: string;
    count: number;
    frequency: number;
  }>;
  collocations: Array<{
    words: string[];
    strength: number;
  }>;
}

/**
 * Enhanced sentiment analysis with nuanced emotions
 */
export interface EnhancedSentiment {
  basicSentiment: {
    polarity: 'positive' | 'negative' | 'neutral' | 'mixed';
    score: number;
  };
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
    trust: number;
    anticipation: number;
  };
  tone: {
    formal: number;
    casual: number;
    professional: number;
    academic: number;
    creative: number;
  };
  confidence: number;
}

/**
 * Enhanced intent with context understanding
 */
export interface EnhancedIntent {
  primaryIntent: string;
  secondaryIntents: string[];
  contextualFactors: {
    urgency: 'low' | 'medium' | 'high';
    formality: 'informal' | 'neutral' | 'formal';
    emotionalState: string;
    domainContext: string;
  };
  suggestedResponses: string[];
  confidence: number;
}

/**
 * Deep semantic understanding
 */
export interface SemanticUnderstanding {
  mainTheme: string;
  subThemes: string[];
  implicitMeanings: string[];
  culturalReferences: string[];
  metaphors: Array<{
    expression: string;
    literalMeaning: string;
    intendedMeaning: string;
  }>;
  ironySarcasm: {
    detected: boolean;
    instances: string[];
    confidence: number;
  };
}

/**
 * Complex reasoning detection
 */
export interface ReasoningAnalysis {
  argumentStructure: {
    claims: string[];
    evidence: string[];
    conclusions: string[];
    assumptions: string[];
  };
  logicalFallacies: Array<{
    type: string;
    description: string;
    example: string;
  }>;
  reasoningType: 'deductive' | 'inductive' | 'abductive' | 'analogical' | 'mixed';
  strengthOfArgument: number;
}

/**
 * Action analysis for reflexivity tracking
 */
export interface ActionAnalysis {
  actionType: string;
  reversibility: 'high' | 'medium' | 'low';
  likelyEffects: string[];
  stakeholderImpact: string[];
  temporalScope: 'immediate' | 'short-term' | 'long-term' | 'permanent';
  confidence: number;
}

/**
 * Comprehensive analysis combining all features
 */
export interface ComprehensiveAnalysis {
  entities: EntityExtraction;
  pos: POSTagging;
  contradictions: ContradictionAnalysis;
  paradoxes: ParadoxAnalysis;
  relationships: RelationshipGraph;
  topics: TopicModeling;
  sentiment: SentimentAnalysis;
  intent: IntentClassification;
  temporal: TemporalAnalysis;
  readability: ReadabilityMetrics;
  enhanced?: {
    sentiment: EnhancedSentiment;
    intent: EnhancedIntent;
    semantic: SemanticUnderstanding;
    reasoning: ReasoningAnalysis;
    summary: string;
    keyInsights: string[];
    questions: string[];
    suggestions: string[];
  };
  metadata: {
    wordCount: number;
    sentenceCount: number;
    paragraphCount: number;
    processingTime: number;
    confidence: number;
  };
}

/**
 * Cache entry for processed documents
 */
interface CacheEntry {
  doc: CompromiseDoc;
  analysis?: Partial<ComprehensiveAnalysis>;
  timestamp: number;
}

/**
 * Main NLP Service class - Unified service with local and AI-enhanced capabilities
 */
export class NLPService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private readonly maxCacheSize = 100;
  public samplingManager: SamplingManager | null = null;

  constructor(samplingManager?: SamplingManager) {
    this.samplingManager = samplingManager || null;
    // Initialize any plugins or extensions here if needed
    // Warm up the NLP engine to avoid first-use initialization overhead
    this.warmUp();
  }

  /**
   * Warm up the NLP engine to avoid first-use initialization overhead
   */
  private warmUp(): void {
    try {
      // Do a simple parse to initialize the engine
      const doc = nlp('warm up test');
      doc.out('text');
      // Also warm up common operations
      doc.match('#Noun');
      doc.match('#Verb');
    } catch {
      // Ignore warm-up errors
    }
  }

  /**
   * Perform comprehensive analysis on text
   */
  analyze(text: string): ComprehensiveAnalysis {
    const startTime = Date.now();
    const doc = this.getOrCreateDoc(text);

    const analysis: ComprehensiveAnalysis = {
      entities: this.extractEntities(text),
      pos: this.tagPartsOfSpeech(text),
      contradictions: this.detectContradictions(text),
      paradoxes: this.detectParadoxes(text),
      relationships: this.extractRelationships(text),
      topics: this.extractTopics(text),
      sentiment: this.analyzeSentiment(text),
      intent: this.classifyIntent(text),
      temporal: this.extractTemporalExpressions(text),
      readability: this.computeReadability(text),
      metadata: {
        wordCount: doc.wordCount?.() || 0,
        sentenceCount: doc.sentences?.().out('array').length || 0,
        paragraphCount: text.split(/\n\n+/).length,
        processingTime: Date.now() - startTime,
        confidence: this.calculateOverallConfidence(doc),
      },
    };

    // Cache the analysis
    this.updateCache(text, doc, analysis);

    return analysis;
  }

  /**
   * Extract entities from text
   */
  extractEntities(text: string): EntityExtraction {
    const doc = this.getOrCreateDoc(text);

    return {
      people: doc.people?.().out('array') || [],
      places: doc.places?.().out('array') || [],
      organizations: doc.organizations?.().out('array') || [],
      dates: doc.match('#Date').out('array'),
      money: doc.match('#Money').out('array'),
      percentages: doc.match('#Percent').out('array'),
      emails: doc.match('#Email').out('array'),
      phoneNumbers: doc.match('#PhoneNumber').out('array'),
      urls: doc.match('#Url').out('array'),
      hashtags: doc.match('#HashTag').out('array'),
      topics: doc.topics ? doc.topics().out('array') : [],
      nouns: doc.nouns ? doc.nouns().out('array') : [],
      verbs: doc.verbs ? doc.verbs().out('array') : [],
      adjectives: doc.adjectives ? doc.adjectives().out('array') : [],
      adverbs: doc.adverbs ? doc.adverbs().out('array') : [],
    };
  }

  /**
   * Tag parts of speech
   */
  tagPartsOfSpeech(text: string): POSTagging {
    const doc = this.getOrCreateDoc(text);

    // Get detailed token information
    const jsonData = doc.json ? (doc.json() as CompromiseTerm[]) : [];
    const tokens = jsonData.map(term => ({
      text: term.text || term.normal || '',
      tags: Array.isArray(term.tags) ? term.tags : [],
      normal: term.normal || term.text || '',
      implicit: term.implicit || '',
    }));

    // Analyze sentences
    const sentencesDoc = doc.sentences ? doc.sentences() : null;
    const sentencesJson =
      sentencesDoc && sentencesDoc.json ? (sentencesDoc.json() as CompromiseSentence[]) : [];
    const sentences = sentencesJson.map(sent => {
      const sentText = sent.text || '';
      let type: 'statement' | 'question' | 'exclamation' | 'command' = 'statement';

      if (sentText.endsWith('?')) {
        type = 'question';
      } else if (sentText.endsWith('!')) {
        type = 'exclamation';
      } else if (nlp(sentText).match('#Imperative').found) {
        type = 'command';
      }

      return { text: sentText, type };
    });

    return { tokens, sentences };
  }

  /**
   * Detect contradictions in text
   */
  detectContradictions(text: string): ContradictionAnalysis {
    const doc = this.getOrCreateDoc(text);
    const contradictions: ContradictionAnalysis['contradictions'] = [];
    const negations: ContradictionAnalysis['negations'] = [];

    // Detect negated verbs
    if (doc.verbs) {
      const verbs = doc.verbs();
      if (verbs && verbs.forEach) {
        verbs.forEach((verb: CompromiseDoc) => {
          const verbText = verb.text ? verb.text() : '';
          const isNegative = verb.has('#Negative');
          if (isNegative) {
            let context = '';
            if (verb.all && typeof verb.all === 'function') {
              const allResult = verb.all();
              if (allResult && allResult.text && typeof allResult.text === 'function') {
                context = allResult.text();
              }
            }
            negations.push({
              verb: verbText,
              negated: true,
              context: context,
            });
          }
        });
      }
    }

    // Detect "but" contradictions
    const butClauses = doc.match('[*] but [*]');
    if (butClauses.found && butClauses.forEach && typeof butClauses.forEach === 'function') {
      butClauses.forEach((clause: CompromiseDoc) => {
        const clauseText = clause.text && typeof clause.text === 'function' ? clause.text() : '';
        const parts = clauseText.split(/\s+but\s+/i);
        if (parts.length >= 2) {
          contradictions.push({
            type: 'opposition',
            elements: [parts[0], parts[1]],
            confidence: 0.8,
            context: clauseText,
          });
        }
      });
    }

    // Detect "however" contradictions
    const howeverClauses = doc.match('[*] however [*]');
    if (
      howeverClauses.found &&
      howeverClauses.forEach &&
      typeof howeverClauses.forEach === 'function'
    ) {
      howeverClauses.forEach((clause: CompromiseDoc) => {
        const clauseText = clause.text && typeof clause.text === 'function' ? clause.text() : '';
        const parts = clauseText.split(/\s+however\s+/i);
        if (parts.length >= 2) {
          contradictions.push({
            type: 'opposition',
            elements: [parts[0], parts[1]],
            confidence: 0.8,
            context: clauseText,
          });
        }
      });
    }

    // Detect "although/though" contradictions
    const althoughClauses = doc.match('(although|though) [*]');
    if (
      althoughClauses.found &&
      althoughClauses.forEach &&
      typeof althoughClauses.forEach === 'function'
    ) {
      althoughClauses.forEach((clause: CompromiseDoc) => {
        const clauseText = clause.text && typeof clause.text === 'function' ? clause.text() : '';
        let contextText = '';
        if (clause.all && typeof clause.all === 'function') {
          const allResult = clause.all();
          if (allResult && allResult.text && typeof allResult.text === 'function') {
            contextText = allResult.text();
          }
        }
        contradictions.push({
          type: 'opposition',
          elements: ['concession', clauseText],
          confidence: 0.7,
          context: contextText,
        });
      });
    }

    // Detect mutual exclusion patterns
    const eitherOr = doc.match('either [*] or [*]');
    if (eitherOr.found && eitherOr.forEach && typeof eitherOr.forEach === 'function') {
      eitherOr.forEach((clause: CompromiseDoc) => {
        const clauseText = clause.text && typeof clause.text === 'function' ? clause.text() : '';
        const parts = clauseText
          .split(/\s+(either|or)\s+/i)
          .filter(p => p && !['either', 'or'].includes(p.toLowerCase()));
        if (parts.length >= 2) {
          contradictions.push({
            type: 'mutual_exclusion',
            elements: [parts[0], parts[1]],
            confidence: 0.9,
            context: clauseText,
          });
        }
      });
    }

    return {
      hasContradiction: contradictions.length > 0 || negations.length > 0,
      contradictions,
      negations,
    };
  }

  /**
   * Detect paradoxes in text
   */
  detectParadoxes(text: string): ParadoxAnalysis {
    const doc = this.getOrCreateDoc(text);
    const paradoxes: ParadoxAnalysis['paradoxes'] = [];
    const conflictingGoals: ParadoxAnalysis['conflictingGoals'] = [];

    // Detect self-referential paradoxes
    const selfRefPatterns = [
      'this statement is false',
      'never say never',
      'always avoid absolutes',
      'nothing is absolute',
    ];

    selfRefPatterns.forEach(pattern => {
      if (text.toLowerCase().includes(pattern)) {
        paradoxes.push({
          type: 'self_reference',
          description: `Self-referential paradox: "${pattern}"`,
          elements: [pattern],
          confidence: 0.9,
        });
      }
    });

    // Detect contradictory requirements
    const requirements = doc.match('(must|should|need to|have to) [*]');
    const restrictions = doc.match('(cannot|must not|should not|avoid) [*]');

    if (requirements.found && restrictions.found) {
      const reqTexts = requirements.out('array');
      const resTexts = restrictions.out('array');

      // Look for conflicts
      reqTexts.forEach(req => {
        resTexts.forEach(res => {
          // Extract the action parts
          const reqAction = req.replace(/^(must|should|need to|have to)\s+/i, '');
          const resAction = res.replace(/^(cannot|must not|should not|avoid)\s+/i, '');

          // Check if they refer to similar actions
          if (this.areSimilarActions(reqAction, resAction)) {
            paradoxes.push({
              type: 'contradictory_requirements',
              description: `Conflicting requirements: "${req}" vs "${res}"`,
              elements: [req, res],
              confidence: 0.7,
            });
          }
        });
      });
    }

    // Detect impossible conditions
    const impossiblePatterns = [
      { pattern: 'square circle', confidence: 1.0 },
      { pattern: 'married bachelor', confidence: 1.0 },
      { pattern: 'living dead', confidence: 0.8 },
      { pattern: 'deafening silence', confidence: 0.6 },
      { pattern: 'clearly confused', confidence: 0.7 },
    ];

    impossiblePatterns.forEach(({ pattern, confidence }) => {
      if (text.toLowerCase().includes(pattern)) {
        paradoxes.push({
          type: 'impossible_conditions',
          description: `Impossible condition: "${pattern}"`,
          elements: [pattern],
          confidence,
        });
      }
    });

    // Detect conflicting goals
    const goals = doc.match('(goal|objective|aim|target) [*]');
    if (goals.found) {
      const goalTexts = goals.out('array');
      for (let i = 0; i < goalTexts.length; i++) {
        for (let j = i + 1; j < goalTexts.length; j++) {
          if (this.areConflictingGoals(goalTexts[i], goalTexts[j])) {
            conflictingGoals.push({
              goal1: goalTexts[i],
              goal2: goalTexts[j],
              conflict: 'Potentially conflicting objectives',
            });
          }
        }
      }
    }

    return {
      hasParadox: paradoxes.length > 0 || conflictingGoals.length > 0,
      paradoxes,
      conflictingGoals,
    };
  }

  /**
   * Extract relationships from text
   */
  extractRelationships(text: string): RelationshipGraph {
    const doc = this.getOrCreateDoc(text);
    const relationships: RelationshipGraph['relationships'] = [];
    const dependencies: RelationshipGraph['dependencies'] = [];

    // Extract subject-verb-object patterns
    const sentences = doc.sentences && typeof doc.sentences === 'function' ? doc.sentences() : doc;
    if (sentences && sentences.forEach && typeof sentences.forEach === 'function') {
      sentences.forEach((sent: CompromiseDoc) => {
        // Find subject (typically nouns before verbs)
        const subjects = sent.match('#Noun+ #Verb');
        if (subjects.found && subjects.forEach && typeof subjects.forEach === 'function') {
          subjects.forEach((subj: CompromiseDoc) => {
            const subjNoun =
              subj.match && typeof subj.match === 'function' ? subj.match('#Noun+') : null;
            const subjVerb =
              subj.match && typeof subj.match === 'function' ? subj.match('#Verb') : null;
            const subjText =
              subjNoun && subjNoun.text && typeof subjNoun.text === 'function'
                ? subjNoun.text()
                : '';
            const verbText =
              subjVerb && subjVerb.text && typeof subjVerb.text === 'function'
                ? subjVerb.text()
                : '';
            const afterVerb =
              sent.after && typeof sent.after === 'function' ? sent.after(verbText) : sent;
            const objNoun =
              afterVerb && afterVerb.match && typeof afterVerb.match === 'function'
                ? afterVerb.match('#Noun+')
                : null;
            const objText =
              objNoun && objNoun.text && typeof objNoun.text === 'function' ? objNoun.text() : '';
            const adjectives =
              afterVerb && afterVerb.match && typeof afterVerb.match === 'function'
                ? afterVerb.match('#Adjective+')
                : null;
            const modifiers =
              adjectives && adjectives.out && typeof adjectives.out === 'function'
                ? adjectives.out('array')
                : [];

            if (subjText && verbText) {
              relationships.push({
                subject: subjText,
                verb: verbText,
                object: objText || '',
                modifiers,
                type: this.classifyRelationType(verbText),
              });
            }
          });
        }
      });
    }

    // Extract causal dependencies
    const causalPatterns = [
      { pattern: 'because [*]', type: 'causal' as const },
      { pattern: 'therefore [*]', type: 'causal' as const },
      { pattern: 'hence [*]', type: 'causal' as const },
      { pattern: 'thus [*]', type: 'causal' as const },
      { pattern: 'if [*] then [*]', type: 'conditional' as const },
      { pattern: 'when [*] then [*]', type: 'conditional' as const },
      { pattern: 'before [*]', type: 'temporal' as const },
      { pattern: 'after [*]', type: 'temporal' as const },
      { pattern: 'while [*]', type: 'temporal' as const },
    ];

    causalPatterns.forEach(({ pattern, type }) => {
      const matches = doc.match(pattern);
      if (matches.found && matches.forEach && typeof matches.forEach === 'function') {
        matches.forEach((match: CompromiseDoc) => {
          const matchText = match.text && typeof match.text === 'function' ? match.text() : '';
          const parts = matchText.split(
            /\s+(because|therefore|hence|thus|if|then|when|before|after|while)\s+/i
          );
          if (parts.length >= 2) {
            dependencies.push({
              dependent: parts[0],
              dependency: parts[parts.length - 1],
              type,
            });
          }
        });
      }
    });

    return { relationships, dependencies };
  }

  /**
   * Extract topics from text
   */
  extractTopics(text: string): TopicModeling {
    const doc = this.getOrCreateDoc(text);

    // Extract main topics
    const topics = doc.topics && typeof doc.topics === 'function' ? doc.topics().out('array') : [];

    // Extract important nouns as keywords
    const nouns = doc.nouns && typeof doc.nouns === 'function' ? doc.nouns().out('array') : [];
    const verbs = doc.verbs && typeof doc.verbs === 'function' ? doc.verbs().out('array') : [];

    // Count frequency of important terms
    const termFrequency = new Map<string, number>();
    [...nouns, ...verbs].forEach(term => {
      const normalized = term.toLowerCase();
      termFrequency.set(normalized, (termFrequency.get(normalized) || 0) + 1);
    });

    // Convert to concepts with importance scores
    const concepts = Array.from(termFrequency.entries())
      .map(([concept, frequency]) => ({
        concept,
        frequency,
        importance: frequency / Math.max(...termFrequency.values()),
      }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10);

    // Determine categories based on content
    const categories: string[] = [];
    if (doc.has('#Technology')) categories.push('technology');
    if (doc.has('#Business')) categories.push('business');
    if (doc.has('#Science')) categories.push('science');
    if (doc.has('#Person')) categories.push('people');
    if (doc.has('#Place')) categories.push('geography');
    if (doc.has('#Date')) categories.push('temporal');
    if (doc.has('#Money')) categories.push('financial');

    return {
      mainTopics: topics.slice(0, 5),
      keywords: [...new Set([...nouns, ...verbs])].slice(0, 20),
      concepts,
      categories,
    };
  }

  /**
   * Analyze sentiment
   */
  analyzeSentiment(text: string): SentimentAnalysis {
    const doc = this.getOrCreateDoc(text);

    // Count positive and negative words using word lists since compromise doesn't have #Positive/#Negative tags
    const positivePatterns = [
      'good',
      'great',
      'excellent',
      'amazing',
      'wonderful',
      'fantastic',
      'happy',
      'positive',
      'best',
      'love',
      'perfect',
      'beautiful',
    ];
    const negativePatterns = [
      'bad',
      'terrible',
      'awful',
      'horrible',
      'poor',
      'worst',
      'hate',
      'negative',
      'ugly',
      'disappointing',
      'unacceptable',
    ];

    const positiveWords: string[] = [];
    const negativeWords: string[] = [];

    positivePatterns.forEach(pattern => {
      const matches = doc.match(pattern);
      if (matches.found) {
        positiveWords.push(...matches.out('array'));
      }
    });

    negativePatterns.forEach(pattern => {
      const matches = doc.match(pattern);
      if (matches.found) {
        negativeWords.push(...matches.out('array'));
      }
    });

    // Get adjectives and adverbs for emotion analysis
    const adjectives =
      doc.adjectives && typeof doc.adjectives === 'function' ? doc.adjectives().out('array') : [];
    const adverbs =
      doc.adverbs && typeof doc.adverbs === 'function' ? doc.adverbs().out('array') : [];

    // Calculate basic sentiment score
    const posCount = positiveWords.length;
    const negCount = negativeWords.length;
    const total = Math.max(posCount + negCount, 1);

    const score = (posCount - negCount) / total;

    // Determine overall sentiment
    let overall: SentimentAnalysis['overall'];
    if (score > 0.2) overall = 'positive';
    else if (score < -0.2) overall = 'negative';
    else if (posCount > 0 && negCount > 0) overall = 'mixed';
    else overall = 'neutral';

    // Detect emotions from adjectives
    const emotions: SentimentAnalysis['emotions'] = [];
    const emotionMap: Record<string, string[]> = {
      joy: ['happy', 'joyful', 'excited', 'delighted', 'pleased'],
      anger: ['angry', 'furious', 'mad', 'irritated', 'annoyed'],
      fear: ['afraid', 'scared', 'terrified', 'anxious', 'worried'],
      sadness: ['sad', 'depressed', 'unhappy', 'miserable', 'gloomy'],
      surprise: ['surprised', 'shocked', 'amazed', 'astonished'],
    };

    Object.entries(emotionMap).forEach(([emotion, words]) => {
      const count = words.filter(w => text.toLowerCase().includes(w)).length;
      if (count > 0) {
        emotions.push({ emotion, intensity: Math.min(count / 3, 1) });
      }
    });

    // Calculate subjectivity (opinion vs fact)
    const opinionWords = [...adjectives, ...adverbs];
    const factWords = doc.match('#Noun').out('array');
    const subjectivity = opinionWords.length / Math.max(opinionWords.length + factWords.length, 1);

    return {
      overall,
      score,
      emotions,
      subjectivity,
      confidence: 0.7, // Moderate confidence for rule-based sentiment
    };
  }

  /**
   * Classify intent
   */
  classifyIntent(text: string): IntentClassification {
    const doc = this.getOrCreateDoc(text);
    const intents: IntentClassification['intents'] = [];

    // Detect question type
    let questionType: IntentClassification['questionType'];
    const questionWords = ['what', 'why', 'how', 'when', 'where', 'who', 'which'];
    const lowerText = text.toLowerCase();

    for (const qWord of questionWords) {
      if (lowerText.startsWith(qWord + ' ') || lowerText.includes(' ' + qWord + ' ')) {
        questionType = qWord as IntentClassification['questionType'];
        break;
      }
    }

    // Check for yes/no questions
    if (!questionType && text.includes('?')) {
      const startsWithModal = [
        'is',
        'are',
        'was',
        'were',
        'do',
        'does',
        'did',
        'can',
        'could',
        'will',
        'would',
        'should',
      ].some(modal => lowerText.startsWith(modal + ' '));
      if (startsWithModal) {
        questionType = 'yes_no';
      }
    }

    // Detect various intents
    const intentPatterns = [
      { pattern: '(help|assist|support)', intent: 'request_help', confidence: 0.9 },
      { pattern: '(explain|describe|tell)', intent: 'request_information', confidence: 0.9 },
      { pattern: '(want|need|require)', intent: 'express_need', confidence: 0.8 },
      { pattern: '(think|believe|feel)', intent: 'express_opinion', confidence: 0.7 },
      { pattern: '(suggest|recommend)', intent: 'request_recommendation', confidence: 0.9 },
      { pattern: '(how to|how do)', intent: 'request_instruction', confidence: 0.9 },
      { pattern: '(thank|thanks|appreciate)', intent: 'express_gratitude', confidence: 0.9 },
      { pattern: '(sorry|apologize)', intent: 'express_apology', confidence: 0.9 },
      { pattern: '(agree|disagree)', intent: 'express_agreement', confidence: 0.8 },
    ];

    intentPatterns.forEach(({ pattern, intent, confidence }) => {
      if (new RegExp(pattern, 'i').test(text)) {
        intents.push({ intent, confidence });
      }
    });

    // Determine primary intent
    const primaryIntent =
      intents.length > 0
        ? intents.sort((a, b) => b.confidence - a.confidence)[0].intent
        : questionType
          ? 'question'
          : 'statement';

    // Check if action is required
    const actionRequired = doc.has('#Imperative') || doc.has('please') || doc.has('#Modal');

    return {
      primaryIntent,
      intents,
      questionType,
      actionRequired,
    };
  }

  /**
   * Extract temporal expressions
   */
  extractTemporalExpressions(text: string): TemporalAnalysis {
    const doc = this.getOrCreateDoc(text);
    const expressions: TemporalAnalysis['expressions'] = [];
    const timeline: TemporalAnalysis['timeline'] = [];

    // Extract dates
    const dates = doc.match('#Date');
    if (dates.found && dates.forEach && typeof dates.forEach === 'function') {
      dates.forEach((date: CompromiseDoc) => {
        const dateText = date.text && typeof date.text === 'function' ? date.text() : '';
        expressions.push({
          text: dateText,
          type: 'date',
          // normalized: date.format('{month} {date}, {year}').text(), // format may not be available
        });
      });
    }

    // Extract times
    const times = doc.match('#Time');
    if (times.found && times.forEach && typeof times.forEach === 'function') {
      times.forEach((time: CompromiseDoc) => {
        const timeText = time.text && typeof time.text === 'function' ? time.text() : '';
        expressions.push({
          text: timeText,
          type: 'time',
        });
      });
    }

    // Extract durations
    const durations = doc.match('#Value #Duration');
    if (durations.found && durations.forEach && typeof durations.forEach === 'function') {
      durations.forEach((duration: CompromiseDoc) => {
        const durationText =
          duration.text && typeof duration.text === 'function' ? duration.text() : '';
        expressions.push({
          text: durationText,
          type: 'duration',
        });
      });
    }

    // Extract deadline indicators
    const deadlinePatterns = ['by', 'before', 'until', 'deadline', 'due'];
    let hasDeadline = false;
    deadlinePatterns.forEach(pattern => {
      const matches = doc.match(pattern);
      if (matches.found) {
        hasDeadline = true;
        const matchesText =
          matches.text && typeof matches.text === 'function' ? matches.text() : '';
        expressions.push({
          text: matchesText,
          type: 'deadline',
        });
      }
    });

    // Detect urgency
    let urgency: TemporalAnalysis['urgency'] = 'none';
    if (doc.has('(immediately|now|urgent|asap)')) urgency = 'immediate';
    else if (doc.has('(soon|quickly|fast)')) urgency = 'high';
    else if (doc.has('(eventually|later|sometime)')) urgency = 'low';
    else if (hasDeadline) urgency = 'medium';

    // Extract events and order them
    const eventPatterns = ['first', 'then', 'next', 'after', 'before', 'finally', 'lastly'];
    eventPatterns.forEach((pattern, index) => {
      const matches = doc.match(`${pattern} [*]`);
      if (matches.found) {
        const matchesText =
          matches.text && typeof matches.text === 'function' ? matches.text() : '';
        timeline.push({
          event: matchesText,
          temporal: pattern,
          order: index,
        });
      }
    });

    return {
      expressions,
      timeline,
      urgency,
      hasDeadline,
    };
  }

  /**
   * Compute readability metrics
   */
  computeReadability(text: string): ReadabilityMetrics {
    const doc = this.getOrCreateDoc(text);

    // Basic metrics
    const words = doc.terms && typeof doc.terms === 'function' ? doc.terms().out('array') : [];
    const sentences =
      doc.sentences && typeof doc.sentences === 'function' ? doc.sentences().out('array') : [];
    const wordCount = words.length;
    const sentenceCount = Math.max(sentences.length, 1);

    // Calculate average word length
    const totalWordLength = words.reduce((sum, word) => sum + word.length, 0);
    const avgWordLength = totalWordLength / Math.max(wordCount, 1);

    // Calculate average sentence length
    const avgSentenceLength = wordCount / sentenceCount;

    // Count syllables (approximate)
    const syllableCount = this.countSyllables(text);

    // Count complex words (3+ syllables)
    const complexWordCount = words.filter(word => this.countSyllables(word) >= 3).length;

    // Count passive voice
    const passiveVoiceCount = doc.match('#Auxiliary #Verb #Participle').length;

    // Calculate readability score (simplified Flesch Reading Ease)
    const readabilityScore = Math.max(
      0,
      Math.min(
        100,
        206.835 - 1.015 * avgSentenceLength - 84.6 * (syllableCount / Math.max(wordCount, 1))
      )
    );

    // Calculate grade level (Flesch-Kincaid)
    const gradeLevel =
      0.39 * avgSentenceLength + 11.8 * (syllableCount / Math.max(wordCount, 1)) - 15.59;

    // Determine clarity
    let clarity: ReadabilityMetrics['clarity'];
    if (readabilityScore >= 90) clarity = 'very_clear';
    else if (readabilityScore >= 70) clarity = 'clear';
    else if (readabilityScore >= 50) clarity = 'moderate';
    else if (readabilityScore >= 30) clarity = 'complex';
    else clarity = 'very_complex';

    return {
      avgWordLength,
      avgSentenceLength,
      syllableCount,
      complexWordCount,
      passiveVoiceCount: passiveVoiceCount || 0,
      readabilityScore,
      gradeLevel: Math.max(0, gradeLevel),
      clarity,
    };
  }

  /**
   * Extract N-grams from text
   */
  extractNGrams(text: string, n: number): NGramAnalysis {
    const doc = this.getOrCreateDoc(text);
    const words = doc.terms && typeof doc.terms === 'function' ? doc.terms().out('array') : [];
    const gramCounts = new Map<string, number>();

    // Generate n-grams
    for (let i = 0; i <= words.length - n; i++) {
      const gram = words.slice(i, i + n).join(' ');
      gramCounts.set(gram, (gramCounts.get(gram) || 0) + 1);
    }

    // Convert to array with frequency
    const totalGrams = words.length - n + 1;
    const grams = Array.from(gramCounts.entries())
      .map(([text, count]) => ({
        text,
        count,
        frequency: count / Math.max(totalGrams, 1),
      }))
      .sort((a, b) => b.count - a.count);

    // Find collocations (frequently occurring together)
    const collocations: NGramAnalysis['collocations'] = [];
    if (n === 2) {
      grams
        .filter(g => g.frequency > 0.01)
        .forEach(g => {
          collocations.push({
            words: g.text.split(' '),
            strength: g.frequency,
          });
        });
    }

    return { n, grams, collocations };
  }

  /**
   * Normalize text for processing
   */
  normalizeText(text: string): string {
    const doc = nlp(text);

    // Expand contractions
    doc.contractions().expand();

    // Convert to lowercase
    doc.toLowerCase();

    // Remove extra whitespace
    const normalized = doc.text().replace(/\s+/g, ' ').trim();

    return normalized;
  }

  // Helper methods

  /**
   * Get or create a compromise document from cache
   */
  private getOrCreateDoc(text: string): CompromiseDoc {
    const cached = this.cache.get(text);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.doc;
    }

    const doc = nlpTyped(text);
    this.updateCache(text, doc);

    return doc;
  }

  /**
   * Update cache with document and optional analysis
   */
  private updateCache(
    text: string,
    doc: CompromiseDoc,
    analysis?: Partial<ComprehensiveAnalysis>
  ): void {
    // Maintain cache size limit
    if (this.cache.size >= this.maxCacheSize) {
      const oldest = Array.from(this.cache.entries()).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp
      )[0];
      if (oldest) {
        this.cache.delete(oldest[0]);
      }
    }

    this.cache.set(text, {
      doc,
      analysis,
      timestamp: Date.now(),
    });
  }

  /**
   * Count syllables in a word (approximation)
   */
  private countSyllables(word: string): number {
    word = word.toLowerCase();
    let count = 0;
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = /[aeiou]/.test(word[i]);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }

    // Adjust for silent e
    if (word.endsWith('e') && count > 1) {
      count--;
    }

    // Ensure at least one syllable
    return Math.max(count, 1);
  }

  /**
   * Check if two actions are similar
   */
  private areSimilarActions(action1: string, action2: string): boolean {
    const doc1 = this.getOrCreateDoc(action1);
    const doc2 = this.getOrCreateDoc(action2);

    // Check if they share the same main verb or noun
    const verbs1 = doc1.verbs ? doc1.verbs().out('array') : [];
    const verbs2 = doc2.verbs ? doc2.verbs().out('array') : [];
    const nouns1 = doc1.nouns ? doc1.nouns().out('array') : [];
    const nouns2 = doc2.nouns ? doc2.nouns().out('array') : [];

    // Check for overlap
    const verbOverlap = verbs1.some(v1 =>
      verbs2.some(v2 => v1.toLowerCase() === v2.toLowerCase() || this.areSynonyms(v1, v2))
    );

    const nounOverlap = nouns1.some(n1 =>
      nouns2.some(n2 => n1.toLowerCase() === n2.toLowerCase() || this.areSynonyms(n1, n2))
    );

    return verbOverlap || nounOverlap;
  }

  /**
   * Check if two words are synonyms (simplified)
   */
  private areSynonyms(word1: string, word2: string): boolean {
    // Simple synonym groups for demonstration
    const synonymGroups = [
      ['increase', 'grow', 'expand', 'rise'],
      ['decrease', 'reduce', 'shrink', 'lower'],
      ['fast', 'quick', 'rapid', 'speedy'],
      ['slow', 'gradual', 'leisurely'],
      ['good', 'great', 'excellent', 'positive'],
      ['bad', 'poor', 'negative', 'terrible'],
    ];

    const w1 = word1.toLowerCase();
    const w2 = word2.toLowerCase();

    return synonymGroups.some(group => group.includes(w1) && group.includes(w2));
  }

  /**
   * Check if two goals are conflicting
   */
  private areConflictingGoals(goal1: string, goal2: string): boolean {
    // Simple conflict detection based on opposites
    const opposites = [
      ['increase', 'decrease'],
      ['maximize', 'minimize'],
      ['speed up', 'slow down'],
      ['expand', 'contract'],
      ['open', 'close'],
    ];

    const g1 = goal1.toLowerCase();
    const g2 = goal2.toLowerCase();

    return opposites.some(
      ([opp1, opp2]) =>
        (g1.includes(opp1) && g2.includes(opp2)) || (g1.includes(opp2) && g2.includes(opp1))
    );
  }

  /**
   * Classify relation type based on verb
   */
  private classifyRelationType(verb: string): 'action' | 'state' | 'possession' | 'comparison' {
    const v = verb.toLowerCase();

    if (['is', 'are', 'was', 'were', 'be', 'been', 'being'].includes(v)) {
      return 'state';
    } else if (['has', 'have', 'had', 'owns', 'possess'].includes(v)) {
      return 'possession';
    } else if (['better', 'worse', 'more', 'less', 'greater', 'smaller'].includes(v)) {
      return 'comparison';
    } else {
      return 'action';
    }
  }

  /**
   * Calculate overall confidence based on text quality
   */
  private calculateOverallConfidence(doc: CompromiseDoc): number {
    const wordCount = doc.wordCount?.() || 0;
    const sentences = doc.sentences?.();
    const sentenceCount = sentences ? sentences.out('array').length : 0;

    let confidence = 0.5; // Base confidence

    // Adjust based on text length
    if (wordCount >= 50) confidence += 0.2;
    else if (wordCount >= 20) confidence += 0.1;

    // Adjust based on sentence structure
    if (sentenceCount >= 2) confidence += 0.1;

    // Adjust based on entity presence
    const topics = doc.topics?.();
    if (topics && topics.out('array').length > 0) confidence += 0.1;
    const people = doc.people?.();
    const places = doc.places?.();
    if ((people && people.out('array').length > 0) || (places && places.out('array').length > 0))
      confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; entries: string[] } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      entries: Array.from(this.cache.keys()),
    };
  }

  // ============= Enhanced Async Methods with AI =============

  /**
   * Perform enhanced analysis with optional AI augmentation
   */
  async analyzeAsync(
    text: string,
    options?: {
      includeReasoning?: boolean;
      includeSemantic?: boolean;
      includeQuestions?: boolean;
      domain?: string;
    }
  ): Promise<ComprehensiveAnalysis> {
    // Get basic analysis first (fast, local)
    const basicAnalysis = this.analyze(text);

    // If no sampling available, return basic analysis
    if (!this.samplingManager?.isAvailable()) {
      return basicAnalysis;
    }

    try {
      // Perform enhanced analysis in parallel
      const [sentiment, intent, semantic, reasoning] = await Promise.allSettled([
        this.enhanceSentiment(text, basicAnalysis),
        this.enhanceIntent(text, basicAnalysis, options?.domain),
        options?.includeSemantic !== false ? this.analyzeSemantics(text) : null,
        options?.includeReasoning ? this.analyzeReasoning(text) : null,
      ]);

      // Generate insights and suggestions
      const insights = await this.generateInsights(text, basicAnalysis);
      const questions = options?.includeQuestions ? await this.generateQuestions(text) : [];
      const summary = await this.generateSummary(text);
      const suggestions = await this.generateSuggestions(text, basicAnalysis);

      return {
        ...basicAnalysis,
        enhanced: {
          sentiment: this.resolvePromise(sentiment, this.fallbackSentiment()),
          intent: this.resolvePromise(intent, this.fallbackIntent()),
          semantic: this.resolvePromise(semantic, this.fallbackSemantic()),
          reasoning: this.resolvePromise(reasoning, this.fallbackReasoning()),
          summary,
          keyInsights: insights,
          questions,
          suggestions,
        },
      };
    } catch (error) {
      console.error('[NLPService] Enhanced analysis failed:', error);
      return basicAnalysis;
    }
  }

  /**
   * Analyze action semantics for reflexivity tracking
   */
  async analyzeActionSemantics(actionText: string): Promise<ActionAnalysis> {
    // Input validation and safety checks
    if (!actionText || actionText.length > 1000) {
      throw new Error('Action text must be between 1 and 1000 characters');
    }

    // First try local analysis with enhanced patterns
    const localAnalysis = this.analyzeActionLocal(actionText);

    // If sampling not available, return local analysis
    if (!this.samplingManager?.isAvailable()) {
      return localAnalysis;
    }

    // Add timeout for AI analysis
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI analysis timeout')), 5000)
    );

    try {
      // Use AI for deeper semantic understanding with timeout
      const result = await Promise.race([
        this.samplingManager.requestSampling(
          {
            messages: [
              {
                role: 'system',
                content: `You are an expert in analyzing actions and their consequences.
Analyze actions for reversibility, stakeholder impact, and temporal effects.`,
              },
              {
                role: 'user',
                content: `Analyze this action: "${actionText}"

Determine:
1. Action type (elimination/communication/experimentation/commitment/delegation/automation/integration/transformation/other)
2. Reversibility (high/medium/low)
3. Likely effects (list 2-3)
4. Stakeholder impacts (list 1-2)
5. Temporal scope (immediate/short-term/long-term/permanent)
6. Confidence (0-1)

Format as JSON.`,
              },
            ],
            temperature: 0.3,
            maxTokens: 400,
          },
          'action_analysis'
        ),
        timeout,
      ]);

      return this.parseActionAnalysis(result.content, localAnalysis);
    } catch (error) {
      console.error('[NLPService] Action analysis failed:', error);
      return localAnalysis;
    }
  }

  /**
   * Classify action reversibility with context
   */
  async classifyActionReversibility(
    actionText: string,
    context?: string
  ): Promise<'high' | 'medium' | 'low'> {
    const fullText = context ? `${context} Action: ${actionText}` : actionText;
    const analysis = await this.analyzeActionSemantics(fullText);
    return analysis.reversibility;
  }

  /**
   * Predict action effects
   */
  async predictActionEffects(actionText: string, context?: string): Promise<string[]> {
    const fullText = context ? `${context} Action: ${actionText}` : actionText;
    const analysis = await this.analyzeActionSemantics(fullText);
    return analysis.likelyEffects;
  }

  // ============= Private Helper Methods for AI Enhancement =============

  private analyzeActionLocal(actionText: string): ActionAnalysis {
    const text = actionText.toLowerCase();

    // Extended action patterns for local analysis
    const actionPatterns = {
      elimination: /\b(eliminat|remov|delet|discard|abandon|cancel|terminat|abolish)\w*/i,
      communication: /\b(communicat|announc|declar|publish|broadcast|inform|notify|tell)\w*/i,
      experimentation: /\b(test|experiment|trial|pilot|prototype|try|explore|investigate)\w*/i,
      commitment: /\b(commit|promis|pledg|guarantee|agree|contract|sign|bind)\w*/i,
      delegation: /\b(delegat|assign|transfer|outsourc|handoff|pass|give)\w*/i,
      automation: /\b(automat|script|schedul|trigger|workflow|pipeline|bot)\w*/i,
      integration: /\b(integrat|merg|combin|unif|consolidat|join|connect)\w*/i,
      transformation: /\b(transform|chang|modif|alter|convert|refactor|restructur)\w*/i,
    };

    // Determine action type and reversibility
    let actionType = 'other';
    let reversibility: 'high' | 'medium' | 'low' = 'medium';
    const likelyEffects: string[] = [];

    for (const [type, pattern] of Object.entries(actionPatterns)) {
      if (pattern.test(text)) {
        actionType = type;

        // Set reversibility based on action type
        switch (type) {
          case 'elimination':
          case 'commitment':
            reversibility = 'low';
            likelyEffects.push('Permanent change to system state');
            break;
          case 'communication':
          case 'delegation':
            reversibility = 'low';
            likelyEffects.push('Creates stakeholder expectations');
            break;
          case 'experimentation':
            reversibility = 'high';
            likelyEffects.push('Learning without commitment');
            break;
          case 'automation':
          case 'integration':
            reversibility = 'medium';
            likelyEffects.push('System dependencies created');
            break;
          case 'transformation':
            reversibility = 'medium';
            likelyEffects.push('Structural changes made');
            break;
        }
        break;
      }
    }

    // Analyze for temporal keywords
    let temporalScope: ActionAnalysis['temporalScope'] = 'short-term';
    if (/\b(permanent|forever|always|indefinite)\b/i.test(text)) {
      temporalScope = 'permanent';
    } else if (/\b(long.?term|years?|months?)\b/i.test(text)) {
      temporalScope = 'long-term';
    } else if (/\b(immediate|now|instant|right away)\b/i.test(text)) {
      temporalScope = 'immediate';
    }

    return {
      actionType,
      reversibility,
      likelyEffects: likelyEffects.length > 0 ? likelyEffects : ['Potential system state change'],
      stakeholderImpact: ['Stakeholders may be affected'],
      temporalScope,
      confidence: 0.6, // Lower confidence for local analysis
    };
  }

  private parseActionAnalysis(response: string, fallback: ActionAnalysis): ActionAnalysis {
    try {
      const parsed = JSON.parse(response) as Partial<ActionAnalysis>;
      return {
        actionType: parsed.actionType || fallback.actionType,
        reversibility: parsed.reversibility || fallback.reversibility,
        likelyEffects: parsed.likelyEffects || fallback.likelyEffects,
        stakeholderImpact: parsed.stakeholderImpact || fallback.stakeholderImpact,
        temporalScope: parsed.temporalScope || fallback.temporalScope,
        confidence: parsed.confidence || fallback.confidence,
      };
    } catch {
      return fallback;
    }
  }

  private async enhanceSentiment(
    text: string,
    basicAnalysis: ComprehensiveAnalysis
  ): Promise<EnhancedSentiment> {
    if (!this.samplingManager?.isAvailable()) {
      return this.fallbackSentiment();
    }

    const result = await this.samplingManager.requestSampling(
      {
        messages: [
          {
            role: 'system',
            content: 'You are an expert in emotional analysis and sentiment detection.',
          },
          {
            role: 'user',
            content: `Analyze sentiment and emotions in: "${text.substring(0, 1000)}"
            
Provide: sentiment, score (-1 to 1), emotions (0-1 each), tone (0-1 each), confidence.
Format as JSON.`,
          },
        ],
        temperature: 0.3,
        maxTokens: 400,
      },
      'sentiment_enhancement'
    );

    return this.parseSentimentResponse(result.content, basicAnalysis);
  }

  private async enhanceIntent(
    text: string,
    basicAnalysis: ComprehensiveAnalysis,
    domain?: string
  ): Promise<EnhancedIntent> {
    if (!this.samplingManager?.isAvailable()) {
      return this.fallbackIntent();
    }

    const result = await this.samplingManager.requestSampling(
      {
        messages: [
          {
            role: 'system',
            content: `Expert in intent analysis. ${domain ? `Domain: ${domain}` : ''}`,
          },
          {
            role: 'user',
            content: `Analyze intent: "${text.substring(0, 800)}"`,
          },
        ],
        temperature: 0.4,
        maxTokens: 500,
      },
      'intent_enhancement'
    );

    return this.parseIntentResponse(result.content, basicAnalysis);
  }

  private async analyzeSemantics(text: string): Promise<SemanticUnderstanding> {
    if (!this.samplingManager?.isAvailable()) {
      return this.fallbackSemantic();
    }

    const result = await this.samplingManager.requestSampling(
      {
        messages: [
          {
            role: 'system',
            content: 'Expert in semantic analysis.',
          },
          {
            role: 'user',
            content: `Deep semantic analysis of: "${text.substring(0, 1000)}"`,
          },
        ],
        temperature: 0.5,
        maxTokens: 600,
      },
      'semantic_analysis'
    );

    return this.parseSemanticResponse(result.content);
  }

  private async analyzeReasoning(text: string): Promise<ReasoningAnalysis> {
    if (!this.samplingManager?.isAvailable()) {
      return this.fallbackReasoning();
    }

    const result = await this.samplingManager.requestSampling(
      {
        messages: [
          {
            role: 'system',
            content: 'Expert in logical analysis.',
          },
          {
            role: 'user',
            content: `Analyze reasoning in: "${text.substring(0, 1000)}"`,
          },
        ],
        temperature: 0.3,
        maxTokens: 700,
      },
      'reasoning_analysis'
    );

    return this.parseReasoningResponse(result.content);
  }

  private async generateInsights(
    text: string,
    _basicAnalysis: ComprehensiveAnalysis
  ): Promise<string[]> {
    if (!this.samplingManager?.isAvailable()) {
      return [];
    }

    try {
      const result = await this.samplingManager.requestSampling(
        {
          messages: [
            {
              role: 'system',
              content: 'Generate actionable insights.',
            },
            {
              role: 'user',
              content: `Key insights from: "${text.substring(0, 800)}"`,
            },
          ],
          temperature: 0.6,
          maxTokens: 400,
        },
        'insight_generation'
      );

      return this.parseListResponse(result.content);
    } catch {
      return [];
    }
  }

  private async generateQuestions(text: string): Promise<string[]> {
    if (!this.samplingManager?.isAvailable()) {
      return [];
    }

    try {
      const result = await this.samplingManager.requestSampling(
        {
          messages: [
            {
              role: 'system',
              content: 'Generate clarifying questions.',
            },
            {
              role: 'user',
              content: `Questions for: "${text.substring(0, 600)}"`,
            },
          ],
          temperature: 0.7,
          maxTokens: 300,
        },
        'question_generation'
      );

      return this.parseListResponse(result.content, '?');
    } catch {
      return [];
    }
  }

  private async generateSummary(text: string): Promise<string> {
    if (text.length < 100 || !this.samplingManager?.isAvailable()) {
      return text.substring(0, 200) + (text.length > 200 ? '...' : '');
    }

    try {
      const result = await this.samplingManager.requestSampling(
        {
          messages: [
            {
              role: 'system',
              content: 'Create concise summaries.',
            },
            {
              role: 'user',
              content: `Summarize: "${text.substring(0, 2000)}"`,
            },
          ],
          temperature: 0.4,
          maxTokens: 150,
        },
        'summary_generation'
      );

      return result.content.trim();
    } catch {
      return text.substring(0, 200) + '...';
    }
  }

  private async generateSuggestions(
    text: string,
    basicAnalysis: ComprehensiveAnalysis
  ): Promise<string[]> {
    if (!this.samplingManager?.isAvailable()) {
      return [];
    }

    const hasIssues =
      basicAnalysis.sentiment.score < -0.3 || basicAnalysis.contradictions.hasContradiction;

    if (!hasIssues) {
      return [];
    }

    try {
      const result = await this.samplingManager.requestSampling(
        {
          messages: [
            {
              role: 'system',
              content: 'Provide improvement suggestions.',
            },
            {
              role: 'user',
              content: `Suggest improvements: "${text.substring(0, 800)}"`,
            },
          ],
          temperature: 0.5,
          maxTokens: 300,
        },
        'suggestion_generation'
      );

      return this.parseListResponse(result.content);
    } catch {
      return [];
    }
  }

  // Parsing helpers
  private parseSentimentResponse(
    response: string,
    basicAnalysis: ComprehensiveAnalysis
  ): EnhancedSentiment {
    try {
      const parsed = JSON.parse(response) as {
        sentiment?: string;
        score?: number;
        emotions?: unknown;
        tone?: unknown;
        confidence?: number;
      };

      // Validate and cast polarity
      const validPolarities = ['positive', 'negative', 'neutral', 'mixed'] as const;
      type Polarity = (typeof validPolarities)[number];
      const isValidPolarity = (p: unknown): p is Polarity =>
        typeof p === 'string' && validPolarities.includes(p as Polarity);

      const polarity: Polarity = isValidPolarity(parsed.sentiment)
        ? parsed.sentiment
        : basicAnalysis.sentiment.overall;

      return {
        basicSentiment: {
          polarity,
          score: parsed.score ?? basicAnalysis.sentiment.score,
        },
        emotions: this.validateEmotions(parsed.emotions) || this.defaultEmotions(),
        tone: this.validateTone(parsed.tone) || this.defaultTone(),
        confidence: parsed.confidence || 0.7,
      };
    } catch {
      return this.fallbackSentiment();
    }
  }

  private validateEmotions(emotions: unknown): ReturnType<typeof this.defaultEmotions> | null {
    if (!emotions || typeof emotions !== 'object') return null;
    const e = emotions as Record<string, unknown>;
    const required = [
      'joy',
      'sadness',
      'anger',
      'fear',
      'surprise',
      'disgust',
      'trust',
      'anticipation',
    ];
    if (required.every(key => typeof e[key] === 'number')) {
      return e as ReturnType<typeof this.defaultEmotions>;
    }
    return null;
  }

  private validateTone(tone: unknown): ReturnType<typeof this.defaultTone> | null {
    if (!tone || typeof tone !== 'object') return null;
    const t = tone as Record<string, unknown>;
    const required = ['formal', 'casual', 'professional', 'academic', 'creative'];
    if (required.every(key => typeof t[key] === 'number')) {
      return t as ReturnType<typeof this.defaultTone>;
    }
    return null;
  }

  private parseIntentResponse(
    response: string,
    basicAnalysis: ComprehensiveAnalysis
  ): EnhancedIntent {
    try {
      const parsed = JSON.parse(response) as Partial<EnhancedIntent>;
      return {
        primaryIntent: parsed.primaryIntent || basicAnalysis.intent.primaryIntent,
        secondaryIntents: parsed.secondaryIntents || [],
        contextualFactors: parsed.contextualFactors || {
          urgency: 'medium',
          formality: 'neutral',
          emotionalState: 'neutral',
          domainContext: 'general',
        },
        suggestedResponses: parsed.suggestedResponses || [],
        confidence: parsed.confidence || 0.7,
      };
    } catch {
      return this.fallbackIntent();
    }
  }

  private parseSemanticResponse(response: string): SemanticUnderstanding {
    try {
      const parsed = JSON.parse(response) as Partial<SemanticUnderstanding>;
      return {
        mainTheme: parsed.mainTheme || 'general',
        subThemes: parsed.subThemes || [],
        implicitMeanings: parsed.implicitMeanings || [],
        culturalReferences: parsed.culturalReferences || [],
        metaphors: parsed.metaphors || [],
        ironySarcasm: parsed.ironySarcasm || {
          detected: false,
          instances: [],
          confidence: 0,
        },
      };
    } catch {
      return this.fallbackSemantic();
    }
  }

  private parseReasoningResponse(response: string): ReasoningAnalysis {
    try {
      const parsed = JSON.parse(response) as Partial<ReasoningAnalysis>;
      return {
        argumentStructure: parsed.argumentStructure || {
          claims: [],
          evidence: [],
          conclusions: [],
          assumptions: [],
        },
        logicalFallacies: parsed.logicalFallacies || [],
        reasoningType: parsed.reasoningType || 'mixed',
        strengthOfArgument: parsed.strengthOfArgument || 0.5,
      };
    } catch {
      return this.fallbackReasoning();
    }
  }

  private parseListResponse(response: string, filter?: string): string[] {
    return response
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 20 && (!filter || trimmed.includes(filter));
      })
      .map(line => line.replace(/^[-•*\d.)]\s+/, '').trim())
      .slice(0, 5);
  }

  private resolvePromise<T>(result: PromiseSettledResult<T | null>, fallback: T): T {
    if (result.status === 'fulfilled' && result.value) {
      return result.value;
    }
    return fallback;
  }

  // Fallback methods
  private fallbackSentiment(): EnhancedSentiment {
    return {
      basicSentiment: { polarity: 'neutral', score: 0 },
      emotions: this.defaultEmotions(),
      tone: this.defaultTone(),
      confidence: 0.5,
    };
  }

  private fallbackIntent(): EnhancedIntent {
    return {
      primaryIntent: 'general',
      secondaryIntents: [],
      contextualFactors: {
        urgency: 'medium',
        formality: 'neutral',
        emotionalState: 'neutral',
        domainContext: 'general',
      },
      suggestedResponses: [],
      confidence: 0.5,
    };
  }

  private fallbackSemantic(): SemanticUnderstanding {
    return {
      mainTheme: 'general',
      subThemes: [],
      implicitMeanings: [],
      culturalReferences: [],
      metaphors: [],
      ironySarcasm: { detected: false, instances: [], confidence: 0 },
    };
  }

  private fallbackReasoning(): ReasoningAnalysis {
    return {
      argumentStructure: {
        claims: [],
        evidence: [],
        conclusions: [],
        assumptions: [],
      },
      logicalFallacies: [],
      reasoningType: 'mixed',
      strengthOfArgument: 0.5,
    };
  }

  private defaultEmotions() {
    return {
      joy: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      surprise: 0,
      disgust: 0,
      trust: 0,
      anticipation: 0,
    };
  }

  private defaultTone() {
    return {
      formal: 0.5,
      casual: 0.5,
      professional: 0.5,
      academic: 0,
      creative: 0,
    };
  }
}

// Singleton instance to avoid multiple initializations
let nlpServiceInstance: NLPService | null = null;

/**
 * Get singleton instance of NLPService
 * @param samplingManager Optional sampling manager for AI enhancement
 */
export function getNLPService(samplingManager?: SamplingManager): NLPService {
  if (!nlpServiceInstance) {
    nlpServiceInstance = new NLPService(samplingManager);
  } else if (samplingManager && !nlpServiceInstance.samplingManager) {
    // Update sampling manager if not already set
    nlpServiceInstance.samplingManager = samplingManager;
  }
  return nlpServiceInstance;
}

/**
 * Reset the singleton instance (mainly for testing)
 */
export function resetNLPService(): void {
  nlpServiceInstance = null;
}

// Export singleton instance for convenience
export const nlpService = getNLPService();
