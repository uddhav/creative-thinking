// Test example for Yes, And... technique
// This demonstrates how to use the yes_and technique

const testYesAnd = {
  // Step 1: Accept (Yes)
  step1: {
    technique: "yes_and",
    problem: "How to make remote work more engaging for teams?",
    currentStep: 1,
    totalSteps: 4,
    output: "I accept the challenge of making remote work more engaging. The initial idea is to create virtual coffee breaks where team members can casually connect.",
    initialIdea: "Virtual coffee breaks for casual team connection",
    nextStepNeeded: true
  },

  // Step 2: Build (And)
  step2: {
    technique: "yes_and",
    problem: "How to make remote work more engaging for teams?",
    currentStep: 2,
    totalSteps: 4,
    output: "Building on virtual coffee breaks, we could add: themed days (Meme Monday, Trivia Tuesday), rotating hosts who share personal interests, integration with team calendars for automatic scheduling, and virtual backgrounds that change based on team achievements.",
    additions: [
      "Themed days (Meme Monday, Trivia Tuesday)",
      "Rotating hosts sharing personal interests",
      "Calendar integration for automatic scheduling",
      "Dynamic virtual backgrounds based on team achievements"
    ],
    nextStepNeeded: true
  },

  // Step 3: Evaluate (But)
  step3: {
    technique: "yes_and",
    problem: "How to make remote work more engaging for teams?",
    currentStep: 3,
    totalSteps: 4,
    output: "Potential issues to consider: Zoom fatigue from too many video calls, time zone challenges for global teams, introverted team members feeling pressured to participate, and the risk of forced fun feeling inauthentic.",
    evaluations: [
      "Zoom fatigue from excessive video calls",
      "Time zone conflicts for global teams",
      "Pressure on introverted team members",
      "Risk of 'forced fun' feeling inauthentic"
    ],
    nextStepNeeded: true
  },

  // Step 4: Integrate
  step4: {
    technique: "yes_and",
    problem: "How to make remote work more engaging for teams?",
    currentStep: 4,
    totalSteps: 4,
    output: "Final integrated solution: Create an opt-in 'Connection Hub' with varied engagement options. Include async activities (shared playlists, photo challenges), optional video sessions with clear purposes, time-zone friendly rotating schedules, and choice between active participation or lurking. Track engagement metrics but prioritize quality over quantity.",
    synthesis: "Flexible 'Connection Hub' with multiple engagement modes, respecting individual preferences and time zones while fostering authentic team connections",
    nextStepNeeded: false
  }
};

console.log("Yes, And... Technique Test Example");
console.log("==================================");
console.log(JSON.stringify(testYesAnd, null, 2));