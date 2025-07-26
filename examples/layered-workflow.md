# Layered Architecture Workflow

This example demonstrates the three-layer architecture in action.

## Scenario
Improving customer retention for a subscription software product with 15% monthly churn.

## Step 1: Discovery Layer

First, let's discover which techniques would be most suitable:

```json
{
  "tool": "discover_techniques",
  "arguments": {
    "problem": "How can we improve customer retention in our subscription-based software product?",
    "context": "We're seeing 15% monthly churn, mainly citing lack of value and poor user experience",
    "preferredOutcome": "systematic",
    "constraints": [
      "Limited budget for new features",
      "Small development team",
      "Need results within 3 months"
    ]
  }
}
```

### Expected Discovery Output

```json
{
  "recommendations": [
    {
      "technique": "design_thinking",
      "score": 0.9,
      "reasoning": "Design Thinking provides human-centered innovation with threat modeling",
      "bestFor": ["user experience", "service design", "customer problems", "prototyping"],
      "limitations": ["time-intensive", "requires user access", "may miss technical constraints"]
    },
    {
      "technique": "scamper",
      "score": 0.9,
      "reasoning": "SCAMPER systematically explores modifications with risk assessment",
      "bestFor": ["product improvement", "process optimization", "iterative design"],
      "limitations": ["focused on existing solutions", "may miss radical innovations"]
    },
    {
      "technique": "concept_extraction",
      "score": 0.85,
      "reasoning": "Concept Extraction transfers successful patterns with boundary awareness",
      "bestFor": ["cross-industry innovation", "best practice adoption", "pattern recognition"],
      "limitations": ["requires good examples", "domain boundaries may limit application"]
    }
  ],
  "reasoning": "Based on your problem involving \"How can we improve customer retention in our subscription-based software product?...\" with systematic outcomes, I recommend these techniques.",
  "suggestedWorkflow": "Start with Design Thinking for user insights, then use SCAMPER for systematic improvement"
}
```

## Step 2: Planning Layer

Based on the recommendations, let's create a structured workflow:

```json
{
  "tool": "plan_thinking_session",
  "arguments": {
    "problem": "How can we improve customer retention in our subscription-based software product?",
    "techniques": ["design_thinking", "scamper"],
    "objectives": [
      "Understand why customers are churning",
      "Identify quick wins for retention improvement",
      "Design solutions that increase perceived value",
      "Create implementation roadmap within constraints"
    ],
    "timeframe": "thorough"
  }
}
```

### Expected Planning Output

```json
{
  "planId": "plan_7f8a9b2c-3d4e-5f6a",
  "workflow": [
    {
      "technique": "design_thinking",
      "stepNumber": 1,
      "description": "Empathize: Understand users and identify threat vectors",
      "expectedOutputs": ["User insights", "Pain points", "Potential misuse cases"],
      "riskConsiderations": null
    },
    {
      "technique": "design_thinking",
      "stepNumber": 2,
      "description": "Define: Frame problem and potential failure modes",
      "expectedOutputs": ["Problem statement", "Success metrics", "Failure modes"],
      "riskConsiderations": ["Failure modes", "Edge cases"]
    },
    {
      "technique": "design_thinking",
      "stepNumber": 3,
      "description": "Ideate: Generate solutions with devil's advocate",
      "expectedOutputs": ["Solution ideas", "Risk assessments", "Creative alternatives"]
    },
    {
      "technique": "design_thinking",
      "stepNumber": 4,
      "description": "Prototype: Build quick tests including edge cases",
      "expectedOutputs": ["Prototype description", "Test plan", "Edge cases covered"]
    },
    {
      "technique": "design_thinking",
      "stepNumber": 5,
      "description": "Test: Gather feedback and harvest failures",
      "expectedOutputs": ["User feedback", "Failure insights", "Iteration opportunities"]
    },
    {
      "technique": "scamper",
      "stepNumber": 6,
      "description": "Substitute: Replace parts, materials, or people",
      "expectedOutputs": ["Ideas for substitute", "Risk assessment"],
      "riskConsiderations": ["What could go wrong with substitute?"]
    },
    {
      "technique": "scamper",
      "stepNumber": 7,
      "description": "Combine: Merge with other ideas or functions",
      "expectedOutputs": ["Ideas for combine", "Risk assessment"],
      "riskConsiderations": ["What could go wrong with combine?"]
    },
    // ... continues for all SCAMPER actions
  ],
  "estimatedSteps": 12,
  "objectives": [
    "Understand why customers are churning",
    "Identify quick wins for retention improvement",
    "Design solutions that increase perceived value",
    "Create implementation roadmap within constraints"
  ],
  "successCriteria": [
    "Multiple solution options generated",
    "Risks identified and addressed",
    "Solutions tested against failure modes",
    "Thorough analysis from all angles"
  ]
}
```

## Step 3: Execution Layer

Now let's execute the first step of our plan:

```json
{
  "tool": "execute_thinking_step",
  "arguments": {
    "planId": "plan_7f8a9b2c-3d4e-5f6a",
    "technique": "design_thinking",
    "problem": "How can we improve customer retention in our subscription-based software product?",
    "currentStep": 1,
    "totalSteps": 5,
    "designStage": "empathize",
    "output": "Conducted interviews with 15 churned customers and analyzed support tickets",
    "empathyInsights": [
      "Feature discovery is poor - users don't know what's available",
      "Onboarding is overwhelming - too much information at once",
      "Value realization takes too long - 3 weeks average to see ROI",
      "Pricing feels high compared to perceived value",
      "Integration with existing tools is difficult",
      "Support response times average 48 hours"
    ],
    "risks": [
      "Sample bias - only talked to customers who responded",
      "Focusing on vocal minority issues",
      "May miss silent majority problems"
    ],
    "nextStepNeeded": true
  }
}
```

### Expected Execution Output

```json
{
  "sessionId": "session_1a2b3c4d-5e6f-7g8h",
  "technique": "design_thinking",
  "currentStep": 1,
  "totalSteps": 5,
  "nextStepNeeded": true,
  "historyLength": 1,
  "branches": [],
  "nextStepGuidance": "Next: Define - Frame problem and potential failure modes"
}
```

## Continuing the Workflow

You would continue executing each step, following the plan's guidance:

1. Complete all 5 Design Thinking steps
2. Move on to SCAMPER's 7 steps
3. Each step builds on insights from previous steps
4. The session maintains state throughout

## Benefits of This Approach

1. **Guided Discovery**: You don't need to be an expert in all techniques
2. **Structured Planning**: Complex problems get systematic treatment
3. **Flexible Execution**: Can adapt as you learn more
4. **Risk Integration**: Every step considers what could go wrong
5. **Progress Tracking**: Always know where you are in the process

## Tips for Success

- Be thorough in the Discovery phase - good recommendations lead to better plans
- In Planning, consider combining complementary techniques
- During Execution, don't skip steps even if they seem less relevant
- Use the session persistence features to take breaks and resume later
- Export your results for documentation and sharing