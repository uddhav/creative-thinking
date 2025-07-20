// Examples demonstrating the enhanced techniques with unified framework

const enhancedTechniquesExamples = {
  // 1. Six Hats Plus with Black Swan Awareness
  sixHatsEnhanced: {
    blueHatPlus: {
      technique: 'six_hats',
      problem: 'Should we implement AI-driven customer service?',
      currentStep: 1,
      totalSteps: 6,
      hatColor: 'blue',
      output:
        "Starting our analysis with awareness of meta-uncertainty. We'll examine AI customer service from multiple perspectives, but acknowledge there may be unknown unknowns we haven't considered.",
      risks: ['Unforeseen AI behaviors in production', "Regulatory changes we can't predict"],
      blackSwans: ['AI achieving unexpected autonomy levels', 'Global AI ethics backlash'],
      nextStepNeeded: true,
    },

    whiteHatPlus: {
      sessionId: 'session_123', // From previous response
      technique: 'six_hats',
      problem: 'Should we implement AI-driven customer service?',
      currentStep: 2,
      totalSteps: 6,
      hatColor: 'white',
      output:
        "Current facts: 70% cost reduction potential, 24/7 availability. Unknown unknowns: We don't know what we don't know about customer emotional responses to AI over time.",
      risks: ['Data gaps in long-term customer satisfaction', 'Hidden biases in training data'],
      nextStepNeeded: true,
    },

    blackHatPlus: {
      sessionId: 'session_123',
      technique: 'six_hats',
      problem: 'Should we implement AI-driven customer service?',
      currentStep: 5,
      totalSteps: 6,
      hatColor: 'black',
      output:
        'Critical risks include catastrophic failures during peak times, AI hallucinations causing legal issues, and discontinuous jumps in customer behavior.',
      failureModes: [
        'Complete AI meltdown during Black Friday',
        'Cascading trust failure across customer base',
        'Legal liability from incorrect AI advice',
      ],
      blackSwans: [
        'Competitor releases revolutionary human-AI hybrid',
        'Major data breach exposing AI vulnerabilities',
      ],
      nextStepNeeded: true,
    },
  },

  // 2. PO with Systematic Verification
  poEnhanced: {
    step1_provocation: {
      technique: 'po',
      problem: 'How to reduce meeting fatigue?',
      currentStep: 1,
      totalSteps: 4,
      output: 'Po: All meetings are conducted while walking',
      provocation: 'All meetings are conducted while walking',
      nextStepNeeded: true,
    },

    step2_verify: {
      sessionId: 'session_456',
      technique: 'po',
      problem: 'How to reduce meeting fatigue?',
      currentStep: 2,
      totalSteps: 4,
      output:
        'Exploring the provocation reveals energy benefits, but challenging it shows: accessibility issues, weather dependency, technology limitations. The core insight is movement increases engagement.',
      risks: [
        'Excludes team members with mobility issues',
        'Technical difficulties with mobile devices',
        'Weather-dependent in many locations',
      ],
      mitigations: [
        'Optional walking with virtual alternative',
        'Indoor walking spaces',
        'Standing desk options as alternative',
      ],
      nextStepNeeded: true,
    },

    step3_test: {
      sessionId: 'session_456',
      technique: 'po',
      problem: 'How to reduce meeting fatigue?',
      currentStep: 3,
      totalSteps: 4,
      output:
        'Testing principles: Movement increases engagement (verified in 3 pilot groups), but must be optional. Hypothesis: Any form of physical activity during meetings improves outcomes.',
      principles: [
        'Movement enhances cognitive function',
        'Choice of participation crucial for inclusion',
        'Environmental variety reduces monotony',
      ],
      risks: [
        'Not all meeting types benefit from movement',
        'Some complex discussions need stillness',
      ],
      nextStepNeeded: true,
    },
  },

  // 3. Random Entry with Systematic Doubt
  randomEntryEnhanced: {
    step2_connections: {
      sessionId: 'session_789',
      technique: 'random_entry',
      problem: 'How to improve employee retention?',
      currentStep: 2,
      totalSteps: 3,
      randomStimulus: 'Coral reef',
      output:
        'Connections with doubt: Like coral reefs, companies need biodiversity (but is this always true? Startups thrive with homogeneity initially). Symbiotic relationships matter (but forced collaboration can backfire).',
      connections: [
        'Biodiversity → Team diversity',
        'Symbiosis → Mutual support systems',
        'Reef structure → Organizational scaffolding',
      ],
      risks: [
        'Diversity without shared values causes fragmentation',
        'Too much interdependence creates fragility',
        'Rigid structures prevent adaptation',
      ],
      nextStepNeeded: true,
    },
  },

  // 4. SCAMPER with Pre-Mortem
  scamperEnhanced: {
    substitute: {
      technique: 'scamper',
      problem: 'How to improve our project management process?',
      currentStep: 1,
      totalSteps: 7,
      scamperAction: 'substitute',
      output:
        'Substitute traditional meetings with async video updates. Pre-mortem: What if team members ignore videos? Time zones still problematic? Loss of real-time problem-solving?',
      risks: [
        'Reduced team cohesion',
        'Important details missed in async format',
        'Delayed decision-making',
      ],
      mitigations: [
        'Mandatory acknowledgment system',
        'Weekly sync for critical issues',
        'Clear escalation protocols',
      ],
      nextStepNeeded: true,
    },

    eliminate: {
      sessionId: 'session_abc',
      technique: 'scamper',
      problem: 'How to improve our project management process?',
      currentStep: 6,
      totalSteps: 7,
      scamperAction: 'eliminate',
      output:
        'Eliminate status update meetings. Pre-mortem: Hidden dependencies emerge too late, stakeholders feel disconnected, critical issues go unnoticed until crisis.',
      failureModes: [
        'Silent project derailment',
        'Stakeholder surprise at deliverables',
        'Team silos develop',
      ],
      mitigations: [
        'Automated status dashboards',
        'Exception-based reporting',
        'Peer review checkpoints',
      ],
      nextStepNeeded: true,
    },
  },

  // 5. Concept Extraction with Failure Analysis
  conceptExtractionEnhanced: {
    step2_extract: {
      sessionId: 'session_def',
      technique: 'concept_extraction',
      problem: 'How to scale customer support?',
      currentStep: 2,
      totalSteps: 4,
      output:
        "Extracting from Stack Overflow: community-driven support, reputation systems, self-moderation. Where it wouldn't work: regulated industries, confidential issues, urgent problems.",
      extractedConcepts: ['Peer-to-peer support', 'Gamified contributions', 'Community moderation'],
      failureModes: [
        'Incorrect advice spreading virally',
        'Gaming of reputation system',
        'Confidential data exposure',
      ],
      nextStepNeeded: true,
    },

    step4_apply: {
      sessionId: 'session_def',
      technique: 'concept_extraction',
      problem: 'How to scale customer support?',
      currentStep: 4,
      totalSteps: 4,
      output:
        'Apply community support only for non-critical, public issues. Success probability high for: FAQ-type questions, feature requests, best practices. Low for: billing, security, complaints.',
      applications: [
        'Public community forum for general questions',
        'Peer recognition system for helpful users',
        'Escalation path to professional support',
      ],
      risks: [
        'Brand damage from bad community advice',
        'Legal liability for peer recommendations',
        'Support quality inconsistency',
      ],
      mitigations: [
        'Clear disclaimers on community advice',
        'Professional moderation team',
        'Automated accuracy checking',
      ],
      antifragileProperties: [
        'Community knowledge grows with problems',
        'Peer experts emerge naturally',
        'System improves through usage',
      ],
      nextStepNeeded: false,
    },
  },
};

// Example showing complete session with metrics
const completedEnhancedSession = {
  sessionId: 'session_xyz',
  technique: 'po',
  currentStep: 4,
  totalSteps: 4,
  nextStepNeeded: false,
  completed: true,
  insights: [
    'Extracted principles: Movement enhances engagement, Choice enables inclusion',
    'Systematic verification revealed 3 critical failure modes',
    'Robust implementation designed with 5 mitigation strategies',
  ],
  summary: 'Lateral thinking session completed using po technique',
  metrics: {
    duration: 240000, // 4 minutes
    creativityScore: 7.8,
    risksCaught: 8,
    antifragileFeatures: 3,
  },
};

console.log('Enhanced Techniques Demonstration');
console.log('==================================');
console.log('\nKey Enhancements:');
console.log('1. Six Hats Plus: Each hat now considers meta-level uncertainties');
console.log('2. PO Verified: Provocations are systematically challenged and tested');
console.log("3. Random Entry Doubted: All connections questioned with 'Is this always true?'");
console.log('4. SCAMPER Pre-Mortem: Each transformation includes failure analysis');
console.log('5. Concept Extraction Bounded: Patterns include domain limitations');
console.log('\nAll techniques now produce both creative and critical outputs!');
