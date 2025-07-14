// Example demonstrating improved concurrent session handling

const concurrentSessionsExample = {
  // Session 1: Start a Six Hats session
  session1_step1: {
    technique: "six_hats",
    problem: "How to improve team productivity?",
    currentStep: 1,
    totalSteps: 6,
    hatColor: "blue",
    output: "Starting with the Blue Hat to organize our thinking process about improving team productivity.",
    nextStepNeeded: true
  },
  
  // Session 2: Start a different PO session
  session2_step1: {
    technique: "po",
    problem: "How to reduce customer support costs?",
    currentStep: 1,
    totalSteps: 4,
    output: "Po: All customer support is handled by customers themselves",
    provocation: "All customer support is handled by customers themselves",
    nextStepNeeded: true
  },
  
  // Continuing Session 1 with the session ID from response
  session1_step2: {
    sessionId: "session_abc123-uuid", // Use actual sessionId from step 1 response
    technique: "six_hats",
    problem: "How to improve team productivity?",
    currentStep: 2,
    totalSteps: 6,
    hatColor: "white",
    output: "Current facts: 30% time lost in meetings, 25% on context switching, remote work challenges.",
    nextStepNeeded: true
  },
  
  // Continuing Session 2 with its session ID
  session2_step2: {
    sessionId: "session_def456-uuid", // Use actual sessionId from step 1 response
    technique: "po",
    problem: "How to reduce customer support costs?",
    currentStep: 2,
    totalSteps: 4,
    output: "Exploring the provocation: What if customers could solve each other's problems? This could lead to community forums, peer recognition systems, and knowledge sharing.",
    nextStepNeeded: true
  },
  
  // Example of error handling when session expires
  expiredSessionExample: {
    sessionId: "session_old-expired-uuid",
    technique: "random_entry",
    problem: "Some old problem",
    currentStep: 2,
    totalSteps: 3,
    output: "Trying to continue an expired session",
    nextStepNeeded: true
  }
};

// Expected responses:

const session1Response = {
  sessionId: "session_abc123-uuid",
  technique: "six_hats",
  currentStep: 1,
  totalSteps: 6,
  nextStepNeeded: true,
  historyLength: 1,
  branches: [],
  nextStepGuidance: "Next: White Hat - Focus on Facts and information"
};

const session2Response = {
  sessionId: "session_def456-uuid",
  technique: "po",
  currentStep: 1,
  totalSteps: 4,
  nextStepNeeded: true,
  historyLength: 1,
  branches: [],
  nextStepGuidance: "Suspend judgment and explore the provocation"
};

const errorResponse = {
  error: "Session session_old-expired-uuid not found. It may have expired.",
  status: "failed"
};

console.log("Concurrent Sessions Example");
console.log("==========================");
console.log("\nKey improvements:");
console.log("1. Session IDs are now explicit - no more reliance on class state");
console.log("2. Multiple sessions can run concurrently without interference");
console.log("3. Sessions expire after 24 hours with automatic cleanup");
console.log("4. Clear error messages when sessions expire");
console.log("\nUsage:");
console.log("- For step 1: Don't include sessionId");
console.log("- For steps 2+: Include the sessionId from the previous response");
console.log("- Sessions are independent and can be interleaved");