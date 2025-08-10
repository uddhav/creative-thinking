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
// Type assertion for the nlp library
const nlpTyped = nlp;
/**
 * Main NLP Service class
 */
export class NLPService {
    cache = new Map();
    cacheTimeout = 5 * 60 * 1000; // 5 minutes
    maxCacheSize = 100;
    constructor() {
        // Initialize any plugins or extensions here if needed
        // Warm up the NLP engine to avoid first-use initialization overhead
        this.warmUp();
    }
    /**
     * Warm up the NLP engine to avoid first-use initialization overhead
     */
    warmUp() {
        try {
            // Do a simple parse to initialize the engine
            const doc = nlp('warm up test');
            doc.out('text');
            // Also warm up common operations
            doc.match('#Noun');
            doc.match('#Verb');
        }
        catch {
            // Ignore warm-up errors
        }
    }
    /**
     * Perform comprehensive analysis on text
     */
    analyze(text) {
        const startTime = Date.now();
        const doc = this.getOrCreateDoc(text);
        const analysis = {
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
    extractEntities(text) {
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
    tagPartsOfSpeech(text) {
        const doc = this.getOrCreateDoc(text);
        // Get detailed token information
        const jsonData = doc.json ? doc.json() : [];
        const tokens = jsonData.map(term => ({
            text: term.text || term.normal || '',
            tags: Array.isArray(term.tags) ? term.tags : [],
            normal: term.normal || term.text || '',
            implicit: term.implicit || '',
        }));
        // Analyze sentences
        const sentencesDoc = doc.sentences ? doc.sentences() : null;
        const sentencesJson = sentencesDoc && sentencesDoc.json ? sentencesDoc.json() : [];
        const sentences = sentencesJson.map(sent => {
            const sentText = sent.text || '';
            let type = 'statement';
            if (sentText.endsWith('?')) {
                type = 'question';
            }
            else if (sentText.endsWith('!')) {
                type = 'exclamation';
            }
            else if (nlp(sentText).match('#Imperative').found) {
                type = 'command';
            }
            return { text: sentText, type };
        });
        return { tokens, sentences };
    }
    /**
     * Detect contradictions in text
     */
    detectContradictions(text) {
        const doc = this.getOrCreateDoc(text);
        const contradictions = [];
        const negations = [];
        // Detect negated verbs
        if (doc.verbs) {
            const verbs = doc.verbs();
            if (verbs && verbs.forEach) {
                verbs.forEach((verb) => {
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
            butClauses.forEach((clause) => {
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
        if (howeverClauses.found &&
            howeverClauses.forEach &&
            typeof howeverClauses.forEach === 'function') {
            howeverClauses.forEach((clause) => {
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
        if (althoughClauses.found &&
            althoughClauses.forEach &&
            typeof althoughClauses.forEach === 'function') {
            althoughClauses.forEach((clause) => {
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
            eitherOr.forEach((clause) => {
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
    detectParadoxes(text) {
        const doc = this.getOrCreateDoc(text);
        const paradoxes = [];
        const conflictingGoals = [];
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
    extractRelationships(text) {
        const doc = this.getOrCreateDoc(text);
        const relationships = [];
        const dependencies = [];
        // Extract subject-verb-object patterns
        const sentences = doc.sentences && typeof doc.sentences === 'function' ? doc.sentences() : doc;
        if (sentences && sentences.forEach && typeof sentences.forEach === 'function') {
            sentences.forEach((sent) => {
                // Find subject (typically nouns before verbs)
                const subjects = sent.match('#Noun+ #Verb');
                if (subjects.found && subjects.forEach && typeof subjects.forEach === 'function') {
                    subjects.forEach((subj) => {
                        const subjNoun = subj.match && typeof subj.match === 'function' ? subj.match('#Noun+') : null;
                        const subjVerb = subj.match && typeof subj.match === 'function' ? subj.match('#Verb') : null;
                        const subjText = subjNoun && subjNoun.text && typeof subjNoun.text === 'function'
                            ? subjNoun.text()
                            : '';
                        const verbText = subjVerb && subjVerb.text && typeof subjVerb.text === 'function'
                            ? subjVerb.text()
                            : '';
                        const afterVerb = sent.after && typeof sent.after === 'function' ? sent.after(verbText) : sent;
                        const objNoun = afterVerb && afterVerb.match && typeof afterVerb.match === 'function'
                            ? afterVerb.match('#Noun+')
                            : null;
                        const objText = objNoun && objNoun.text && typeof objNoun.text === 'function' ? objNoun.text() : '';
                        const adjectives = afterVerb && afterVerb.match && typeof afterVerb.match === 'function'
                            ? afterVerb.match('#Adjective+')
                            : null;
                        const modifiers = adjectives && adjectives.out && typeof adjectives.out === 'function'
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
            { pattern: 'because [*]', type: 'causal' },
            { pattern: 'therefore [*]', type: 'causal' },
            { pattern: 'hence [*]', type: 'causal' },
            { pattern: 'thus [*]', type: 'causal' },
            { pattern: 'if [*] then [*]', type: 'conditional' },
            { pattern: 'when [*] then [*]', type: 'conditional' },
            { pattern: 'before [*]', type: 'temporal' },
            { pattern: 'after [*]', type: 'temporal' },
            { pattern: 'while [*]', type: 'temporal' },
        ];
        causalPatterns.forEach(({ pattern, type }) => {
            const matches = doc.match(pattern);
            if (matches.found && matches.forEach && typeof matches.forEach === 'function') {
                matches.forEach((match) => {
                    const matchText = match.text && typeof match.text === 'function' ? match.text() : '';
                    const parts = matchText.split(/\s+(because|therefore|hence|thus|if|then|when|before|after|while)\s+/i);
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
    extractTopics(text) {
        const doc = this.getOrCreateDoc(text);
        // Extract main topics
        const topics = doc.topics && typeof doc.topics === 'function' ? doc.topics().out('array') : [];
        // Extract important nouns as keywords
        const nouns = doc.nouns && typeof doc.nouns === 'function' ? doc.nouns().out('array') : [];
        const verbs = doc.verbs && typeof doc.verbs === 'function' ? doc.verbs().out('array') : [];
        // Count frequency of important terms
        const termFrequency = new Map();
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
        const categories = [];
        if (doc.has('#Technology'))
            categories.push('technology');
        if (doc.has('#Business'))
            categories.push('business');
        if (doc.has('#Science'))
            categories.push('science');
        if (doc.has('#Person'))
            categories.push('people');
        if (doc.has('#Place'))
            categories.push('geography');
        if (doc.has('#Date'))
            categories.push('temporal');
        if (doc.has('#Money'))
            categories.push('financial');
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
    analyzeSentiment(text) {
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
        const positiveWords = [];
        const negativeWords = [];
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
        const adjectives = doc.adjectives && typeof doc.adjectives === 'function' ? doc.adjectives().out('array') : [];
        const adverbs = doc.adverbs && typeof doc.adverbs === 'function' ? doc.adverbs().out('array') : [];
        // Calculate basic sentiment score
        const posCount = positiveWords.length;
        const negCount = negativeWords.length;
        const total = Math.max(posCount + negCount, 1);
        const score = (posCount - negCount) / total;
        // Determine overall sentiment
        let overall;
        if (score > 0.2)
            overall = 'positive';
        else if (score < -0.2)
            overall = 'negative';
        else if (posCount > 0 && negCount > 0)
            overall = 'mixed';
        else
            overall = 'neutral';
        // Detect emotions from adjectives
        const emotions = [];
        const emotionMap = {
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
    classifyIntent(text) {
        const doc = this.getOrCreateDoc(text);
        const intents = [];
        // Detect question type
        let questionType;
        const questionWords = ['what', 'why', 'how', 'when', 'where', 'who', 'which'];
        const lowerText = text.toLowerCase();
        for (const qWord of questionWords) {
            if (lowerText.startsWith(qWord + ' ') || lowerText.includes(' ' + qWord + ' ')) {
                questionType = qWord;
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
        const primaryIntent = intents.length > 0
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
    extractTemporalExpressions(text) {
        const doc = this.getOrCreateDoc(text);
        const expressions = [];
        const timeline = [];
        // Extract dates
        const dates = doc.match('#Date');
        if (dates.found && dates.forEach && typeof dates.forEach === 'function') {
            dates.forEach((date) => {
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
            times.forEach((time) => {
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
            durations.forEach((duration) => {
                const durationText = duration.text && typeof duration.text === 'function' ? duration.text() : '';
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
                const matchesText = matches.text && typeof matches.text === 'function' ? matches.text() : '';
                expressions.push({
                    text: matchesText,
                    type: 'deadline',
                });
            }
        });
        // Detect urgency
        let urgency = 'none';
        if (doc.has('(immediately|now|urgent|asap)'))
            urgency = 'immediate';
        else if (doc.has('(soon|quickly|fast)'))
            urgency = 'high';
        else if (doc.has('(eventually|later|sometime)'))
            urgency = 'low';
        else if (hasDeadline)
            urgency = 'medium';
        // Extract events and order them
        const eventPatterns = ['first', 'then', 'next', 'after', 'before', 'finally', 'lastly'];
        eventPatterns.forEach((pattern, index) => {
            const matches = doc.match(`${pattern} [*]`);
            if (matches.found) {
                const matchesText = matches.text && typeof matches.text === 'function' ? matches.text() : '';
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
    computeReadability(text) {
        const doc = this.getOrCreateDoc(text);
        // Basic metrics
        const words = doc.terms && typeof doc.terms === 'function' ? doc.terms().out('array') : [];
        const sentences = doc.sentences && typeof doc.sentences === 'function' ? doc.sentences().out('array') : [];
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
        const readabilityScore = Math.max(0, Math.min(100, 206.835 - 1.015 * avgSentenceLength - 84.6 * (syllableCount / Math.max(wordCount, 1))));
        // Calculate grade level (Flesch-Kincaid)
        const gradeLevel = 0.39 * avgSentenceLength + 11.8 * (syllableCount / Math.max(wordCount, 1)) - 15.59;
        // Determine clarity
        let clarity;
        if (readabilityScore >= 90)
            clarity = 'very_clear';
        else if (readabilityScore >= 70)
            clarity = 'clear';
        else if (readabilityScore >= 50)
            clarity = 'moderate';
        else if (readabilityScore >= 30)
            clarity = 'complex';
        else
            clarity = 'very_complex';
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
    extractNGrams(text, n) {
        const doc = this.getOrCreateDoc(text);
        const words = doc.terms && typeof doc.terms === 'function' ? doc.terms().out('array') : [];
        const gramCounts = new Map();
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
        const collocations = [];
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
    normalizeText(text) {
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
    getOrCreateDoc(text) {
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
    updateCache(text, doc, analysis) {
        // Maintain cache size limit
        if (this.cache.size >= this.maxCacheSize) {
            const oldest = Array.from(this.cache.entries()).sort(([, a], [, b]) => a.timestamp - b.timestamp)[0];
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
    countSyllables(word) {
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
    areSimilarActions(action1, action2) {
        const doc1 = this.getOrCreateDoc(action1);
        const doc2 = this.getOrCreateDoc(action2);
        // Check if they share the same main verb or noun
        const verbs1 = doc1.verbs ? doc1.verbs().out('array') : [];
        const verbs2 = doc2.verbs ? doc2.verbs().out('array') : [];
        const nouns1 = doc1.nouns ? doc1.nouns().out('array') : [];
        const nouns2 = doc2.nouns ? doc2.nouns().out('array') : [];
        // Check for overlap
        const verbOverlap = verbs1.some(v1 => verbs2.some(v2 => v1.toLowerCase() === v2.toLowerCase() || this.areSynonyms(v1, v2)));
        const nounOverlap = nouns1.some(n1 => nouns2.some(n2 => n1.toLowerCase() === n2.toLowerCase() || this.areSynonyms(n1, n2)));
        return verbOverlap || nounOverlap;
    }
    /**
     * Check if two words are synonyms (simplified)
     */
    areSynonyms(word1, word2) {
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
    areConflictingGoals(goal1, goal2) {
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
        return opposites.some(([opp1, opp2]) => (g1.includes(opp1) && g2.includes(opp2)) || (g1.includes(opp2) && g2.includes(opp1)));
    }
    /**
     * Classify relation type based on verb
     */
    classifyRelationType(verb) {
        const v = verb.toLowerCase();
        if (['is', 'are', 'was', 'were', 'be', 'been', 'being'].includes(v)) {
            return 'state';
        }
        else if (['has', 'have', 'had', 'owns', 'possess'].includes(v)) {
            return 'possession';
        }
        else if (['better', 'worse', 'more', 'less', 'greater', 'smaller'].includes(v)) {
            return 'comparison';
        }
        else {
            return 'action';
        }
    }
    /**
     * Calculate overall confidence based on text quality
     */
    calculateOverallConfidence(doc) {
        const wordCount = doc.wordCount?.() || 0;
        const sentences = doc.sentences?.();
        const sentenceCount = sentences ? sentences.out('array').length : 0;
        let confidence = 0.5; // Base confidence
        // Adjust based on text length
        if (wordCount >= 50)
            confidence += 0.2;
        else if (wordCount >= 20)
            confidence += 0.1;
        // Adjust based on sentence structure
        if (sentenceCount >= 2)
            confidence += 0.1;
        // Adjust based on entity presence
        const topics = doc.topics?.();
        if (topics && topics.out('array').length > 0)
            confidence += 0.1;
        const people = doc.people?.();
        const places = doc.places?.();
        if ((people && people.out('array').length > 0) || (places && places.out('array').length > 0))
            confidence += 0.1;
        return Math.min(confidence, 1.0);
    }
    /**
     * Clear the cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            entries: Array.from(this.cache.keys()),
        };
    }
}
// Singleton instance to avoid multiple initializations
let nlpServiceInstance = null;
/**
 * Get singleton instance of NLPService
 */
export function getNLPService() {
    if (!nlpServiceInstance) {
        nlpServiceInstance = new NLPService();
    }
    return nlpServiceInstance;
}
// Export singleton instance for convenience
export const nlpService = getNLPService();
//# sourceMappingURL=NLPService.js.map