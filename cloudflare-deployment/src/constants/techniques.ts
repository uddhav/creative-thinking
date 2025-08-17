/**
 * Valid thinking techniques and their configurations
 */

export const VALID_TECHNIQUES = [
  'six_hats',
  'po',
  'random_entry',
  'scamper',
  'concept_extraction',
  'yes_and',
  'design_thinking',
  'triz',
  'neural_state',
  'temporal_work',
  'cross_cultural',
  'collective_intel',
  'disney_method',
  'nine_windows',
  'quantum_superposition',
  'temporal_creativity',
  'paradoxical_problem',
  'meta_learning',
  'biomimetic_path',
  'first_principles',
  'cultural_path',
  'neuro_computational',
] as const;

export type ValidTechnique = (typeof VALID_TECHNIQUES)[number];

export const TECHNIQUE_STEP_COUNTS: Record<ValidTechnique, number> = {
  six_hats: 6,
  po: 4,
  random_entry: 3,
  scamper: 8,
  concept_extraction: 4,
  yes_and: 4,
  design_thinking: 5,
  triz: 4,
  neural_state: 4,
  temporal_work: 5,
  cross_cultural: 5,
  collective_intel: 5,
  disney_method: 3,
  nine_windows: 9,
  quantum_superposition: 6,
  temporal_creativity: 6,
  paradoxical_problem: 5,
  meta_learning: 5,
  biomimetic_path: 6,
  first_principles: 4,
  cultural_path: 5,
  neuro_computational: 6,
};

/**
 * Validates if a technique name is valid
 */
export function isValidTechnique(technique: string): technique is ValidTechnique {
  return VALID_TECHNIQUES.includes(technique as ValidTechnique);
}

/**
 * Get step count for a technique with validation
 */
export function getStepCountForTechnique(technique: string): number {
  if (!isValidTechnique(technique)) {
    throw new Error(
      `Invalid technique: ${technique}. Valid techniques are: ${VALID_TECHNIQUES.join(', ')}`
    );
  }
  return TECHNIQUE_STEP_COUNTS[technique];
}
