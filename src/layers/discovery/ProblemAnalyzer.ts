/**
 * ProblemAnalyzer - Handles problem categorization and analysis
 * Extracted from discoverTechniques to improve maintainability
 * Enhanced with comprehensive NLP analysis using NLPService
 */

import { getNLPService, type NLPService } from '../../nlp/NLPService.js';

export class ProblemAnalyzer {
  private nlpService: NLPService;
  // Pre-compiled regex patterns for performance
  private readonly COGNITIVE_PATTERN = /\b(cognitive|mental|focus|productivity)\b/;

  constructor() {
    this.nlpService = getNLPService();
  }
  /**
   * Categorize the problem based on NLP analysis and patterns
   */
  categorizeProblem(problem: string, context?: string): string {
    const fullText = `${problem} ${context || ''}`;
    // Cache toLowerCase result for performance
    const lowerText = fullText.toLowerCase();
    // The two high-precision passes below read this instead of lowerText. They
    // run ahead of every topic detector, so matching on the context as well let
    // a passing mention there outrank the whole problem statement: "optimise
    // the Postgres query planner" with context "this came out of our red team
    // exercise" routed adversarial, and the same shape rerouted problems to
    // retention on a context that merely mentioned decommissioning something.
    // Both passes detect what is being asked OF the problem, and that ask is in
    // the problem. Every other detector still sees the full text, where context
    // is evidence about the subject matter and belongs.
    const lowerProblem = problem.toLowerCase();

    // OPTIMIZATION: Fast-path for explicit technique requests (skip NLP)
    const explicitTechnique = this.checkExplicitTechniqueRequest(fullText, lowerText);
    if (explicitTechnique) {
      return explicitTechnique;
    }

    // Use NLPService for comprehensive analysis with error handling
    let nlpAnalysis;
    try {
      nlpAnalysis = this.nlpService.analyze(fullText);
    } catch (error) {
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

    // 1b. Explicit requests to be argued with, ahead of everything except the
    // paradox check. Same shape and same reason as the end-of-life pass below:
    // these phrasings say what is being asked *of* the problem, which outranks
    // what the problem is about. 'Red team our incident response process' is a
    // request for opposition that happens to concern infrastructure, and was
    // claimed by `technical`; 'prove me wrong about dropping the mobile app'
    // was claimed by `validation`.
    //
    // Placed above the temporal check deliberately, and measured: a deadline in
    // the sentence is context, not the ask. 'Stress test the plan before we
    // commit' routed `temporal` on 'before' alone. Moving this pass up reclaims
    // it and recategorises nothing — 288 unique problem strings from the test
    // suite route identically either way.
    //
    // It also runs ahead of the end-of-life pass, so 'poke holes in the plan to
    // decommission the cluster' is adversarial rather than retention. That is
    // the intended precedence: the user asked to be argued with, and a
    // keep-or-cut question they have not asked to be attacked ('should we
    // decommission the staging cluster') still reaches `retention` untouched.
    if (this.detectExplicitAdversarialAsk(lowerProblem)) {
      return 'adversarial';
    }

    // 2. Check temporal using NLP results (no redundant string matching)
    if (
      nlpAnalysis.temporal.hasDeadline ||
      nlpAnalysis.temporal.urgency !== 'none' ||
      nlpAnalysis.temporal.expressions.length > 2
    ) {
      return 'temporal';
    }

    // 3. Explicit end-of-life language outranks the topic detectors below.
    // "Decommission the staging cluster" is a retention re-decision that
    // happens to be about infrastructure, not an infrastructure problem.
    if (this.detectExplicitEndOfLife(lowerProblem)) {
      return 'retention';
    }

    // 4. Check organizational/collaborative using NLP entities
    if (
      nlpAnalysis.entities.people.length > 2 ||
      nlpAnalysis.topics.categories.includes('people')
    ) {
      return 'organizational';
    }

    // 5. Check for specific pattern categories FIRST (higher priority)
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

    // 6. Use NLP topic categories for general classification
    const topicCategories = nlpAnalysis.topics.categories;
    const entities = nlpAnalysis.entities;
    const verbs = nlpAnalysis.entities.verbs;

    // Cognitive: Check NLP topics and verbs
    if (
      topicCategories.includes('psychology') ||
      verbs.some(v => ['focus', 'think', 'concentrate', 'remember'].includes(v.toLowerCase()))
    ) {
      return 'cognitive';
    }

    // Implementation: Check verbs and intent
    if (
      nlpAnalysis.intent.intents.some(i => i.intent === 'request_action') &&
      verbs.some(v =>
        ['implement', 'execute', 'deploy', 'launch', 'build'].includes(v.toLowerCase())
      )
    ) {
      return 'implementation';
    }

    // Systems: Use NLP topics and entities
    if (
      topicCategories.includes('technology') &&
      entities.nouns.some(n =>
        ['system', 'architecture', 'ecosystem', 'component'].includes(n.toLowerCase())
      )
    ) {
      return 'systems';
    }

    // User-centered: Check entities and topics
    if (
      (entities.nouns.some(n => ['user', 'customer', 'client'].includes(n.toLowerCase())) ||
        topicCategories.includes('people')) &&
      verbs.some(v => ['experience', 'interact', 'use'].includes(v.toLowerCase()))
    ) {
      return 'user-centered';
    }

    // Technical: Use NLP readability and topics
    if (
      nlpAnalysis.readability.clarity === 'complex' ||
      nlpAnalysis.readability.clarity === 'very_complex' ||
      topicCategories.includes('science') ||
      topicCategories.includes('technology')
    ) {
      return 'technical';
    }

    // Creative: Check adjectives and intent
    if (
      entities.adjectives.some(a =>
        ['creative', 'innovative', 'novel', 'original'].includes(a.toLowerCase())
      ) ||
      nlpAnalysis.intent.intents.some(i => i.intent === 'express_opinion' && i.confidence > 0.7)
    ) {
      return 'creative';
    }

    // Process: Check nouns and verbs
    if (
      entities.nouns.some(n => ['process', 'workflow', 'procedure'].includes(n.toLowerCase())) &&
      verbs.some(v => ['optimize', 'improve', 'streamline'].includes(v.toLowerCase()))
    ) {
      return 'process';
    }

    // Strategic: Use topics and entities
    if (
      topicCategories.includes('business') ||
      entities.nouns.some(n => ['strategy', 'market', 'competition'].includes(n.toLowerCase()))
    ) {
      return 'strategic';
    }

    // Rescue categories. These run LAST, so they only reclaim problems that
    // would otherwise fall through to 'general' — no existing categorization
    // changes. Each maps to a TechniqueRecommender case group that no category
    // could previously reach, stranding the techniques registered there.
    if (this.detectDecisionPattern(lowerText)) {
      return 'decision';
    }

    if (this.detectCommunicationPattern(lowerText)) {
      return 'communication';
    }

    if (this.detectCulturalPattern(lowerText)) {
      return 'cultural';
    }

    if (this.detectBiologicalPattern(lowerText)) {
      return 'biological';
    }

    if (this.detectRetentionPattern(lowerText)) {
      return 'retention';
    }

    if (this.detectAdversarialPattern(lowerText)) {
      return 'adversarial';
    }

    return 'general';
  }

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
  private detectExplicitEndOfLife(lowerProblem: string): boolean {
    // Decisive signals. Each names the retirement of an existing thing and has
    // no common second sense, so nothing else in the sentence can outweigh it.
    const terminalVerbs = ['decommission', 'drop support', 'phase out', 'phasing out', 'mothball'];

    if (terminalVerbs.some(v => lowerProblem.includes(v))) {
      return true;
    }

    // Also decisive, but each has a common non-retention sense — a retirement
    // plan, a deprecated API throwing warnings, a sunset-themed campaign. The
    // article is what separates the verb from the adjective, so require it.
    if (
      /\b(retire|retiring|deprecate|deprecating|sunset|sunsetting)\s+(the|this|that|our|its|all)\b/.test(
        lowerProblem
      )
    ) {
      return true;
    }

    // Everything below is weaker: it suggests an incumbent is in play without
    // naming a decision about it. A constructive ask outweighs it, because
    // "nobody reads our documentation — how do we fix it?" wants the docs
    // improved, not retired, and the topic detectors route that better.
    //
    // The veto is scoped to these weak signals on purpose. Applying it to the
    // decisive verbs above cost recall in the most natural phrasing of a
    // keep-or-cut question, where the alternative is stated as the other arm:
    // "sunset the v1 API or migrate users to v2?" is a retention decision, and
    // the mention of migrating is the option being weighed, not the ask.
    const constructiveAsk =
      /\b(write|writing|draft|drafting|design|designing|build|building|create|creating|fix|fixing|improve|improving|redesign|rewrite)\b/.test(
        lowerProblem
      );

    if (constructiveAsk) {
      return false;
    }

    // Stated disuse is evidence about an incumbent, not a defect report.
    // "Nobody uses the legacy reporting service" routed to `technical` on what
    // the service is, rather than on what is being asked about it.
    const disuse = ['nobody uses', 'nobody opens', 'nobody reads', 'no one uses', 'no longer used'];
    if (disuse.some(d => lowerProblem.includes(d))) {
      return true;
    }

    // 'cancel' and 'renew' only mean retention next to something being held.
    const heldThings = [
      'subscription',
      'subscriptions',
      'contract',
      'membership',
      'licence',
      'license',
      'seats',
    ];
    if (
      /\b(cancel|cancelling|canceling|renew|renewal|unsubscribe)\b/.test(lowerProblem) &&
      heldThings.some(t => lowerProblem.includes(t))
    ) {
      return true;
    }

    return false;
  }

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
  private detectRetentionPattern(lowerText: string): boolean {
    const retentionKeywords = [
      // Is it still pulling its weight?
      'still need',
      'still needed',
      'still worth',
      'still using',
      'still get value',
      'still earning',
      'earning its keep',
      'do we still',
      'pulling its weight',
      // Keep-or-cut framing
      'keep or cut',
      'keep paying',
      'keep using',
      'worth keeping',
      'worth maintaining',
      // Ending it. The unambiguous verbs are matched earlier, in
      // detectExplicitEndOfLife; only 'shut down' is left here, because a
      // service that shuts down on its own is an outage, not a decision. The
      // article is what separates the two, so it is required.
      'shut down the',
      'shut it down',
      'shutting down the',
      // Cancelling and renewing are matched earlier, paired with the thing
      // being held. Bare 'cancel' belongs in neither list: as a substring it
      // also fires on "write a cancellation policy", which is a writing task.
      // Softer evidence of disuse. The blunt phrasings ('nobody uses') are
      // matched earlier; these are hedged enough to stay behind the topic
      // detectors, where they only reclaim what would fall through anyway.
      'nobody attends',
      'barely use',
      'rarely use',
      'hardly ever',
      // Age as a prompt to re-decide
      'has been in place',
      'been running for',
      'has not been updated',
    ];
    return retentionKeywords.some(keyword => lowerText.includes(keyword));
  }

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
  private detectExplicitAdversarialAsk(lowerProblem: string): boolean {
    // Naming the discipline, or asking for its characteristic move. None of
    // these has a common second sense that survives the whole phrase.
    const decisiveTerms = [
      'red team',
      'red-team',
      'steelman',
      'steel-man',
      'steel man',
      "devil's advocate",
      'devils advocate',
      'play devil',
      'pre-mortem',
      'premortem',
      'argue the other side',
      'argue against',
      'strongest case against',
      'strongest argument against',
      'best case against',
      'make the case against',
      'talk me out of',
      'talk us out of',
      'prove me wrong',
      'prove us wrong',
      // 'what am i missing' is deliberately NOT here. It reads as a request for
      // a blind-spot check only when nothing concrete is on the table; "what am
      // I missing in the nginx config file?" is debugging, and this pass runs
      // ahead of every topic detector, so an ambiguous term here preempts the
      // category that should have claimed it. It sits in the broad detector
      // below instead, where it can only reclaim what nothing else wanted.
      'challenge my assumptions',
      'challenge our assumptions',
      'tear it apart',
      'tear this apart',
      'tear apart',
    ];

    const hasDecisiveTerm = decisiveTerms.some(term => lowerProblem.includes(term));

    // 'stress test' is the one borrowed term with a healthy engineering sense,
    // so it does not join the list above. It counts only next to the thing
    // being tested: a plan can be stress tested adversarially, a database is
    // being load tested. An allowlist of position nouns is safer here than a
    // blocklist of load vocabulary, because the ways to describe load are
    // open-ended and the things you can argue with are not.
    const positionNouns = [
      'plan',
      'decision',
      'argument',
      'case',
      'assumption',
      'assumptions',
      'position',
      'proposal',
      'thesis',
      'strategy',
      'roadmap',
      'design',
      'contract',
      'forecast',
      'reasoning',
    ];
    const stressTestsAPosition =
      /\bstress[- ]test(ing|ed|s)?\b/.test(lowerProblem) &&
      positionNouns.some(noun => lowerProblem.includes(noun));

    // Verb-gated, because the bare noun phrase is a defect report: 'there are
    // holes in the coverage report' is not a request to be argued with.
    const pokesHoles =
      /\b(poke[ds]?|poking|pick(ed|s)?|picking|punch(ed|es)?|punching|shoot|shot)\s+(some\s+|any\s+|a\s+few\s+)?holes\b/.test(
        lowerProblem
      );
    const convinceMeWrong = /\bconvince\s+(me|us)\s+(i'?m|we'?re|i am|we are)\s+wrong\b/.test(
      lowerProblem
    );

    if (!hasDecisiveTerm && !stressTestsAPosition && !pokesHoles && !convinceMeWrong) {
      return false;
    }

    // One veto, and it is narrow on purpose. Writing a document *about*
    // adversarial review is an authoring task: 'write the red team engagement
    // report template' wants a template, not an attack. The general
    // constructive-ask veto used by the retention detector cannot be reused
    // here — 'red team the design before we build it' and 'poke holes in this
    // before we ship' are the natural phrasings of a genuine request and both
    // contain constructive verbs. So the veto requires an authoring verb *and*
    // a document noun together.
    const authoringVerb =
      /\b(write|writing|draft|drafting|document|documenting|author|authoring)\b/.test(lowerProblem);
    const documentNoun =
      /\b(template|templates|report|reports|playbook|policy|charter|checklist|guide|guideline|guidelines|curriculum|training|doc|docs|documentation|runbook|handbook)\b/.test(
        lowerProblem
      );
    if (authoringVerb && documentNoun) {
      return false;
    }

    return true;
  }

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
  private detectAdversarialPattern(lowerText: string): boolean {
    const adversarialKeywords = [
      // Asking for the failure directly
      'what could go wrong',
      'what might go wrong',
      'how could this fail',
      'how might this fail',
      'how would this fail',
      'why might this be wrong',
      'failure mode',
      'failure modes',
      'worst case',
      'worst-case',
      // Asking to be opposed
      'counterargument',
      'counter-argument',
      'other side of the argument',
      'push back on',
      'pushback on',
      'change my mind',
      'change our mind',
      // Asking what the room missed
      'what am i missing',
      'what are we missing',
      'blind spot',
      'blind spots',
      'weakness in',
      'weaknesses in',
      'everyone agreed',
      'agreed too quickly',
      'sanity check',
      // Pre-commitment framing
      'before we commit',
      'before committing',
      'what would have to be true',
    ];

    if (!adversarialKeywords.some(keyword => lowerText.includes(keyword))) {
      return false;
    }

    // Two vetoes, both measured rather than guessed.
    //
    // The comment above predicted that `technical` and `computational` would
    // claim performance phrasings long before this point. They do not: 'what is
    // the worst case latency under load?' reached here and was reclaimed. So
    // the performance sense of 'worst case' is vetoed explicitly.
    if (
      /\b(latency|throughput|rps|qps|requests per second|concurrency|load|benchmark|soak|p95|p99)\b/.test(
        lowerText
      )
    ) {
      return false;
    }

    // Naming a concrete artefact under inspection makes these phrases a
    // debugging question rather than a request for opposition. "What am I
    // missing in the nginx config file?" wants the config read, not the
    // decision attacked.
    //
    // 'log' is deliberately absent: an audit log or a retention policy for logs
    // is a subject you can legitimately be argued with about, and the debugging
    // sense is already carried by the terms below.
    if (
      /\b(config|configuration|stack trace|traceback|error message|compiler|syntax|typo)\b/.test(
        lowerText
      )
    ) {
      return false;
    }

    // A constructive ask outweighs these weak signals, the same way it does in
    // the retention detector: 'fix the blind spot in the rear camera UI' wants
    // the camera fixed, not the plan attacked. This veto is safe here and not
    // in the explicit pass above, where 'red team the design before we build
    // it' is the natural phrasing of a genuine request.
    //
    // The verb has to be in verb position, which a bare word list cannot tell.
    // Matching anywhere cost a true positive immediately: 'what are the failure
    // modes of this design' was vetoed on the noun. So require the verb to open
    // the request, or to follow one of the few markers that force a verb
    // reading.
    const constructiveVerb =
      'write|draft|design|build|create|fix|implement|improve|redesign|rewrite|add';
    if (
      new RegExp(`^\\s*(${constructiveVerb})\\b`).test(lowerText) ||
      new RegExp(
        `\\b(to|should|help me|help us|how do we|how can we|can you|need to|want to|trying to)\\s+(${constructiveVerb})\\b`
      ).test(lowerText)
    ) {
      return false;
    }

    return true;
  }

  /**
   * Detect decision/judgment problems — choosing between options, weighing
   * trade-offs, committing to a course of action.
   */
  private detectDecisionPattern(lowerText: string): boolean {
    const decisionKeywords = [
      'should we',
      'should i',
      'decide',
      'decision',
      'choose between',
      'choice between',
      'which option',
      'which approach',
      'which vendor',
      'trade-off',
      'tradeoff',
      'pros and cons',
      'weigh the options',
      'go/no-go',
      'worth it',
    ];
    return decisionKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Detect communication/stakeholder problems — conveying, persuading,
   * aligning, or explaining to an audience.
   */
  private detectCommunicationPattern(lowerText: string): boolean {
    const communicationKeywords = [
      'communicate',
      'communication',
      'stakeholder',
      'buy-in',
      'persuade',
      'convince',
      'messaging',
      'audience',
      'get alignment',
      'explain to',
    ];
    return communicationKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Detect cultural problems — cross-cultural collaboration, localization,
   * and globally distributed contexts.
   */
  private detectCulturalPattern(lowerText: string): boolean {
    const culturalKeywords = [
      'culture',
      'cultural',
      'cross-cultural',
      'multicultural',
      'localization',
      'localize',
      'international team',
      'global team',
    ];
    return culturalKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Detect biological/evolutionary problems — adaptation, selection, and
   * nature-inspired design.
   */
  private detectBiologicalPattern(lowerText: string): boolean {
    const biologicalKeywords = [
      'biomimicry',
      'biomimetic',
      'organism',
      'evolutionary',
      'natural selection',
      'symbiosis',
      'swarm',
      'adapt to survive',
      'self-healing',
    ];
    return biologicalKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Detect paradoxical patterns using enhanced NLP
   * Note: Now called ONLY when needed since categorizeProblem handles most cases
   */
  private detectParadoxicalPattern(text: string): boolean {
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
  hasTimeConstraint(problem: string, constraints?: string[]): boolean {
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
  needsCollaboration(problem: string, context?: string): boolean {
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
    return topics.keywords.some(keyword =>
      collabKeywords.some(collab => keyword.toLowerCase().includes(collab))
    );
  }

  /**
   * Fast-path check for explicit technique requests (avoids NLP overhead)
   */
  private checkExplicitTechniqueRequest(text: string, lowerText?: string): string | null {
    const lower = lowerText || text.toLowerCase();

    // Fast-path for explicit temporal keywords (deadlines, time management)
    if (
      lower.includes('deadline') ||
      lower.includes('time management') ||
      lower.includes('schedule')
    ) {
      return 'temporal';
    }

    // Fast-path for explicit cultural/global/organizational keywords
    if (
      lower.includes('cultural') ||
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
      lower.includes('emergent')
    ) {
      return 'organizational';
    }

    // Fast-path for explicit cognitive/mental keywords
    // Use pre-compiled regex to avoid false positives like 'fundamental' matching 'mental'
    if (this.COGNITIVE_PATTERN.test(lower)) {
      return 'cognitive';
    }

    // Map explicit technique mentions to categories
    const techniqueMap: Record<string, string> = {
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
      // 'steelman' and 'red team' deliberately absent. This map is a
      // substring fast-path with no vetoes, and it runs before everything —
      // so 'write the red team engagement report template', an authoring
      // task, would be routed as a request to be attacked. The explicit pass
      // in detectExplicitAdversarialAsk catches the same phrasings and carries
      // the veto, so the fast-path buys nothing but the false positive.
      // keeper_test, cognitive_bias_audit and latticework are absent for
      // their own reasons; this map has not tracked the catalogue since.
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
  private detectBehavioralPattern(
    nlpAnalysis: ReturnType<NLPService['analyze']>,
    lowerText: string
  ): boolean {
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
    if (hasDirectMatch) return true;

    const hasKeywords = nlpAnalysis.topics.keywords.some(k =>
      behavioralKeywords.some(b => k.toLowerCase().includes(b))
    );

    const hasPsychCategory = nlpAnalysis.topics.categories.includes('psychology');
    const hasMoneyEntities = nlpAnalysis.entities.money.length > 0;

    return hasKeywords || hasPsychCategory || hasMoneyEntities;
  }

  /**
   * Detect fundamental/first principles patterns using NLP analysis
   */
  private detectFundamentalPattern(
    nlpAnalysis: ReturnType<NLPService['analyze']>,
    lowerText: string
  ): boolean {
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
    if (hasDirectMatch) return true;

    const hasKeywords = nlpAnalysis.topics.keywords.some(k =>
      fundamentalKeywords.some(f => k.toLowerCase().includes(f))
    );

    // Check for questions about "why" which often indicate fundamental analysis
    const hasWhyQuestions = nlpAnalysis.pos.sentences.some(
      s => s.type === 'question' && s.text.toLowerCase().includes('why')
    );

    return hasKeywords || hasWhyQuestions;
  }

  /**
   * Detect learning/adaptive patterns using NLP analysis
   */
  private detectLearningPattern(
    nlpAnalysis: ReturnType<NLPService['analyze']>,
    lowerText: string
  ): boolean {
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
    if (hasDirectMatch) return true;

    const hasKeywords = nlpAnalysis.topics.keywords.some(k =>
      learningKeywords.some(l => k.toLowerCase().includes(l))
    );

    // Check for education or knowledge topics
    const hasEducationCategory =
      nlpAnalysis.topics.categories.includes('education') ||
      nlpAnalysis.topics.categories.includes('knowledge');

    return hasKeywords || hasEducationCategory;
  }

  /**
   * Detect computational/algorithmic patterns using NLP analysis
   */
  private detectComputationalPattern(
    nlpAnalysis: ReturnType<NLPService['analyze']>,
    lowerText: string
  ): boolean {
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
    if (hasDirectMatch) return true;

    const hasKeywords = nlpAnalysis.topics.keywords.some(k =>
      computationalKeywords.some(c => k.toLowerCase().includes(c))
    );

    // Check for technology topics and complex technical language
    const hasTechCategory = nlpAnalysis.topics.categories.includes('technology');
    const hasComplexity =
      nlpAnalysis.readability.clarity === 'complex' ||
      nlpAnalysis.readability.clarity === 'very_complex';

    return hasKeywords || (hasTechCategory && hasComplexity);
  }

  /**
   * Detect validation/verification patterns using NLP analysis
   */
  private detectValidationPattern(
    nlpAnalysis: ReturnType<NLPService['analyze']>,
    lowerText: string
  ): boolean {
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
    if (hasDirectMatch) return true;

    const hasKeywords = nlpAnalysis.topics.keywords.some(k =>
      validationKeywords.some(v => k.toLowerCase().includes(v))
    );

    // Check for questions about verification
    const hasVerificationQuestions = nlpAnalysis.pos.sentences.some(
      s =>
        s.type === 'question' &&
        (s.text.toLowerCase().includes('true') ||
          s.text.toLowerCase().includes('real') ||
          s.text.toLowerCase().includes('valid'))
    );

    return hasKeywords || hasVerificationQuestions;
  }

  /**
   * Fallback categorization when NLP service fails
   * Uses simple keyword matching without NLP analysis
   */
  private fallbackCategorization(lowerText: string): string {
    // Check most common patterns using simple keyword matching
    if (
      lowerText.includes('technical') ||
      lowerText.includes('engineer') ||
      lowerText.includes('code')
    ) {
      return 'technical';
    }
    if (
      lowerText.includes('creative') ||
      lowerText.includes('innovate') ||
      lowerText.includes('idea')
    ) {
      return 'creative';
    }
    if (
      lowerText.includes('process') ||
      lowerText.includes('workflow') ||
      lowerText.includes('optimize')
    ) {
      return 'process';
    }
    if (
      lowerText.includes('team') ||
      lowerText.includes('organization') ||
      lowerText.includes('collaborate')
    ) {
      return 'organizational';
    }
    if (
      lowerText.includes('strategy') ||
      lowerText.includes('business') ||
      lowerText.includes('market')
    ) {
      return 'strategic';
    }
    if (
      lowerText.includes('system') ||
      lowerText.includes('architect') ||
      lowerText.includes('component')
    ) {
      return 'systems';
    }
    if (
      lowerText.includes('user') ||
      lowerText.includes('customer') ||
      lowerText.includes('experience')
    ) {
      return 'user-centered';
    }

    // Default to general if no specific category matches
    return 'general';
  }
}
