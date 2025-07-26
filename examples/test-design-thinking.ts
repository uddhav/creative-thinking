#!/usr/bin/env node

/**
 * Test example for Design Thinking with Embedded Risk Management
 * Demonstrates the 5-stage process with critical thinking at each stage
 */

// Run lateral thinking tool with design_thinking technique - Stage 1: Empathize
const step1 = {
  technique: 'design_thinking',
  problem: 'Develop a mobile app for elderly users to stay connected with family',
  currentStep: 1,
  totalSteps: 5,
  output:
    'Understanding user needs: elderly users want simple, intuitive interfaces with large buttons and text. They value seeing family photos and hearing voices clearly.',
  empathyInsights: [
    'Users have limited tech experience and may fear making mistakes',
    'Vision and hearing impairments are common',
    'Loneliness and isolation are key pain points',
    'Some users may have tremors affecting precise touch',
  ],
  risks: [
    'Potential for scammers to exploit trust',
    'Privacy concerns with sharing personal data',
    'Technology could replace rather than enhance human contact',
  ],
  nextStepNeeded: true,
};

console.log('Design Thinking - Step 1: Empathize + Threat Modeling');
console.log(JSON.stringify(step1, null, 2));
console.log('\n---\n');

// Stage 2: Define
const step2 = {
  technique: 'design_thinking',
  problem: 'Develop a mobile app for elderly users to stay connected with family',
  currentStep: 2,
  totalSteps: 5,
  sessionId: 'session_12345', // Would be returned from step 1
  output:
    'Core problem: Elderly users need a way to maintain meaningful connections with family that feels natural and safe, not intimidating or complex.',
  problemStatement:
    'How might we create a communication tool that bridges generational tech gaps while protecting vulnerable users?',
  failureModesPredicted: [
    'Users abandon app due to complexity',
    'Family members stop using due to limited features',
    'Security breaches expose elderly to scams',
    'App increases anxiety rather than connection',
  ],
  nextStepNeeded: true,
};

console.log('Design Thinking - Step 2: Define + Problem Inversion');
console.log(JSON.stringify(step2, null, 2));
console.log('\n---\n');

// Stage 3: Ideate
const step3 = {
  technique: 'design_thinking',
  problem: 'Develop a mobile app for elderly users to stay connected with family',
  currentStep: 3,
  totalSteps: 5,
  sessionId: 'session_12345',
  output: 'Generating solutions with built-in criticism to identify robust options.',
  ideaList: [
    'Voice-first interface with visual fallback (Risk: voice recognition may fail with accents/speech issues)',
    'One-button video call to preset contacts (Risk: accidental calls, limited flexibility)',
    'Digital photo frame mode with messaging (Risk: passive consumption, less engagement)',
    'Guided setup with family member assistance (Risk: dependency on others availability)',
    'AI companion for practice and help (Risk: potential confusion between AI and real family)',
  ],
  risks: [
    'Feature creep making app complex',
    'Over-reliance on family for setup/maintenance',
    'Creating digital divide within elderly community',
  ],
  nextStepNeeded: true,
};

console.log("Design Thinking - Step 3: Ideate + Devil's Advocate");
console.log(JSON.stringify(step3, null, 2));
console.log('\n---\n');

// Stage 4: Prototype
const step4 = {
  technique: 'design_thinking',
  problem: 'Develop a mobile app for elderly users to stay connected with family',
  currentStep: 4,
  totalSteps: 5,
  sessionId: 'session_12345',
  output:
    'Built MVP with core features: voice-activated calling, photo sharing, and emergency button.',
  prototypeDescription:
    'Simplified tablet interface with 3 main buttons: Call Family, See Photos, Get Help. Voice commands for all actions. Family portal for setup and monitoring.',
  stressTestResults: [
    'Voice recognition failed in 30% of cases with background noise',
    'Emergency button triggered accidentally 5 times in testing',
    'Setup process still took 45 minutes with help',
    'Battery life reduced to 4 hours with always-on features',
  ],
  mitigations: [
    'Add visual confirmation for voice commands',
    'Implement double-tap for emergency with haptic feedback',
    'Create quick-start video guide',
    'Optimize power usage with motion detection',
  ],
  nextStepNeeded: true,
};

console.log('Design Thinking - Step 4: Prototype + Stress Testing');
console.log(JSON.stringify(step4, null, 2));
console.log('\n---\n');

// Stage 5: Test
const step5 = {
  technique: 'design_thinking',
  problem: 'Develop a mobile app for elderly users to stay connected with family',
  currentStep: 5,
  totalSteps: 5,
  sessionId: 'session_12345',
  output:
    'Tested with 20 elderly users and their families over 2 weeks. Gathered both success stories and failure modes.',
  userFeedback: [
    'Love seeing grandchildren easily, but worried about privacy',
    "Voice commands helpful but frustrating when they don't work",
    'Emergency button gives peace of mind',
    'Want to send messages but typing is difficult',
    'Family enjoys getting photo notifications',
  ],
  failureInsights: [
    'Users with hearing aids experienced feedback issues',
    'Some felt pressured to be "available" all the time',
    'Technical issues caused frustration and reduced usage',
    'Family members needed more guidance on elderly-friendly communication',
  ],
  antifragileProperties: [
    'User community formed to help each other',
    'Failures led to innovative accessibility features',
    'Family bonds strengthened through patient tech support',
  ],
  nextStepNeeded: false,
};

console.log('Design Thinking - Step 5: Test + Failure Harvesting');
console.log(JSON.stringify(step5, null, 2));
console.log('\n---\n');

console.log('Design Thinking process completed with embedded risk management throughout!');
