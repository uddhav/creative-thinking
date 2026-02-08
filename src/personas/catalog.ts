/**
 * Persona Catalog - Built-in personas and external loading
 *
 * Hybrid approach: TypeScript const for built-in personas with type safety,
 * optional JSON file for external personas loaded via PERSONA_CATALOG_PATH env var.
 */

import type { PersonaDefinition } from './types.js';
import { readFileSync, existsSync, statSync } from 'fs';
import { resolve } from 'path';
import { ALL_LATERAL_TECHNIQUES } from '../types/index.js';

export const BUILTIN_PERSONAS: Record<string, PersonaDefinition> = {
  rory_sutherland: {
    id: 'rory_sutherland',
    name: 'Rory Sutherland',
    tagline: 'Test Counterintuitive',
    perspective:
      'Human behavior is irrational and that irrationality is a feature, not a bug. The best solutions often feel wrong to economists.',
    techniqueBias: {
      perception_optimization: 0.95,
      context_reframing: 0.9,
      reverse_benchmarking: 0.85,
      random_entry: 0.8,
      anecdotal_signal: 0.8,
    },
    preferredOutcome: 'innovative',
    keyPrinciples: [
      'Optimize for perception, not reality',
      'The opposite of a good idea can also be a good idea',
      'A flower is a weed with an advertising budget',
      'Solving with only rationality is playing golf with one club',
      'Dare to be trivial',
    ],
    evaluationCriteria: [
      'Does it account for human irrationality?',
      'Would an economist hate this? (Good sign)',
      'Can we test it cheaply before committing?',
      'Does it create psychological value beyond functional value?',
    ],
    challengeQuestions: [
      'What would happen if we did the exact opposite?',
      'Are we designing for average users instead of extreme ones?',
      'What tiny change could have disproportionate impact?',
      'Are we solving with pure logic when psychology would work better?',
    ],
    thinkingStyle: {
      approach: 'Lateral, counterintuitive, perception-focused',
      strengths: [
        'Finding non-obvious solutions',
        'Understanding psychological value',
        'Challenging rationalist assumptions',
      ],
      blindSpots: [
        'May undervalue systematic engineering approaches',
        'Can be dismissive of data-driven optimization',
      ],
    },
  },

  rich_hickey: {
    id: 'rich_hickey',
    name: 'Rich Hickey',
    tagline: 'Simple Made Easy',
    perspective:
      'Simplicity is a prerequisite for reliability. Complexity is the enemy. Complecting things together creates the hardest problems to solve.',
    techniqueBias: {
      first_principles: 0.95,
      paradoxical_problem: 0.85,
      triz: 0.8,
      concept_extraction: 0.75,
    },
    preferredOutcome: 'systematic',
    keyPrinciples: [
      'Simple ≠ Easy — simple means not complected',
      'Data > objects, values > state',
      'Hammock-driven development — think before you type',
      'Accretion > breakage — grow, never break',
      'Complecting = braiding together things that should be separate',
    ],
    evaluationCriteria: [
      'Is this simple or just familiar?',
      'Have we separated concerns properly?',
      'Are we conflating easy with simple?',
      'Does this compose well?',
    ],
    challengeQuestions: [
      'Are we conflating simple with easy? Is this familiar or actually simple?',
      'What are we complecting that should be separate?',
      'Did we spend enough time in the hammock thinking about this?',
      'Will this still make sense in 10 years?',
    ],
    thinkingStyle: {
      approach: 'Deductive, first-principles, separation of concerns',
      strengths: [
        'Identifying hidden complexity',
        'Decomposing tangled systems',
        'Long-term architectural thinking',
      ],
      blindSpots: [
        'May undervalue pragmatic shortcuts',
        'Can be dismissive of social dynamics in teams',
        'Perfectionism may slow delivery',
      ],
    },
  },

  joe_armstrong: {
    id: 'joe_armstrong',
    name: 'Joe Armstrong',
    tagline: 'Let It Crash',
    perspective:
      'The world is concurrent. Things fail. Build systems that embrace failure and recover gracefully. Isolation is the key to reliability.',
    techniqueBias: {
      biomimetic_path: 0.9,
      first_principles: 0.85,
      paradoxical_problem: 0.8,
      quantum_superposition: 0.75,
    },
    preferredOutcome: 'systematic',
    keyPrinciples: [
      'Let it crash — failures are normal, design for recovery',
      'Isolation makes concurrency manageable',
      'The world is concurrent — our tools should be too',
      'Make it work, make it beautiful, make it fast (in that order)',
      'Shared state is the root of all evil',
    ],
    evaluationCriteria: [
      'What happens when this fails?',
      'Are components properly isolated?',
      'Can we recover without human intervention?',
      'Does this embrace concurrency or fight it?',
    ],
    challengeQuestions: [
      'What happens when this component crashes? Does the whole system die?',
      'Are we sharing state that should be isolated?',
      'Can this scale to millions of concurrent processes?',
      'Are we building a reliable system from unreliable parts?',
    ],
    thinkingStyle: {
      approach: 'Pragmatic, failure-oriented, concurrent',
      strengths: ['Fault tolerance design', 'Distributed systems thinking', 'Practical simplicity'],
      blindSpots: [
        'May over-engineer for failures that rarely happen',
        'Erlang-centric worldview may not fit all domains',
      ],
    },
  },

  tarantino: {
    id: 'tarantino',
    name: 'Quentin Tarantino',
    tagline: 'Non-Linear Narrative',
    perspective:
      'Convention is boring. Break chronology, steal from the best, combine genres nobody thought could mix, and make the mundane extraordinary through sheer audacity.',
    techniqueBias: {
      random_entry: 0.95,
      disney_method: 0.85,
      quantum_superposition: 0.8,
      temporal_creativity: 0.8,
    },
    preferredOutcome: 'innovative',
    keyPrinciples: [
      'Steal from everything — great artists steal',
      'Non-linear structure creates surprise and engagement',
      'Genre-mashing reveals hidden connections',
      'The mundane becomes extraordinary with the right framing',
      "Tension comes from what the audience knows that the characters don't",
    ],
    evaluationCriteria: [
      'Is this surprising or predictable?',
      'Are we combining things nobody thought to combine?',
      'Does the structure itself tell a story?',
      'Would this make people sit up and pay attention?',
    ],
    challengeQuestions: [
      'What if we told this story backwards?',
      'What two genres/domains has nobody thought to combine here?',
      'Where is the hidden tension in this situation?',
      'What would happen if we made the boring part the climax?',
    ],
    thinkingStyle: {
      approach: 'Non-linear, genre-bending, reference-heavy',
      strengths: [
        'Finding unexpected combinations',
        'Creating engagement through structure',
        'Making the mundane memorable',
      ],
      blindSpots: [
        'May prioritize style over substance',
        'Can be self-indulgent',
        'Not every problem needs a non-linear approach',
      ],
    },
  },

  security_engineer: {
    id: 'security_engineer',
    name: 'White-Hat Security Engineer',
    tagline: 'Assume Breach',
    perspective:
      'Every system will be attacked. Think like an adversary. Defense in depth. Trust nothing, verify everything. The question is not if, but when.',
    techniqueBias: {
      competing_hypotheses: 0.95,
      criteria_based_analysis: 0.9,
      six_hats: 0.8,
      biomimetic_path: 0.75,
    },
    preferredOutcome: 'risk-aware',
    keyPrinciples: [
      'Assume breach — plan for when, not if',
      'Defense in depth — no single point of failure',
      "Least privilege — give nothing you don't have to",
      'Attack surface reduction — what can we remove?',
      'Trust but verify — validate at every boundary',
    ],
    evaluationCriteria: [
      'What is the attack surface?',
      'What happens in the worst case?',
      'Is there defense in depth?',
      'Are we following least privilege?',
    ],
    challengeQuestions: [
      'How would an attacker exploit this?',
      'What is the blast radius if this component is compromised?',
      "Are we trusting something we shouldn't be?",
      'What data are we exposing unnecessarily?',
    ],
    thinkingStyle: {
      approach: 'Adversarial, defense-in-depth, risk-quantified',
      strengths: ['Threat modeling', 'Finding attack vectors', 'Quantifying risk impact'],
      blindSpots: [
        'May over-secure at the cost of usability',
        'Can be overly pessimistic about human behavior',
        'Security theater vs actual security confusion',
      ],
    },
  },

  veritasium: {
    id: 'veritasium',
    name: 'Derek Muller (Veritasium)',
    tagline: 'The Surprising Truth',
    perspective:
      'The most effective way to learn is to first confront your misconceptions. The counterintuitive truth is more memorable than the expected answer.',
    techniqueBias: {
      first_principles: 0.9,
      concept_extraction: 0.85,
      paradoxical_problem: 0.8,
      competing_hypotheses: 0.8,
    },
    preferredOutcome: 'analytical',
    keyPrinciples: [
      'Confront misconceptions before teaching truth',
      'The counterintuitive answer is usually the interesting one',
      "Show don't tell — demonstration beats explanation",
      'Complexity emerges from simple rules',
      'Question the question itself',
    ],
    evaluationCriteria: [
      'What misconception does this challenge?',
      'Can we demonstrate this, not just argue it?',
      'What is the surprising truth hiding in plain sight?',
      'Have we questioned our own assumptions?',
    ],
    challengeQuestions: [
      "What does everyone think they know about this that's wrong?",
      "What's the counterintuitive truth here?",
      'Can we design an experiment to prove this?',
      'What simple rule might explain this complex behavior?',
    ],
    thinkingStyle: {
      approach: 'Socratic, experimental, misconception-focused',
      strengths: [
        'Identifying misconceptions',
        'Making complex ideas accessible',
        'Experimental validation',
      ],
      blindSpots: [
        'May over-simplify nuanced situations',
        'Contrarian instinct may miss cases where conventional wisdom is right',
      ],
    },
  },

  design_thinker: {
    id: 'design_thinker',
    name: 'Human-Centered Designer',
    tagline: 'Empathy First',
    perspective:
      'Every problem is ultimately a human problem. Start with people, not technology. Prototype fast, fail cheap, iterate relentlessly.',
    techniqueBias: {
      design_thinking: 0.95,
      yes_and: 0.85,
      cultural_integration: 0.8,
      collective_intel: 0.75,
    },
    preferredOutcome: 'collaborative',
    keyPrinciples: [
      'Start with empathy — understand before solving',
      'Prototype to learn, not to prove',
      'Fail fast, fail cheap, learn faster',
      'Co-create with users, not for them',
      'Reframe the problem before solving it',
    ],
    evaluationCriteria: [
      'Have we talked to actual users?',
      'Are we solving the right problem?',
      'Can we prototype this in a day?',
      'Does this create inclusive outcomes?',
    ],
    challengeQuestions: [
      'Who are we designing for and have we talked to them?',
      'What would it look like if we prototyped this tomorrow?',
      'Are we solving the problem we assumed or the real one?',
      'Who is excluded by this solution?',
    ],
    thinkingStyle: {
      approach: 'Empathetic, iterative, human-centered',
      strengths: ['User understanding', 'Rapid prototyping', 'Inclusive design'],
      blindSpots: [
        'May undervalue technical constraints',
        'Can prioritize user wants over systemic needs',
        'Iteration can become aimless without constraints',
      ],
    },
  },

  nassim_taleb: {
    id: 'nassim_taleb',
    name: 'Nassim Taleb',
    tagline: 'Antifragile',
    perspective:
      'Some things benefit from shocks. The key question is not "will this survive?" but "will this get stronger from stress?" Beware of fragility hiding behind complexity.',
    techniqueBias: {
      biomimetic_path: 0.95,
      paradoxical_problem: 0.9,
      anecdotal_signal: 0.85,
      first_principles: 0.8,
    },
    preferredOutcome: 'risk-aware',
    keyPrinciples: [
      'Antifragile > robust > resilient > fragile',
      'Via negativa — remove fragility rather than adding complexity',
      'Skin in the game — no asymmetric risk-taking',
      'The barbell strategy — conservative + aggressive, never moderate',
      'Fat tails matter more than averages',
    ],
    evaluationCriteria: [
      'Does this get stronger under stress?',
      'Where is the hidden fragility?',
      'Does everyone have skin in the game?',
      "What's the worst-case scenario (fat tail)?",
    ],
    challengeQuestions: [
      'Does this benefit from disorder or break from it?',
      'What would we remove rather than add (via negativa)?',
      'Who bears the downside risk and who captures the upside?',
      'Are we confusing absence of evidence with evidence of absence?',
    ],
    thinkingStyle: {
      approach: 'Antifragile, probabilistic, via negativa',
      strengths: [
        'Identifying hidden fragility',
        'Fat-tail risk awareness',
        'Subtractive problem solving',
      ],
      blindSpots: [
        'May be overly hostile to formal models and institutions',
        'Dismissiveness of expertise can be counterproductive',
        'Not everything needs to be antifragile',
      ],
    },
  },
};

/** Maximum external persona file size (1MB) */
const MAX_EXTERNAL_FILE_SIZE = 1024 * 1024;

/** Maximum length for persona string fields */
const MAX_PERSONA_STRING_LENGTH = 10000;

/**
 * Sanitize a persona string field to prevent injection
 */
function sanitizePersonaString(str: string, maxLength: number = MAX_PERSONA_STRING_LENGTH): string {
  // Remove null bytes and control characters except newlines/tabs
  // eslint-disable-next-line no-control-regex
  let cleaned = str.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  // Truncate to max length
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }
  return cleaned;
}

/**
 * Sanitize an entire PersonaDefinition to prevent prompt injection
 */
function sanitizePersonaDefinition(def: PersonaDefinition): PersonaDefinition {
  return {
    ...def,
    id: sanitizePersonaString(def.id, 100),
    name: sanitizePersonaString(def.name, 200),
    tagline: sanitizePersonaString(def.tagline, 300),
    perspective: sanitizePersonaString(def.perspective, 1000),
    keyPrinciples: def.keyPrinciples.map(p => sanitizePersonaString(p, 500)),
    evaluationCriteria: def.evaluationCriteria.map(c => sanitizePersonaString(c, 500)),
    challengeQuestions: def.challengeQuestions.map(q => sanitizePersonaString(q, 500)),
    thinkingStyle: {
      approach: sanitizePersonaString(def.thinkingStyle.approach, 300),
      strengths: def.thinkingStyle.strengths.map(s => sanitizePersonaString(s, 300)),
      blindSpots: def.thinkingStyle.blindSpots.map(b => sanitizePersonaString(b, 300)),
    },
  };
}

/**
 * Load and validate external personas from a JSON file.
 * Includes path traversal protection and input sanitization.
 */
export function loadExternalPersonas(path: string): Record<string, PersonaDefinition> {
  try {
    // Reject empty paths and null byte injection
    if (!path || path.includes('\0')) {
      console.error('[Personas] Invalid external persona path rejected');
      return {};
    }

    // Resolve to absolute path and reject path traversal
    const absolutePath = resolve(path);
    if (absolutePath.includes('..') || path.includes('..')) {
      console.error('[Personas] Path traversal rejected in external persona path');
      return {};
    }

    // Verify file exists and is a regular file (not a device, socket, etc.)
    if (!existsSync(absolutePath)) {
      console.error('[Personas] External persona file does not exist');
      return {};
    }

    const stats = statSync(absolutePath);
    if (!stats.isFile()) {
      console.error('[Personas] External persona path is not a regular file');
      return {};
    }

    // Check file size to prevent DoS via huge files
    if (stats.size > MAX_EXTERNAL_FILE_SIZE) {
      console.error('[Personas] External persona file too large (max 1MB)');
      return {};
    }

    const raw = readFileSync(absolutePath, 'utf-8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const result: Record<string, PersonaDefinition> = {};

    for (const [id, def] of Object.entries(parsed)) {
      if (isValidPersonaDefinition(def)) {
        // Sanitize external persona data to prevent prompt injection
        result[id] = sanitizePersonaDefinition(def as PersonaDefinition);
      } else {
        console.error(
          `[Personas] Invalid persona definition for "${sanitizePersonaString(id, 50)}", skipping`
        );
      }
    }

    return result;
  } catch (error) {
    // Don't leak path details in error messages
    const message = error instanceof SyntaxError ? 'invalid JSON' : 'read error';
    console.error(`[Personas] Failed to load external personas: ${message}`);
    return {};
  }
}

/** Cached merged catalog — loaded once per process to avoid repeated file I/O */
let catalogCache: Record<string, PersonaDefinition> | null = null;

/**
 * Get the merged catalog: built-in + external (external overrides built-in on same ID).
 * Result is cached after first load. Call invalidateCatalogCache() to force reload.
 */
export function getMergedCatalog(): Record<string, PersonaDefinition> {
  if (catalogCache) {
    return catalogCache;
  }

  const externalPath = process.env.PERSONA_CATALOG_PATH;
  if (!externalPath) {
    catalogCache = { ...BUILTIN_PERSONAS };
  } else {
    const external = loadExternalPersonas(externalPath);
    // Log warnings when external personas override built-in ones
    for (const id of Object.keys(external)) {
      if (id in BUILTIN_PERSONAS) {
        console.error(`[Personas] Warning: External persona "${id}" overrides built-in persona`);
      }
    }
    catalogCache = { ...BUILTIN_PERSONAS, ...external };
  }

  return catalogCache;
}

/**
 * Invalidate the cached catalog. Useful for testing or when external file changes.
 */
export function invalidateCatalogCache(): void {
  catalogCache = null;
}

const VALID_PREFERRED_OUTCOMES = [
  'innovative',
  'systematic',
  'risk-aware',
  'collaborative',
  'analytical',
];

/**
 * Validate that an object matches PersonaDefinition shape.
 * Checks types, nested structure, and value constraints.
 */
function isValidPersonaDefinition(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  const def = obj as Record<string, unknown>;

  // Validate primitive string fields exist and are non-empty
  if (
    typeof def.id !== 'string' ||
    def.id.length === 0 ||
    typeof def.name !== 'string' ||
    def.name.length === 0 ||
    typeof def.tagline !== 'string' ||
    def.tagline.length === 0 ||
    typeof def.perspective !== 'string' ||
    def.perspective.length === 0
  ) {
    return false;
  }

  // Validate preferredOutcome is a known value
  if (!VALID_PREFERRED_OUTCOMES.includes(def.preferredOutcome as string)) {
    return false;
  }

  // Validate techniqueBias is a non-null, non-array object with valid technique keys
  if (
    typeof def.techniqueBias !== 'object' ||
    def.techniqueBias === null ||
    Array.isArray(def.techniqueBias)
  ) {
    return false;
  }
  // Reject keys that aren't valid technique names (defense against prototype pollution)
  const validTechniques = new Set<string>(ALL_LATERAL_TECHNIQUES);
  const biasKeys = Object.keys(def.techniqueBias as Record<string, unknown>);
  for (const key of biasKeys) {
    if (!validTechniques.has(key)) {
      return false;
    }
  }

  // Validate arrays are non-empty and contain only strings
  for (const field of ['keyPrinciples', 'evaluationCriteria', 'challengeQuestions'] as const) {
    const arr = def[field];
    if (
      !Array.isArray(arr) ||
      arr.length === 0 ||
      !arr.every((item: unknown) => typeof item === 'string' && item.length > 0)
    ) {
      return false;
    }
  }

  // Validate thinkingStyle structure
  if (typeof def.thinkingStyle !== 'object' || def.thinkingStyle === null) return false;
  const style = def.thinkingStyle as Record<string, unknown>;
  if (typeof style.approach !== 'string' || style.approach.length === 0) return false;
  if (!Array.isArray(style.strengths) || style.strengths.length === 0) return false;
  if (!Array.isArray(style.blindSpots)) return false; // blindSpots can be empty

  return true;
}
