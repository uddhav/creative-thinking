// Example demonstrating improved validation for unified framework fields

const validationTestExamples = {
  // Valid example - all string arrays
  validExample: {
    technique: 'po',
    problem: 'How to improve team productivity?',
    currentStep: 2,
    totalSteps: 4,
    output: 'Exploring provocative ideas with risk awareness',
    risks: ['Team burnout from overwork', 'Communication breakdown'],
    failureModes: ['Process becomes too rigid', 'Tools create more overhead'],
    mitigations: ['Regular retrospectives', 'Flexible implementation'],
    nextStepNeeded: true,
  },

  // Invalid example - non-string array elements (would fail validation)
  invalidExample: {
    technique: 'six_hats',
    problem: 'Should we adopt AI tools?',
    currentStep: 5,
    totalSteps: 6,
    hatColor: 'black',
    output: 'Critical evaluation of AI adoption',
    risks: [
      'Privacy concerns',
      123, // This would fail validation - not a string
      { issue: 'Complex object' }, // This would also fail
    ],
    nextStepNeeded: true,
  },

  // Invalid example - wrong type for array field
  invalidArrayType: {
    technique: 'concept_extraction',
    problem: 'How to scale operations?',
    currentStep: 3,
    totalSteps: 4,
    output: 'Abstracting patterns from successful examples',
    mitigations: 'Single string instead of array', // This would fail validation
    nextStepNeeded: true,
  },
};

console.log('Validation Test Examples');
console.log('========================');
console.log('\nThe improved validation now checks:');
console.log('1. Fields must be arrays (not just truthy)');
console.log('2. All array elements must be strings');
console.log('\nExpected validation errors:');
console.log("- 'risks must be an array of strings' (for non-string elements)");
console.log("- 'mitigations must be an array of strings' (for non-array value)");
console.log('\nThis ensures type safety and prevents runtime errors from invalid data.');

// Export the examples so they can be used elsewhere
export { validationTestExamples };
