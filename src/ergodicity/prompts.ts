/**
 * Ergodicity awareness prompts for thinking techniques
 * Ensures users consider ensemble vs time averages and ruin risk
 */

import type { LateralTechnique } from '../types/index.js';

export interface ErgodicityPrompt {
  trigger: 'always' | 'high-risk' | 'irreversible';
  promptText: string;
  followUp?: string;
  ruinCheckRequired?: boolean;
}

export interface RuinRiskAssessment {
  domain: string;
  isIrreversible: boolean;
  survivabilityThreatened: boolean;
  ensembleVsTimeAverage: 'ensemble' | 'time' | 'both';
  recommendation: string;
}

/**
 * Get ergodicity prompts for a specific technique and step
 */
export function getErgodicityPrompt(
  technique: LateralTechnique,
  step: number,
  problem: string
): ErgodicityPrompt | null {
  // Universal prompt for first steps
  if (step === 1) {
    return {
      trigger: 'always',
      promptText: `🎲 Before we begin: Is "${problem}" in an ergodic domain (where time and ensemble averages converge)? Consider:
• Can you recover from bad outcomes, or is there a risk of ruin?
• Are you optimizing for one path (time average) or many possible paths (ensemble average)?
• Is survival a constraint (e.g., staying solvent, staying healthy)?`,
      followUp: 'If ruin is possible, we must prioritize survival over optimization.',
      ruinCheckRequired: true,
    };
  }

  // Technique-specific high-risk prompts
  const highRiskPrompts: Partial<Record<LateralTechnique, ErgodicityPrompt>> = {
    scamper: {
      trigger: 'high-risk',
      promptText: '⚠️ SCAMPER modifications can create irreversible changes. Before proceeding:',
      followUp:
        'Are you considering ensemble outcomes (what happens across many attempts) or just this single path?',
      ruinCheckRequired: true,
    },
    disney_method: {
      trigger: 'high-risk',
      promptText: '🎬 Disney Method moves from dream to reality. Critical check:',
      followUp:
        'In the Realist/Critic phases, ensure survival constraints are met before optimization.',
      ruinCheckRequired: true,
    },
    design_thinking: {
      trigger: 'high-risk',
      promptText: '🎨 Design Thinking creates user commitments. Consider:',
      followUp:
        'Prototype failures in ergodic domains are learning. In non-ergodic domains, they can be fatal.',
      ruinCheckRequired: true,
    },
    yes_and: {
      trigger: 'high-risk',
      promptText: '➕ Yes, And builds commitments incrementally. Warning:',
      followUp:
        'Each "yes" in a non-ergodic domain reduces future flexibility. Is this path reversible?',
    },
  };

  // Check for specific high-risk steps
  if (technique === 'scamper' && step === 6) {
    // Eliminate step
    return {
      trigger: 'irreversible',
      promptText: '❌ ELIMINATE is often irreversible. Critical ergodicity check:',
      followUp:
        'In non-ergodic domains, elimination can lead to ruin. Do you have a recovery path?',
      ruinCheckRequired: true,
    };
  }

  if (technique === 'six_hats' && step === 7) {
    // Purple Hat - path dependency
    return {
      trigger: 'always',
      promptText: '🟣 Purple Hat: Analyzing path dependencies and ergodicity:',
      followUp: 'Which decisions would be irreversible? How can we preserve optionality?',
      ruinCheckRequired: false,
    };
  }

  return highRiskPrompts[technique] || null;
}

/**
 * Check if a decision requires ruin risk assessment
 */
export function requiresRuinCheck(technique: LateralTechnique, keywords: string[]): boolean {
  const ruinKeywords = [
    'invest',
    'spend',
    'commit',
    'eliminate',
    'remove',
    'delete',
    'permanent',
    'irreversible',
    'all-in',
    'bet',
    'risk',
    'health',
    'safety',
    'survival',
    'bankruptcy',
    'fatal',
    'critical',
  ];

  const hasRuinKeyword = keywords.some(keyword =>
    ruinKeywords.some(ruinWord => keyword.toLowerCase().includes(ruinWord))
  );

  const highRiskTechniques: LateralTechnique[] = [
    'scamper',
    'disney_method',
    'design_thinking',
    'yes_and',
  ];

  return hasRuinKeyword || highRiskTechniques.includes(technique);
}

/**
 * Generate ruin risk assessment prompt
 */
export function generateRuinAssessmentPrompt(
  problem: string,
  technique: LateralTechnique,
  proposedAction: string
): string {
  return `🚨 RUIN RISK ASSESSMENT for "${problem}":

Proposed action: ${proposedAction}

Please evaluate:
1. **Reversibility**: Can this decision be undone? At what cost?
2. **Survival Impact**: Does failure threaten survival (financial, health, reputation)?
3. **Ensemble vs Time**:
   - Time average: What happens if I repeat this decision over time?
   - Ensemble average: What happens to many people/entities trying this?
4. **Absorbing Barriers**: Are there points of no return?

If ruin is possible:
- Add survival constraints before optimization
- Consider barbell strategies (safe + speculative)
- Preserve optionality
- Plan escape routes

Remember: In non-ergodic domains, you can't recover from ruin to try again.`;
}

/**
 * Get technique-specific ergodicity guidance
 */
export function getErgodicityGuidance(technique: LateralTechnique): string {
  const guidance: Partial<Record<LateralTechnique, string>> = {
    scamper: 'SCAMPER creates path dependencies. Evaluate reversibility for each modification.',
    disney_method: 'Dreams are ergodic (you can dream again). Implementation may not be.',
    design_thinking:
      'User research is ergodic. Product launches may create irreversible commitments.',
    triz: 'Technical contradictions often hide non-ergodic constraints. Check system boundaries.',
    yes_and: 'Each "yes" compounds. In non-ergodic domains, this can lead to overcommitment.',
    po: 'Provocations are safe in ergodic domains. In non-ergodic ones, even thoughts can commit.',
    six_hats: 'Black Hat thinking is crucial for identifying non-ergodic risks.',
    random_entry: 'Random connections are harmless unless they trigger irreversible actions.',
    concept_extraction: 'Extracting concepts is ergodic. Applying them may not be.',
    temporal_work: 'Time itself is non-ergodic. You cannot recover lost time.',
    cross_cultural:
      'Cultural missteps in non-ergodic domains can permanently damage relationships.',
    collective_intel:
      'Collective wisdom often embeds survival knowledge from non-ergodic experiences.',
    nine_windows: 'Past/present/future analysis reveals non-ergodic transitions.',
    neural_state: 'Mental states are generally ergodic, but trauma creates absorbing barriers.',
  };

  return (
    guidance[technique] ||
    'Consider whether this domain allows recovery from failures or if ruin is possible.'
  );
}

/**
 * Assess ruin risk from user input
 */
export function assessRuinRisk(
  problem: string,
  technique: LateralTechnique,
  userResponse: string
): RuinRiskAssessment {
  const lowerResponse = userResponse.toLowerCase();

  // Check for explicit irreversibility mentions
  const irreversibleKeywords = [
    'irreversible',
    'permanent',
    'cannot undo',
    "can't recover",
    'no going back',
    'one-way',
    'final',
  ];
  const isIrreversible = irreversibleKeywords.some(keyword => lowerResponse.includes(keyword));

  // Check for survival threats
  const survivalKeywords = [
    'bankrupt',
    'die',
    'fatal',
    'survival',
    'ruin',
    'lose everything',
    'game over',
    'existential',
  ];
  const survivabilityThreatened = survivalKeywords.some(keyword => lowerResponse.includes(keyword));

  // Determine ensemble vs time average
  let ensembleVsTimeAverage: 'ensemble' | 'time' | 'both' = 'time';
  const hasEnsemble = lowerResponse.includes('ensemble') || lowerResponse.includes('many people');
  const hasTime = lowerResponse.includes('time average') || lowerResponse.includes('time');

  if (hasEnsemble && hasTime) {
    ensembleVsTimeAverage = 'both';
  } else if (hasEnsemble) {
    ensembleVsTimeAverage = 'ensemble';
  }

  // Determine domain
  let domain = 'general';
  if (lowerResponse.includes('financ') || lowerResponse.includes('money')) domain = 'financial';
  else if (lowerResponse.includes('health') || lowerResponse.includes('medic')) domain = 'health';
  else if (lowerResponse.includes('career') || lowerResponse.includes('job')) domain = 'career';
  else if (lowerResponse.includes('relation') || lowerResponse.includes('family'))
    domain = 'relationship';

  // Generate recommendation
  let recommendation = 'Proceed with standard creative thinking process.';
  if (survivabilityThreatened) {
    recommendation =
      '⚠️ HIGH RISK: Add strict survival constraints. Consider barbell strategy (90% safe, 10% speculative).';
    // Also add ensemble-specific advice if relevant
    if (ensembleVsTimeAverage === 'ensemble' || ensembleVsTimeAverage === 'both') {
      recommendation += ' Consider what happens to many attempts, not just your single path.';
    }
  } else if (isIrreversible) {
    recommendation =
      '⚡ CAUTION: Build in escape routes and reversibility. Test with small, recoverable experiments first.';
  } else if (ensembleVsTimeAverage === 'ensemble') {
    recommendation = '📊 Consider what happens to many attempts, not just your single path.';
  } else if (ensembleVsTimeAverage === 'both') {
    recommendation =
      '📊 Consider what happens to many attempts over time, not just your single path.';
  }

  return {
    domain,
    isIrreversible,
    survivabilityThreatened,
    ensembleVsTimeAverage,
    recommendation,
  };
}

/**
 * Generate survival constraints based on domain
 */
export function generateSurvivalConstraints(domain: string): string[] {
  const constraints: Record<string, string[]> = {
    financial: [
      'Maintain minimum 6 months emergency fund',
      'Never risk more than 10% on a single decision',
      'Ensure ability to meet fixed obligations',
      'Preserve core income streams',
    ],
    health: [
      'No irreversible procedures without second opinion',
      'Maintain baseline health metrics',
      'Ensure access to emergency care',
      'Preserve ability to recover',
    ],
    career: [
      'Maintain marketable skills',
      'Preserve professional network',
      'Keep reputation intact',
      'Ensure transitional income',
    ],
    relationship: [
      'Preserve trust and communication',
      'Maintain personal boundaries',
      'Ensure emotional safety',
      'Keep support systems intact',
    ],
    general: [
      'Identify what cannot be lost',
      'Set maximum acceptable loss',
      'Build in recovery mechanisms',
      'Maintain optionality',
    ],
  };

  return constraints[domain] || constraints.general;
}
