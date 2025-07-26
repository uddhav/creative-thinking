#!/usr/bin/env node

/**
 * Test example for TRIZ Enhanced with Via Negativa
 * Demonstrates the 4-step process of systematic innovation with subtractive thinking
 */

// Run lateral thinking tool with triz technique - Step 1: Identify Contradiction
const step1 = {
  technique: 'triz',
  problem: 'Need a strong but lightweight material for aerospace applications',
  currentStep: 1,
  totalSteps: 4,
  output:
    'Core contradiction identified: Material needs high strength (requires density/mass) but must be lightweight (requires low density/mass)',
  contradiction: 'Need high strength BUT need low weight',
  risks: [
    'Traditional solutions add complexity',
    'Composite materials are expensive',
    'Manufacturing difficulties increase costs',
  ],
  nextStepNeeded: true,
};

console.log('TRIZ - Step 1: Identify Contradiction');
console.log(JSON.stringify(step1, null, 2));
console.log('\n---\n');

// Step 2: Via Negativa - What to Remove?
const step2 = {
  technique: 'triz',
  problem: 'Need a strong but lightweight material for aerospace applications',
  currentStep: 2,
  totalSteps: 4,
  sessionId: 'session_triz_123', // Would be returned from step 1
  output:
    'Applying Via Negativa thinking: Instead of adding materials for strength, what can we remove while maintaining structural integrity?',
  viaNegativaRemovals: [
    'Remove material from non-critical areas',
    'Remove solid core - use hollow structures',
    'Remove uniform thickness - vary based on stress',
    'Remove monolithic design - use lattice structures',
    'Remove manufacturing constraints - use 3D printing',
  ],
  risks: [
    'Structural weak points if removal is incorrect',
    'Complex analysis required for optimization',
    'Manufacturing precision critical',
  ],
  nextStepNeeded: true,
};

console.log('TRIZ - Step 2: Via Negativa - What to Remove?');
console.log(JSON.stringify(step2, null, 2));
console.log('\n---\n');

// Step 3: Apply Inventive Principles
const step3 = {
  technique: 'triz',
  problem: 'Need a strong but lightweight material for aerospace applications',
  currentStep: 3,
  totalSteps: 4,
  sessionId: 'session_triz_123',
  output: 'Applying TRIZ inventive principles both additively and subtractively',
  inventivePrinciples: [
    'Principle 1 (Segmentation): Divide into independent parts - lattice structures',
    'Principle 2 (Taking out): Separate interfering parts - remove unnecessary material',
    'Principle 14 (Spheroidality): Use curves instead of straight lines - optimize load paths',
    'Principle 17 (Another dimension): Use multi-layer structures - 3D optimization',
    'Principle 31 (Porous materials): Use porous structures - controlled porosity',
    'Principle 35 (Parameter changes): Change material state - gradient materials',
  ],
  mitigations: [
    'Use topology optimization software for removal patterns',
    'Implement safety factors for critical areas',
    'Create redundant load paths',
    'Test extensively with simulations',
  ],
  nextStepNeeded: true,
};

console.log('TRIZ - Step 3: Apply Inventive Principles');
console.log(JSON.stringify(step3, null, 2));
console.log('\n---\n');

// Step 4: Minimal Solution
const step4 = {
  technique: 'triz',
  problem: 'Need a strong but lightweight material for aerospace applications',
  currentStep: 4,
  totalSteps: 4,
  sessionId: 'session_triz_123',
  output: 'Synthesizing minimal solution that achieves more by doing less',
  minimalSolution:
    'Topology-optimized lattice structure with variable density: Remove 70% of material volume while maintaining 95% of strength through algorithmic optimization of internal structure',
  antifragileProperties: [
    'Design improves with each stress test iteration',
    'Failure points inform better optimization',
    'Manufacturing defects can be compensated by redundant paths',
    'Modular design allows iterative improvements',
  ],
  failureModes: [
    'Stress concentration at lattice nodes',
    'Manufacturing tolerances critical',
    'Fatigue behavior needs validation',
  ],
  nextStepNeeded: false,
};

console.log('TRIZ - Step 4: Minimal Solution');
console.log(JSON.stringify(step4, null, 2));
console.log('\n---\n');

console.log(
  'TRIZ process completed! Achieved 70% weight reduction with minimal strength loss through systematic removal and optimization.'
);
