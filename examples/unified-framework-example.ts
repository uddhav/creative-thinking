// Example demonstrating unified framework features with risk/adversarial thinking

const unifiedFrameworkExample = {
  // Six Hats with Black Swan Awareness - Black Hat example
  sixHatsBlackHat: {
    technique: 'six_hats',
    problem: 'Should we migrate our monolith to microservices?',
    currentStep: 5,
    totalSteps: 6,
    hatColor: 'black',
    output:
      'Critical risks include: distributed system complexity, data consistency challenges, increased operational overhead, network latency issues, and debugging difficulties across services.',
    risks: [
      'Cascading failures across services',
      'Data inconsistency in distributed transactions',
      'Exponential increase in deployment complexity',
    ],
    blackSwans: [
      'Complete service mesh failure during Black Friday',
      'Subtle race condition causing data corruption discovered after months',
    ],
    failureModes: [
      'Service discovery breakdown',
      'Message queue overflow',
      'Authentication token expiry cascade',
    ],
    nextStepNeeded: true,
  },

  // PO with Systematic Verification
  poWithVerification: {
    technique: 'po',
    problem: 'How to reduce meeting fatigue in remote teams?',
    currentStep: 2,
    totalSteps: 4,
    provocation: 'Po: All meetings happen in virtual reality',
    output:
      'Testing the provocation: While full VR might be extreme, we can extract principles like spatial audio for better conversation flow, avatar presence for engagement, and virtual environments for context switching.',
    risks: [
      'VR headset fatigue',
      'Accessibility issues for team members',
      'Technical barriers and equipment costs',
    ],
    mitigations: [
      'Optional VR with traditional fallback',
      'Short VR sessions (15-20 min max)',
      'Company-provided equipment program',
    ],
    nextStepNeeded: true,
  },

  // Yes, And... with But evaluation (already enhanced)
  yesAndButExample: {
    technique: 'yes_and',
    problem: 'How to improve code review process?',
    currentStep: 3,
    totalSteps: 4,
    output:
      'But we need to consider: reviewer fatigue from AI suggestions, potential over-reliance on automated feedback, privacy concerns with code analysis, and the risk of missing nuanced architectural issues that require human insight.',
    evaluations: [
      'AI might miss context-specific best practices',
      'Automated reviews could reduce human learning opportunities',
      'Security risks if AI has access to proprietary code',
    ],
    risks: ['Decreased human reviewer engagement', 'AI hallucinations in code suggestions'],
    mitigations: [
      'AI as assistant, not replacement',
      'Regular audits of AI suggestions',
      'Maintain human review requirements',
    ],
    nextStepNeeded: true,
  },

  // Concept Extraction with Failure Mode Analysis
  conceptExtractionEnhanced: {
    technique: 'concept_extraction',
    problem: 'How to scale customer support?',
    currentStep: 4,
    totalSteps: 4,
    output:
      "Applying the extracted patterns to our problem: Implement a community-driven support model with reputation systems, but recognize it won't work for: sensitive data issues, complex technical problems, or regulated industries. Add professional escalation paths.",
    applications: [
      'Community forums with gamification',
      'Peer-to-peer video support sessions',
      'Knowledge base with user contributions',
    ],
    failureModes: [
      'Incorrect advice spreading virally',
      'Privacy breaches in community forums',
      'Reputation gaming and manipulation',
    ],
    mitigations: [
      'Expert moderation and fact-checking',
      'Clear escalation to professional support',
      'Anonymous posting options for sensitive issues',
    ],
    antifragileProperties: [
      'Community grows stronger with more edge cases',
      'Collective knowledge improves over time',
      'Peer recognition creates self-improving system',
    ],
    nextStepNeeded: false,
  },
};

// Example showing meta-learning data in response
const completedSessionResponse = {
  sessionId: 'session_1234567890_abc123',
  technique: 'concept_extraction',
  currentStep: 4,
  totalSteps: 4,
  nextStepNeeded: false,
  completed: true,
  insights: [
    'Core concepts identified: peer support, gamification, community knowledge',
    'Abstracted patterns: distributed expertise, incentive alignment, collective intelligence',
    '3 new applications generated for your problem',
  ],
  summary: 'Lateral thinking session completed using concept_extraction technique',
  metrics: {
    duration: 180000, // 3 minutes
    creativityScore: 8.5,
    risksCaught: 6,
    antifragileFeatures: 3,
  },
};

console.log('Unified Framework Examples');
console.log('=========================');
console.log('\nThese examples show how to use the new risk/adversarial fields:');
console.log('- risks: Potential issues identified');
console.log('- failureModes: Ways the solution could fail');
console.log('- mitigations: Strategies to address risks');
console.log('- antifragileProperties: How solution benefits from stress');
console.log('- blackSwans: Low probability, high impact events');
console.log('\nThe visual output will now include:');
console.log('- Mode indicators (✨ for creative, ⚠️ for critical)');
console.log('- Risk sections highlighted in yellow');
console.log('- Mitigation sections highlighted in green');
console.log('- Metrics tracking for meta-learning');
