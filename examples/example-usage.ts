// Example usage of the Lateral Thinking MCP Server
// This demonstrates how to use each technique step by step

// Example 1: Six Thinking Hats for "Improving Customer Service"
const sixHatsExample = [
  {
    technique: "six_hats",
    problem: "How to improve customer service response times",
    currentStep: 1,
    totalSteps: 6,
    hatColor: "blue",
    output: "Let's analyze our customer service systematically. We'll examine facts, emotions, risks, benefits, and creative solutions to develop a comprehensive improvement plan.",
    nextStepNeeded: true
  },
  {
    technique: "six_hats",
    problem: "How to improve customer service response times",
    currentStep: 2,
    totalSteps: 6,
    hatColor: "white",
    output: "Current average response time: 48 hours. Customer complaints increased 35% last quarter. We have 12 agents handling 500 tickets daily. Peak hours are 10am-2pm. 60% of queries are repetitive.",
    nextStepNeeded: true
  },
  {
    technique: "six_hats",
    problem: "How to improve customer service response times",
    currentStep: 3,
    totalSteps: 6,
    hatColor: "red",
    output: "Customers feel frustrated and abandoned. Agents are stressed and overwhelmed. Management is anxious about reputation damage. There's a sense of urgency and fear of losing customers to competitors.",
    nextStepNeeded: true
  },
  // ... continue for yellow, black, and green hats
];

// Example 2: PO Technique for "Reducing Meeting Time"
const poExample = [
  {
    technique: "po",
    problem: "How to make meetings more efficient",
    currentStep: 1,
    totalSteps: 4,
    provocation: "Po: All meetings should be conducted while standing on one leg",
    output: "This absurd requirement would force people to be brief and focused. Physical discomfort would eliminate unnecessary discussion.",
    nextStepNeeded: true
  },
  {
    technique: "po",
    problem: "How to make meetings more efficient",
    currentStep: 2,
    totalSteps: 4,
    output: "Let's explore this without judgment: Standing on one leg creates urgency, requires balance and focus, makes long meetings impossible, and forces prioritization of essential topics.",
    nextStepNeeded: true
  },
  {
    technique: "po",
    problem: "How to make meetings more efficient",
    currentStep: 3,
    totalSteps: 4,
    principles: [
      "Physical constraints create mental focus",
      "Discomfort drives efficiency",
      "Time pressure forces prioritization",
      "Active participation prevents zoning out"
    ],
    output: "Key principles extracted: using physical elements to enhance mental focus, creating natural time limits, and ensuring active engagement.",
    nextStepNeeded: true
  },
  {
    technique: "po",
    problem: "How to make meetings more efficient",
    currentStep: 4,
    totalSteps: 4,
    output: "Practical ideas: Stand-up meetings for daily updates, walking meetings for creative discussions, strict time-boxing with visual timers, and requiring physical movement between agenda items.",
    nextStepNeeded: false
  }
];

// Example 3: Random Entry for "New Product Ideas"
const randomEntryExample = [
  {
    technique: "random_entry",
    problem: "Generate ideas for a new fitness product",
    currentStep: 1,
    totalSteps: 3,
    randomStimulus: "butterfly",
    output: "Random word selected: BUTTERFLY. A delicate insect that transforms completely, has symmetrical wings, moves in unpredictable patterns, and is attracted to flowers.",
    nextStepNeeded: true
  },
  {
    technique: "random_entry",
    problem: "Generate ideas for a new fitness product",
    currentStep: 2,
    totalSteps: 3,
    connections: [
      "Transformation like metamorphosis = fitness transformation journey",
      "Symmetrical wings = balanced workout for both sides of body",
      "Unpredictable flight = varied, non-linear workout patterns",
      "Attracted to flowers = making fitness beautiful and appealing"
    ],
    output: "Connections established between butterfly characteristics and fitness concepts, focusing on transformation, balance, variety, and aesthetic appeal.",
    nextStepNeeded: true
  },
  {
    technique: "random_entry",
    problem: "Generate ideas for a new fitness product",
    currentStep: 3,
    totalSteps: 3,
    output: "Product idea: 'Metamorphosis' - a fitness system that tracks your complete transformation journey with beautiful visualizations, ensures balanced bilateral exercises, uses AI to create unpredictable workout patterns preventing plateaus, and gamifies progress with butterfly-themed achievements.",
    nextStepNeeded: false
  }
];

// Example 4: SCAMPER for "Improving Water Bottle Design"
const scamperExample = [
  {
    technique: "scamper",
    problem: "Redesign a water bottle for hikers",
    currentStep: 1,
    totalSteps: 7,
    scamperAction: "substitute",
    output: "Substitute plastic with biodegradable algae-based material. Replace screw cap with magnetic closure. Substitute rigid form with collapsible design that expands when filled.",
    nextStepNeeded: true
  },
  {
    technique: "scamper",
    problem: "Redesign a water bottle for hikers",
    currentStep: 2,
    totalSteps: 7,
    scamperAction: "combine",
    output: "Combine water bottle with: built-in water purification system, compass in the cap, emergency whistle in the handle, and solar panel strip for charging devices.",
    nextStepNeeded: true
  },
  // ... continue through adapt, modify, put to other use, eliminate, and reverse
];

// Example 5: Using Revision Feature
const revisionExample = {
  technique: "six_hats",
  problem: "How to improve customer service response times",
  currentStep: 3,
  totalSteps: 6,
  hatColor: "red",
  output: "Revised emotion analysis: Beyond frustration, customers feel betrayed when promises aren't kept. Agents experience burnout, not just stress. There's also pride when problems are solved well.",
  nextStepNeeded: true,
  isRevision: true,
  revisesStep: 3
};

// Example 6: Using Branching Feature
const branchExample = {
  technique: "scamper",
  problem: "Redesign a water bottle for hikers",
  currentStep: 4,
  totalSteps: 7,
  scamperAction: "modify",
  output: "Branch exploration: What if we magnify the social aspect? Create a bottle that connects to other hikers' bottles via Bluetooth, sharing hydration reminders and location for safety.",
  nextStepNeeded: true,
  branchFromStep: 3,
  branchId: "social_features_branch"
};

// Usage in an MCP client:
// const response = await mcpClient.callTool('lateralthinking', sixHatsExample[0]);
// console.log(response);
