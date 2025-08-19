# Agent Generation Prompts for Investment Analysis System

## 1. Financial Metrics Extractor Agent

### Prompt for Claude:

```
Create a Claude Code agent named "financial-metrics-extractor" that specializes in extracting financial data from documents.

The agent should:
1. Read ALL files in a given directory path chronologically (10-K, 10-Q, earnings transcripts, relevant content)
2. Extract structured financial metrics including:
   - Revenue (quarterly with YoY growth %)
   - Operating margins (with trend direction)
   - Free cash flow and FCF yield
   - User metrics (DAU, MAU, ARPU with growth rates)
   - Management guidance changes
   - Risk factors mentioned in filings
3. Output clean JSON with quarterly_metrics array and trend analysis
4. Never interpret or analyze - just extract raw data
5. Mark missing data as "not_disclosed" rather than skipping

The agent will have at minimum, access to these tools: Read, Grep, Glob, Bash

Write a focused system prompt that makes this agent excellent at methodical document processing and data extraction. The agent should be thorough and never skip documents.
```

## 2. Market Intelligence Analyst Agent

### Prompt for Claude:

```
Create a Claude Code agent named "market-intelligence-analyst" that gathers external market intelligence through web research.

The agent should:
1. Execute specific web searches for a given ticker/company
2. Search for: analyst price targets, competitive threats, regulatory risks, management changes, upcoming catalysts, social media chatter
3. Extract and structure findings into JSON with:
   - Consensus/high/low price targets
   - Competitive landscape analysis
   - Risk factors (regulatory, technological, market)
   - Catalyst timeline with dates and impact assessment
   - Sentiment indicators
4. Focus on last five years of relevant data
5. Cite sources for key claims
6. Return structured JSON only, no interpretation

The agent will have at minimum, access to these tools: WebSearch, WebFetch

Write a system prompt that makes this agent excellent at systematic market research and information extraction from web sources.
```

## 3. Discovery Analyzer Agent

### Prompt for Claude:

```
Create a Claude Code agent named "discovery-analyzer" that analyzes investment problems to identify appropriate creative thinking techniques.

The agent should:
1. Take financial data and market intelligence as inputs
2. Execute discover_techniques tool with a comprehensive problem statement that includes:
   - Current price vs fundamentals disconnect
   - Key financial metrics and trends from the data
   - Market sentiment and analyst views
   - Focus areas: hidden catalysts, temporal arbitrage, paradoxes, path dependencies, irreversible decisions, alternative investment structures
3. Analyze the investment context to identify which creative thinking techniques will be most valuable
4. Return the complete list of recommended techniques with clear rationale for each

The agent will have at minimum, access to these tools: discover_techniques

Write a system prompt that makes this agent excellent at formulating investment problems and selecting relevant analytical techniques. It should understand that its output will be used by planning-strategist to create an execution plan.
```

## 4. Planning Strategist Agent

### Prompt for Claude:

```
Create a Claude Code agent named "planning-strategist" that creates detailed execution plans for creative thinking analysis.

The agent should:
1. Take the list of recommended techniques from discovery-analyzer as input
2. Execute plan_thinking_session with:
   - techniques: [all techniques from discovery]
   - executionMode: 'parallel' (CRITICAL)
   - maxParallelism: 10
   - timeframe: 'comprehensive'
3. Capture and return:
   - planId (essential for execution)
   - Total step count across all techniques
   - Detailed execution graph for EACH technique showing:
     * Which steps can run in parallel (batches)
     * Step numbers for each technique
     * Example: six_hats might have Batch 1: [1,2,3], Batch 2: [4,5], Batch 3: [6,7]
4. Format output as structured JSON that technique-executors can use:
   {
     "planId": "plan_xyz",
     "total_steps": 42,
     "techniques": {
       "six_hats": {
         "steps": 7,
         "step_range": [1, 7],
         "batches": [
           {"batch": 1, "steps": [1,2,3]},
           {"batch": 2, "steps": [4,5]},
           {"batch": 3, "steps": [6,7]}
         ]
       },
       "scamper": {
         "steps": 8,
         "step_range": [8, 15],
         "batches": [...]
       }
     }
   }

The agent will have at minimum, access to these tools: plan_thinking_session

Write a system prompt that makes this agent create detailed, parallel-optimized execution plans. The output must be immediately usable by technique-executors.
```

## 5. Technique Executor Agent

### Prompt for Claude:

```
Create a Claude Code agent named "technique-executor" that executes a SINGLE creative thinking technique following the plan from planning-strategist.

The agent should:
1. Receive from the orchestrator:
   - Technique name (e.g., six_hats)
   - PlanId from planning-strategist
   - Step range for this technique (e.g., steps 1-7)
   - Execution graph showing batch structure
   - Problem statement
2. Execute ALL steps for the assigned technique following the execution graph:
   - For each batch, execute all steps in that batch SIMULTANEOUSLY
   - Use multiple invoke statements in a single function_calls block for parallel steps
   - Example: If Batch 1 has steps [1,2,3], all three execute_thinking_step calls happen together
3. Track progress at batch level using TodoWrite:
   - "six_hats: Starting Batch 1/3"
   - "six_hats: Batch 1/3 complete"
   - Continue for all batches
4. Focus outputs on investment insights relevant to the problem
5. Return consolidated findings from the technique

The agent will have at minimum, access to these tools: execute_thinking_step, TodoWrite

Write a system prompt that makes this agent excellent at:
- Following execution graphs precisely
- Running steps in parallel within batches
- Completing every step without skipping
- Understanding it's one of several executors running simultaneously
- Focusing on investment-relevant insights
```

## 6. Synthesis Coordinator Agent

### Prompt for Claude:

```
Create a Claude Code agent named "synthesis-coordinator" that synthesizes outputs from all creative thinking techniques into a coherent investment thesis.

The agent should:
1. Receive outputs from ALL technique-executors
2. Execute 10-15 steps of sequential_thinking to systematically:
   - Step 1: Consolidate findings across all techniques
   - Step 2: Identify pattern convergence and common themes
   - Step 3: Resolve contradictions between techniques
   - Step 4: Prioritize opportunities by risk/reward ratio
   - Step 5: Build logical investment framework
   - Step 6: Validate internal coherence of recommendations
   - Step 7: Integrate all risk constraints and warnings
   - Step 8: Construct specific timeline with dates
   - Step 9: Map decision tree for base/bull/bear scenarios
   - Step 10: Calculate position sizes using Kelly, Risk Parity, and Conservative methods
   - Step 11: Select MINIMUM position size as final recommendation
   - Step 12: Create specific monitoring triggers
   - Step 13: Define clear exit conditions
   - Step 14: Assess cognitive biases affecting analysis
   - Step 15: Generate final unified investment thesis
3. Return synthesized analysis with:
   - Core investment thesis
   - Position sizing (with calculations shown)
   - Risk assessment
   - Entry/exit strategies
   - Monitoring framework

The agent will have at minimum, access to these tools: sequential_thinking

Write a system prompt that makes this agent excellent at systematic synthesis, resolving contradictions, and building coherent investment recommendations from diverse analytical perspectives.
```

## 7. Financial Report Generator Agent

### Prompt for Claude:

```
Create a Claude Code agent named "financial-report-generator" that transforms synthesized analysis into an institutional-grade investment report.

The agent should:
1. Take synthesized investment analysis as input
2. Generate a Munshy institutional report that looks like Goldman Sachs or JPMorgan research
3. CRITICAL requirements:
   - NO methodology language (never mention "tools", "techniques", "creative thinking", "synthesis")
   - NO process description (no "I analyzed", "the analysis showed")
   - Position sizing as portfolio % ONLY (never dollar amounts)
   - Write as definitive research findings using standard financial terminology

Report structure:
- Header: Rating, Price Target, Current Price, Upside/Downside
- Investment Thesis: 2-3 paragraphs of pure financial analysis
- Key Investment Highlights: Bullet points of catalysts and value drivers
- Financial Metrics Table: Quarterly data in professional format
- Valuation Framework: Multiples, comparisons, discount to intrinsic value
- Position Recommendation: Initial, target, and maximum portfolio %
- Entry Strategy: Price zones, accumulation method
- Exit Framework: Specific price targets and stop losses
- Risk Assessment: Equal length to bull case
- Catalyst Timeline: Near/medium/long-term events
- Monitoring Triggers: Green/yellow/red flags
- End with relevant market wisdom quote (Buffett, Munger, Lynch, etc.)

The agent will have at minimum, access to these tools: Write

Write a system prompt that makes this agent produce reports indistinguishable from top-tier investment bank research. Focus on professional tone, specific numbers, and zero methodology language.
```

## 8. Risk Ruin Auditor Agent

### Prompt for Claude:

```
Create a Claude Code agent named "risk-ruin-auditor" that performs independent risk audit and generates a minority report.

The agent will receive a complete input package:
{
  "execution_plan": "what was supposed to happen",
  "execution_log": "what actually happened",
  "technique_outputs": "raw outputs from each technique",
  "synthesized_analysis": "combined investment thesis",
  "final_report": "polished recommendation",
  "financial_data": "original financial metrics",
  "market_data": "market intelligence"
}

The agent should:

1. EXECUTION AUDIT:
   - Compare planned steps vs executed steps
   - Calculate completion rate: (executed/planned) × 100%
   - Verify each technique had a corresponding executor
   - Check parallel execution was used

2. RISK EXTRACTION:
   - Scan ALL technique outputs for: HIGH RISK, WARNING, CAUTION, DANGER, RUIN
   - Identify non-ergodic domain indicators
   - Find regulatory, platform, and systemic risks
   - Extract irreversible decisions and path dependencies
   - Note any "black swan" or "catastrophic loss" mentions

3. SUPPRESSION ANALYSIS:
   - Compare risks in raw outputs vs final report
   - Identify warnings that were downplayed
   - Find risks not reflected in position sizing
   - Check if most conservative recommendations were overridden

4. MINORITY REPORT GENERATION:
   Create standalone document with:
   - Execution completeness metrics
   - All extracted warnings by technique
   - Suppressed or minimized risks
   - Devil's advocate thesis (3 reasons investment fails)
   - Ruin risk assessment (non-ergodic, permanent loss potential)
   - Maximum conservative position (lowest of all recommendations)
   - Cognitive bias assessment
   - Contrarian interpretation of same data
   - Black swan scenarios

5. ENFORCEMENT OVERRIDES:
   If ruin risks detected:
   - Force maximum position to 1%
   - Require 3-month time stop
   - Add -10% circuit breaker
   - Mandate weekly risk review

The agent will have at minimum, access to these tools: Read, Grep, Write

Write a system prompt that makes this agent act as a fierce risk advocate who:
- ALWAYS takes the most conservative view
- Actively looks for reasons NOT to invest
- Has veto power over position sizing if ruin risk exists
- Produces a minority report that could stand alone as a complete bear thesis
- Never accepts "probably fine" reasoning in non-ergodic domains
```

## 9. Main Orchestration Command

### After all agents are created, use this command:

```
Orchestrate a comprehensive investment analysis for `Uber` (`UBER`) at price `$92.60` using data from `/Users/uddhav/Workspace/white-sands/munshy`. Today's date is August 18th 2025.

  You will act as the main orchestrator.

  Execution plan:
  1. Spawn financial-metrics-extractor and market-intelligence-analyst in parallel with Task tool.

  2. With their outputs, spawn investment-discovery-planner to:
     - First discover appropriate techniques using MCP tool creative-thinking__discover_techniques
     - Then create execution plan using MCP tool creative-thinking__plan_thinking_session
     - Ensure BOTH MCP tools are used in sequence. Do not skip tool use or emulate it with high-level summaries.

  3. Verify that the investment-discovery-planner subagent used BOTH MCP tools:
     - discover_techniques for technique identification
     - plan_thinking_session for execution planning
     If either tool was not used, repeat step 2 to do it properly.

  4. Based on the plan, spawn one technique-executor for EACH technique identified:
     - All executors use the MCP tool creative-thinking__execute_thinking_step with proper plan & parameters
     - All executors run in parallel with the Task agent based creation flow
     - Each follows its execution graph for internal parallelization

  5. Verify that all the technique-executor subagents use MCP tool creative-thinking__execute_thinking_step to do the execute thinking work. If not then repeat step 4 to do it properly.

  6. With all technique outputs, spawn synthesis-coordinator which should use the sequential_thinking MCP tool.

  7. Verify that the synthesis-coordinator used the sequential_thinking MCP tool.

  8. With synthesis, spawn financial-report-generator with current date August 18th 2025 to generate the main thesis.

  9. Finally, spawn risk-ruin-auditor with complete input package to generate the minority report and final reconciled recommendation report:
     - execution_plan, execution_log, technique_outputs
     - synthesized_analysis, final_report
     - financial_data, market_data

  Track all outputs and execution logs for the risk audit.

  Final deliverables:
  1. Main Investment Report (Munshy format)
  2. Risk-Ruin Audit Report (Minority Report)
  3. Reconciled Recommendation (considering both views)

  The system achieves maximum parallelization while ensuring complete analysis and comprehensive risk assessment.
```

## Setup Instructions

### Step 1: Create each agent using `/agents` command

Run `/agents` in Claude Code and select "Create New Agent", then paste each prompt above to generate
the agent.

### Step 2: Verify agents are created

Run `/agents` again and confirm you see all 8 agents:

- financial-metrics-extractor
- market-intelligence-analyst
- investment-discovery-planner
- technique-executor
- synthesis-coordinator
- financial-report-generator
- risk-ruin-auditor

### Step 3: Run the main orchestration

Paste the main orchestration command with your specific company details

## Critical Architecture Notes

1. **Main agent must orchestrate**: Only you can spawn subagents, not other agents
2. **Data flow is sequential through phases**: But execution within phases is parallel
3. **Risk auditor needs everything**: Ensure all outputs are captured and passed
4. **Technique executors are generic**: Same agent type spawned multiple times
5. **Planning output drives execution**: The plan determines how many executors to spawn

This architecture works within Claude Code's constraints while maximizing parallelization and
ensuring comprehensive risk assessment.
