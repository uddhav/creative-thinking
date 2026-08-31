# Creative Thinking MCP Server

## Badges

[![CI Pipeline](https://github.com/uddhav/creative-thinking/actions/workflows/ci.yml/badge.svg)](https://github.com/uddhav/creative-thinking/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/uddhav/creative-thinking/branch/main/graph/badge.svg)](https://codecov.io/gh/uddhav/creative-thinking)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![npm version](https://badge.fury.io/js/creative-thinking.svg)](https://badge.fury.io/js/creative-thinking)

A Model Context Protocol (MCP) server that provides structured creative thinking techniques for
problem-solving and ideation. This server implements 32 creative thinking techniques through a
unified framework combining generative creativity with systematic risk assessment, analytical
verification, and post-action reflexivity tracking.

> **Note**: This repository is a public fork of work originally developed with Munshy, Personal
> Secretary.

## Architecture Principles

This project follows a three-layer tool architecture as its core design principle:

1. **Discovery** - Intelligent technique selection based on problem analysis
2. **Planning** - Structured workflow creation combining multiple techniques
3. **Execution** - Guided step-by-step implementation with state management

### Fundamental Design Decision: Three Tools Only

**This MCP server exposes EXACTLY three tools - no more, no less:**

- `discover_techniques` - Analyzes problems and recommends techniques
- `plan_thinking_session` - Creates structured workflows
- `execute_thinking_step` - Executes individual steps

**All functionality must be integrated into these three tools.** This includes:

- Escape velocity analysis (integrated into discovery/planning)
- Option generation (automatic in discovery when flexibility is low)
- Session management (internal state management)
- Future features (must fit within the three-tool workflow)

This constraint ensures a clean, focused API that mirrors the natural creative thinking workflow and
prevents tool proliferation.

## Overview

The three-layer architecture guides you through comprehensive problem-solving:

1. **Discovery Layer** (`discover_techniques`) - Analyzes problems and recommends suitable thinking
   techniques based on characteristics, context, and desired outcomes.

2. **Planning Layer** (`plan_thinking_session`) - Creates structured workflows that combine
   techniques, providing step-by-step guidance adapted to your timeframe.

3. **Execution Layer** (`execute_thinking_step`) - Guides you through each thinking step while
   maintaining session state and integrating risk assessment.

**📚 New to the techniques? Check out the [Specifications](SPECIFICATIONS.md) for a comprehensive
overview of all 32 techniques and when to use each one.**

This layered approach ensures efficient problem-solving by matching techniques to problems, creating
comprehensive workflows, and maintaining focus throughout the creative process.

## Installation

The package ships **two binaries with different shapes**:

- **`socketes`** — a single-turn CLI. Each invocation runs one operation (`discover` / `plan` /
  `execute` / `session`) and exits. State persists between invocations on the local filesystem under
  `PERSISTENCE_PATH` (default `~/.creative-thinking`). Designed to be driven from a skill or shell.
- **`creative-thinking`** — the long-running stdio MCP server. Speaks JSON-RPC for an MCP client to
  drive. Same three tools under the hood — kept for backwards compatibility.

Distribution is via GitHub (the package is not currently on the npm registry); `dist/` is checked
into the repo so `npx` can run the build directly.

### Global install — both bins land on PATH

```bash
npm install -g github:uddhav/creative-thinking
socketes --help            # the CLI
creative-thinking          # starts the MCP server on stdio
```

### Run from GitHub via NPX (no install)

```bash
# MCP server (default bin)
npx -y github:uddhav/creative-thinking

# CLI — pick the binary by name
npx -y -p github:uddhav/creative-thinking socketes discover --problem "..."
```

### Register with an MCP client (Claude Code shown)

```bash
claude mcp add --transport stdio creative-thinking -- npx -y github:uddhav/creative-thinking
```

### Local development

```bash
# Clone the repository
git clone https://github.com/uddhav/creative-thinking.git
cd creative-thinking

# Install dependencies
npm install

# Build the project
npm run build

# Run locally
node dist/mcp-server-main.js
```

## Sequential Execution Architecture

The Creative Thinking server implements a sequential execution model that ensures maximum coherence
and depth in the creative thinking process.

### How It Works

#### Planning Phase

When you call `plan_thinking_session`, the server:

1. Analyzes the problem and selects appropriate techniques
2. Creates a structured workflow with clear step progression
3. Provides guidance for each step in the sequence
4. Maintains context throughout the thinking process

#### Execution Phase

Each `execute_thinking_step` call:

- Builds progressively on previous insights
- Maintains full session context and state
- Ensures natural flow of creative thinking
- Tracks path dependencies and flexibility

### Key Benefits

- **Coherence**: Each step builds naturally on previous insights
- **Depth**: Full exploration of each technique before moving forward
- **Simplicity**: Straightforward execution model
- **Context**: Rich contextual flow throughout the process

### Example

```javascript
// Step 1: Discover techniques
const discovery = await discoverTechniques({
  problem: 'How to improve team collaboration',
});

// Step 2: Plan the thinking session
const plan = await planThinkingSession({
  problem: 'How to improve team collaboration',
  techniques: ['six_hats', 'scamper'],
});

// Step 3: Execute the thinking steps sequentially
let sessionId;
for (let i = 0; i < plan.totalSteps; i++) {
  const result = await executeThinkingStep({
    planId: plan.planId,
    technique: plan.currentTechnique,
    problem: 'How to improve team collaboration',
    currentStep: i + 1,
    totalSteps: plan.techniqueSteps,
    output: 'Your thinking for this step...',
    nextStepNeeded: i < plan.totalSteps - 1,
    sessionId,
  });

  if (i === 0) {
    sessionId = result.sessionId;
  }
}
```

### Technique Methodologies

Each technique follows its specific sequential process:

- **Six Thinking Hats** - Blue → White → Red → Yellow → Black → Green (6 steps)
- **SCAMPER** - Substitute → Combine → Adapt → Modify → Put to other use → Eliminate → Reverse (7-8
  steps)
- **Disney Method** - Dreamer → Realist → Critic (3 steps)
- **Design Thinking** - Empathize → Define → Ideate → Prototype → Test (5 steps)
- **TRIZ** - Identify → Remove → Apply → Minimize (4 steps)
- **PO** - Provocation → Exploration → Verification → Solution (4 steps)
- **Quantum Superposition** - Generate → Interfere → Entangle → Evolve → Measure → Collapse (6
  steps)
- **Temporal Creativity** - Archaeological Analysis → Present Synthesis → Future Projection → Option
  Creation → Refinement → Integration (6 steps)
- **Paradoxical Problem Solving** - Identify Contradiction → Explore Paradox → Synthesize Unity →
  Generate Novel Solutions → Transcend Paradox (5 steps)
- **Meta-Learning** - Pattern Recognition → Learning Accumulation → Strategy Evolution → Feedback
  Integration → Meta-Synthesis (5 steps)

## Session Resilience

The server supports base64 encoded sessions that can survive server restarts and memory loss:

### How It Works

- **Session Encoding**: Both `planId` and `sessionId` can be base64 encoded tokens
- **State Preservation**: Encoded sessions contain all necessary state to resume
- **Transparent Handling**: Clients see opaque tokens - encoding is handled internally
- **24-Hour Expiry**: Encoded sessions remain valid for 24 hours from creation

### Benefits

- **Server Restart Resilience**: Sessions survive server crashes or restarts
- **Stateless Operation**: No external storage required
- **Backward Compatible**: Regular IDs still work alongside encoded ones
- **Memory Efficient**: Server doesn't need to maintain all session state

### Example

```javascript
// Server returns encoded sessionId when needed
const result = await executeThinkingStep({
  planId: 'eyJwbGFuSWQiOiJwbGFuXzEyMyIsInByb2JsZW0iOi...', // Encoded plan
  technique: 'six_hats',
  problem: 'How to improve team collaboration',
  currentStep: 1,
  totalSteps: 6,
  output: 'Initial thoughts...',
});

// result.sessionId might be encoded for resilience
// Client uses it as-is without knowing it's encoded
const nextResult = await executeThinkingStep({
  sessionId: result.sessionId, // Transparently handled
  // ... other parameters
});
```

## Core Features

### Advanced Architecture Components

- **Error Context Builder**: Centralized error handling with actionable guidance and examples
- **Orchestrator Pattern**: Complex workflow management (Ergodicity, Risk Assessment, Response
  Building)
- **Option Generation Engine**: 12 strategies (8 core + 4 enhanced), activated once when flexibility
  drops below 0.4
- **Early Warning System**: Multi-sensor architecture with 4 warning levels (🟢 SAFE → 🔴 CRITICAL)
- **Export System**: Multi-format support (JSON, CSV, Markdown) with full session fidelity
- **Validation Strategy**: Comprehensive input validation using strategy pattern
- **Persistence Architecture**: Adapter pattern supporting filesystem and memory backends
- **MCP Sampling Integration**: AI-powered enhancement with graceful degradation when unavailable

### 32 Creative Thinking Techniques

Each technique integrates creative generation with systematic verification and post-action
reflexivity tracking. The collection includes 21 core creative techniques, 3 analytical verification
techniques, 4 behavioral economics techniques inspired by Rory Sutherland, 3 judgment and retention
techniques, and 1 adversarial review technique:

**Note**: The discovery layer includes a wildcard technique selection feature (17.5% probability by
default, configurable via `WILDCARD_PROBABILITY` environment variable) that randomly includes an
additional technique to prevent algorithmic pigeonholing and encourage unexpected insights.

- **Six Thinking Hats Plus** - Multi-perspective analysis with meta-uncertainty awareness
- **Provocative Operation (PO)** - Pattern-breaking through systematic verification
- **Random Entry** - Creative connections validated through systematic doubt
- **SCAMPER** - Systematic transformations, each action carrying its own risk question
- **Concept Extraction** - Cross-domain pattern transfer with boundary awareness
- **Yes, And** - Collaborative ideation with built-in critical evaluation
- **Design Thinking** - Human-centered innovation with embedded risk management
- **TRIZ** - Contradiction ELIMINATION through systematic innovation principles
- **Neural State** - Optimize YOUR BRAIN's cognitive states (DMN/ECN balance)
- **Temporal Work Design** - Time-based problem solving and pressure transformation
- **Cultural Integration** - Unified cross-cultural bridge-building and creative synthesis
- **Collective Intelligence** - Wisdom aggregation from diverse knowledge sources
- **Disney Method** - Three-role creative process (Dreamer → Realist → Critic)
- **Nine Windows** - Systematic 3×3 analysis across time and system levels
- **Quantum Superposition** - Maintains multiple contradictory solutions until optimal collapse
- **Temporal Creativity** - Advanced temporal thinking with path memory integration
- **Paradoxical Problem Solving** - PRESERVE contradictions for ongoing flexibility
- **Meta-Learning from Path Integration** - Self-improving system that learns from technique
  patterns
- **Biomimetic Path Management** - Applies biological solutions and evolutionary strategies to
  innovation
- **First Principles Thinking** - Breaks complex problems down to fundamental truths and rebuilds
  solutions
- **Cultural Integration** - Unified cross-cultural bridge-building and creative synthesis
- **Neuro-Computational Synthesis** - AI/ML algorithms for computational creativity (NOT human
  cognition)

**Analytical Verification Techniques:**

- **Criteria-Based Analysis** - Systematic truth verification through established criteria (5 steps)
- **Linguistic Forensics** - Deep analysis of communication patterns for hidden insights (6 steps)
- **Competing Hypotheses Analysis** - Systematic evaluation of multiple explanations using evidence
  matrices and Bayesian reasoning (8 steps)

**Decision & Retention Techniques:**

- **Keeper Test** - Re-decides something already in place by asking whether you would take it on
  today, at today's price, rather than whether it has failed badly enough to remove (5 steps)

**Adversarial Techniques:**

- **Steelman & Red Team** - Builds the opposing case until its own holders would sign it, then
  attacks the plan from a named adversary who wants it to fail. Gated at both halves: a caricatured
  opponent fails the Ideological Turing Test, and findings that could not have changed the decision
  fail the consequence check (7 steps)

### MCP Prompts Support (NEW)

The server exposes pre-configured prompts for common lateral thinking scenarios:

- **problem-discovery**: Discover the best techniques for your specific problem
- **creative-brainstorming**: Generate creative solutions using multiple perspectives
- **risk-analysis**: Analyze potential risks and black swan events
- **complete-session**: Run a complete guided lateral thinking session
- **quantum-thinking**: Explore contradictory solutions simultaneously
- **temporal-creativity**: Apply temporal thinking with path memory tracking

These prompts provide structured conversation starters that guide users through effective use of the
server's capabilities.

### MCP Sampling Integration (AI Enhancement)

The server supports MCP Sampling protocol for AI-powered enhancement of creative thinking
capabilities. When a compatible MCP client provides sampling support, the server can request LLM
completions to enhance various features.

**Key Features:**

- **Automatic Detection**: Server detects client sampling capabilities during handshake
- **Graceful Degradation**: Features work without AI, providing basic functionality
- **Privacy-First**: All sampling is done through the client - server never accesses external APIs
- **Intelligent Routing**: Different features use appropriate model preferences

**Enhanced Features with AI:**

1. **Risk Generation** - Comprehensive risk assessment with severity and mitigation strategies
2. **Idea Enhancement** - Transform basic ideas into detailed, actionable proposals
3. **Smart Summaries** - Intelligent synthesis of creative sessions with key insights
4. **Technique Recommendations** - AI-powered analysis of problem-technique fit
5. **Natural Language Processing** - Advanced text analysis for complexity and patterns

**Configuration:**

MCP Sampling is automatically enabled when:

1. Your MCP client supports the sampling protocol
2. Client sends capability notification during connection
3. No additional configuration needed - it just works!

**Example Flow:**

```javascript
// 1. Client connects and sends capabilities
// Client -> Server: sampling capability notification

// 2. Server detects AI is available
// Features automatically upgrade to enhanced versions

// 3. During execution, server requests AI assistance
const riskAssessment = await generateRisks(solution);
// If AI available: Detailed multi-dimensional risk analysis
// If AI unavailable: Basic risk templates

// 4. Results seamlessly integrate into workflow
// User sees enhanced output without knowing if AI was used
```

**Fallback Behavior:**

When AI is not available, the server provides:

- Template-based risk assessments
- Rule-based idea enhancement
- Statistical summaries
- Heuristic technique recommendations
- Pattern-matching NLP

This ensures the server remains fully functional regardless of AI availability.

### Memory-Aware Outputs (NEW)

All three layers now provide memory-suggestive outputs to enhance contextual understanding:

**Discovery Layer**:

- **Problem Analysis**: Observations about the problem's nature and context
- **Historical Relevance**: Past approaches and their outcomes
- **Searchable Factors**: Key elements to explore further

**Planning Layer**:

- **Technique Rationale**: Why specific techniques were chosen
- **Sequence Logic**: How techniques build upon each other
- **Historical Notes**: Relevant precedents and patterns

**Execution Layer**:

- **Output Completeness**: How fully each step populated the fields its technique asks for (a
  coverage measure, not a quality judgement)
- **Path Dependencies**: How current choices affect future options
- **Noteworthy Moments**: Significant insights or turning points
- **Future Relevance**: Patterns that may apply to future challenges

### Analytical Verification Techniques

Three new techniques provide systematic validation and truth assessment capabilities:

#### Criteria-Based Analysis (CBA)

Five-step structured approach for evaluating authenticity and validity:

1. **Baseline Assessment** - Establish normal patterns and expected characteristics
2. **Cognitive Criteria** - Evaluate logical consistency and detail richness
3. **Motivational Analysis** - Examine incentives and potential biases
4. **Reality Monitoring** - Distinguish experienced vs. imagined elements
5. **Validity Synthesis** - Integrate findings into confidence assessment

Best for: Validating solutions, assessing information reliability, detecting flawed assumptions

#### Linguistic Forensics

Six-step deep analysis of communication patterns:

1. **Content Mapping** - Identify key claims and statements
2. **Pattern Recognition** - Detect linguistic markers and anomalies
3. **Pronoun Analysis** - Examine psychological distance indicators
4. **Complexity Assessment** - Evaluate cognitive load indicators
5. **Emotional Profiling** - Analyze sentiment and affect patterns
6. **Coherence Verification** - Check internal consistency

Best for: Understanding stakeholder communications, revealing hidden insights, cross-cultural
analysis

#### Competing Hypotheses Analysis (CHA)

Eight-step systematic evaluation of multiple explanations:

1. **Hypothesis Generation** - Create multiple competing explanations
2. **Evidence Mapping** - List all available evidence
3. **Matrix Construction** - Build evidence-hypothesis compatibility matrix
4. **Diagnostic Assessment** - Identify discriminating evidence
5. **Deception Modeling** - Consider manipulation possibilities
6. **Bayesian Update** - Apply probabilistic reasoning
7. **Sensitivity Analysis** - Test conclusion robustness
8. **Decision Synthesis** - Integrate into actionable recommendation

Best for: Complex decision-making, handling contradictory evidence, reducing confirmation bias

### Unified Framework Features

- Dual thinking modes with visual indicators for creative and critical phases
- Comprehensive risk and failure mode tracking across all techniques
- Antifragile solution design that benefits from stress and change
- Consideration of low-probability, high-impact events
- Meta-learning metrics to track session effectiveness
- Analytical verification integrated with creative generation

### Session Management

- Full session persistence with save, load, list, delete, and export capabilities
- Automatic progress saving and session tagging for organization
- Multiple export formats (JSON, Markdown, CSV) for different use cases
- Support for revisions and branching during creative exploration
- Progress tracking with visual indicators and formatted output
- Insights extraction and summary generation upon completion

### Telemetry & Analytics (v0.4.0 - pending release)

- Privacy-first analytics with opt-in by default (disabled unless `TELEMETRY_ENABLED=true`)
- Three privacy modes: strict, balanced, minimal
- Output-completeness tracking and analysis
- Session duration and completion metrics
- Visualization tools for data analysis
- Configurable data collection levels

### Ergodicity Awareness (NEW)

The server now tracks path dependencies and non-ergodic effects in creative thinking:

- **Path Memory System** - Tracks how each decision creates irreversible constraints
- **Flexibility Metrics** - How much room the session has left, measured from the shape of the steps
  it ran — **not from what you wrote in them**. Every step declares how hard it is to undo, and the
  measure is a running product over those declarations, so two sessions running the same technique
  cost the same flexibility whether their recorded decisions were reversible experiments or one-way
  doors. This is deliberate: the server cannot honestly read commitment out of prose, and an earlier
  version that scanned your output for six words got it backwards often enough to be removed — "we
  should NOT remove the fallback" read as maximal commitment. Read `currentFlexibility` as a reading
  on path shape, not on decision content.
- **Absorbing Barrier Detection** - Warns about approaching irreversible states like:
  - Cognitive lock-in (stuck in one way of thinking)
  - Analysis paralysis (overthinking preventing action)
  - Perfectionism trap (standards preventing completion)
- **Escape Routes** - Suggests ways to regain flexibility when options are limited
- **Visual Indicators** - Shows path metrics in every thinking step output

The system recognizes that creative processes are non-ergodic: each decision permanently changes the
landscape of future possibilities. This helps you maintain awareness of path dependencies and avoid
getting trapped in absorbing states.

### 🚨 Absorbing Barrier Early Warning System

The integrated early warning system continuously monitors for approaching "points of no return" in
your creative process:

- **Multi-Sensor Monitoring**: Tracks cognitive rigidity, resource depletion, and technical debt
  accumulation
- **Four Warning Levels**: 🟢 SAFE > 🟡 CAUTION > 🟠 WARNING > 🔴 CRITICAL
- **Escape Protocols**: Provides actionable strategies to regain flexibility before hitting barriers
- **Visual Alerts**: Critical warnings appear prominently in the output to ensure timely action

When barriers are detected, the system recommends specific escape protocols ranging from simple
pattern interruption to strategic pivots, each calibrated to your current flexibility level.

### 🌱 Option Generation Engine

When flexibility drops below 0.4, the system automatically activates the Option Generation Engine to
create new possibilities through eight core strategies plus four advanced techniques:

- **Decomposition** - Break monolithic commitments into flexible modules
- **Temporal** - Adjust time parameters (delay commitments, accelerate options)
- **Abstraction** - Move up abstraction levels to find new solution spaces
- **Inversion** - Flip constraints into features and reverse assumptions
- **Stakeholder** - Introduce new perspectives and collaborative opportunities
- **Resource** - Reallocate or discover untapped resources
- **Capability** - Leverage hidden skills or develop new competencies
- **Recombination** - Mix existing elements in novel ways **Advanced Option Generation Techniques**
  (NEW):
- **Constraint Relaxation** - Temporarily loosen non-critical constraints
- **Alternative Universes** - Explore "what if" scenarios systematically
- **Antifragile Design** - Create options that benefit from volatility
- **Time Arbitrage** - Exploit temporal differences in constraints

The engine evaluates each generated option for flexibility gain, implementation cost, reversibility,
and synergy with existing choices, ensuring practical and effective recommendations.

## 🎯 Enhancement Features

The Creative Thinking Server includes several advanced features that enhance the quality and safety
of your creative process:

### 📍 Visual Indicators (NEW)

Optional technique-specific state indicators provide real-time context on stderr output:

**Key Features:**

- **Technique State**: Shows current mode (e.g., `[🔴 Red Hat]`, `[❌ ELIMINATE]`)
- **Risk Level**: Visual risk assessment (`[🟢 Low Risk]` to `[⚫ Ruin Risk]`)
- **Flexibility Score**: Path flexibility warnings (`[⚠️ Flexibility: 25%]`)
- **Environment Control**: Enable with `SHOW_TECHNIQUE_INDICATORS=true`
- **Clean Output**: Disabled by default to maintain minimal interface

**Example Display:**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    ✨ 🔧 SCAMPER - Step 6/8                                 │
│                  [❌ ELIMINATE] [🔴 High Risk] [⚠️ Flexibility: 25%]        │
├──────────────────────────────────────────────────────────────────────────────┤
```

See [Visual Indicators in Contributing Guide](./CONTRIBUTING.md#visual-indicators) for full details.

### 📊 Reality Gradient System

The Reality Gradient System enhances creative thinking by annotating ideas with their possibility
levels and breakthrough requirements, rather than blocking "impossible" ideas.

**Key Features:**

- **Automatic Assessment**: Ideas are evaluated during execution for feasibility
- **Non-Blocking Design**: Assessments appear as informational annotations, not barriers
- **Possibility Levels**: `feasible`, `difficult`, `breakthrough-required`, or `impossible`
- **Domain Awareness**: Detects finance, healthcare, technology, and regulatory contexts
- **Historical Precedents**: Shows examples of "impossible" becoming possible
- **Breakthrough Guidance**: Identifies what needs to change for ideas to work

**When It Activates:**

- Automatically during execution when ideas contain impossibility markers
- Only adds assessment for non-trivial feasibility issues
- Respects pre-existing reality assessments

### 🧠 Complexity Analysis

The Complexity Analysis system monitors the cognitive load of your thinking process and suggests
strategies when complexity becomes overwhelming.

**Key Features:**

- **NLP-Based Analysis**: Uses natural language processing to assess complexity
- **Pattern Detection**: Identifies multiple interacting elements, conflicts, and uncertainty
- **Automatic Suggestions**: Provides decomposition strategies for high complexity
- **Real-Time Monitoring**: Analyzes both current output and recent history

**When It Activates:**

- During execution when output complexity exceeds thresholds
- When recent outputs show increasing complexity over time
- Suggests sequential thinking for systematic decomposition

**Example Suggestions:**

- Break down into smaller sub-problems
- Analyze each component separately before integration
- Create visual representations of relationships
- Systematic review of each element

### 🔄 Ergodicity Awareness (Enhanced)

The Ergodicity system tracks path dependencies and non-reversible effects in creative thinking,
helping you avoid getting trapped in absorbing states. Now with improved visibility and
user-friendly warnings.

**Key Features:**

- **Path Memory**: Records all decisions and their irreversible effects
- **Flexibility Metrics**: Room left in the session (0-1 scale), measured from the declared shape of
  the steps run and not from their content — two sessions running the same technique score the same
  whatever they decided in it (see "Ergodicity Awareness" above)
- **Absorbing Barrier Detection**: Warns about approaching irreversible states
- **Visual Indicators**: Shows path metrics in every thinking step output
- **Escape Routes**: Suggests ways to regain flexibility when options are limited

**Enhanced Visibility (v0.3.1):**

- **Visual Warnings**: Color-coded flexibility alerts (🔴 critical < 20%, 🟡 warning < 30%, 🔵
  caution < 40%)
- **User-Friendly Messages**: Plain language explanations of flexibility status
- **Alternative Suggestions**: Automatic display when flexibility drops below 40%
- **Escape Route Display**: Visual presentation of available options to regain flexibility
- **Response Integration**: Flexibility data now included in all execution responses

**Example Visual Warning:**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    ⚠️  Flexibility Alert: 25% remaining                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ Warning: Options are becoming limited. Generate alternatives now.             │
├──────────────────────────────────────────────────────────────────────────────┤
│ Alternative Approaches:                                                       │
│  1. Step back and reconsider the core problem                               │
│  2. Remove constraints rather than adding features                           │
│  3. Explore alternative implementation paths                                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Common Absorbing States Detected:**

- Cognitive lock-in (stuck in one way of thinking)
- Analysis paralysis (overthinking preventing action)
- Perfectionism trap (standards preventing completion)
- Technical debt accumulation
- Resource depletion

### 🌟 Memory-Aware Outputs

All three layers provide rich contextual information to help you understand and remember your
creative journey:

**Discovery Layer:**

- Problem observation and analysis
- Historical relevance to similar problems
- Searchable factors for future reference

**Planning Layer:**

- Technique rationale explaining choices
- Sequence logic for workflow design
- Historical notes on technique combinations

**Execution Layer:**

- Output-completeness scoring (0-1) — measures how fully outputs were populated, not how good they
  were
- Path dependencies created
- Flexibility impact measurements
- Noteworthy moments flagged
- Future relevance assessments

### 📊 Analytics and Effectiveness Tracking (NEW)

Optional telemetry system for tracking technique effectiveness:

**Privacy-First Design:**

- Opt-in only (disabled by default)
- No personal data collection
- Local storage by default
- Anonymous session tracking

**Insights Available:**

- Output-completeness scores
- Insight generation patterns
- Risk identification rates
- Session completion analytics
- Technique combination success

Enable with `TELEMETRY_ENABLED=true`. See
[Telemetry in Contributing Guide](./CONTRIBUTING.md#telemetry-system) for details.

### 🚀 Integrated Early Warning System

Continuously monitors for approaching "points of no return" in your creative process:

**Warning Levels:**

- 🟢 **SAFE**: Full flexibility maintained
- 🟡 **CAUTION**: Some constraints emerging
- 🟠 **WARNING**: Significant flexibility loss
- 🔴 **CRITICAL**: Approaching absorbing barrier

**Escape Protocols:**

- Pattern interruption for mild warnings
- Strategic pivots for severe warnings
- Complete reframing for critical states

## Tools

### 🔍 discover_techniques

Analyzes your problem and recommends the most suitable creative thinking techniques.

**Inputs:**

- `problem` (string, required): The problem or challenge you want to solve
- `context` (string, optional): Additional context about the situation
- `preferredOutcome` (string, optional): The type of solution you prefer
  - Options: 'innovative', 'systematic', 'risk-aware', 'collaborative', 'analytical'
- `constraints` (array, optional): Any constraints or limitations to consider
- `sessionId` (string, optional): Current session ID to check flexibility and generate options
- `currentFlexibility` (number, optional): Current flexibility score (0-1). If not provided, will be
  calculated from session

**Example:**

```json
{
  "problem": "How can we reduce customer churn while maintaining profitability?",
  "context": "SaaS business with increasing competition",
  "preferredOutcome": "systematic",
  "constraints": ["Limited development resources", "Cannot reduce prices"]
}
```

### 📋 plan_thinking_session

Creates a structured workflow for applying one or more creative thinking techniques.

**Inputs:**

- `problem` (string, required): The problem to solve
- `techniques` (array, required): The techniques to include in the workflow
  - Options: 'six_hats', 'po', 'random_entry', 'scamper', 'concept_extraction', 'yes_and',
    'design_thinking', 'triz', 'neural_state', 'temporal_work', 'cross_cultural',
    'collective_intel', 'disney_method', 'nine_windows'
- `objectives` (array, optional): Specific objectives for this session
- `constraints` (array, optional): Constraints to work within
- `timeframe` (string, optional): How much time/depth to invest
  - Options: 'quick', 'thorough', 'comprehensive'

**Example:**

```json
{
  "problem": "Redesign onboarding process for better user retention",
  "techniques": ["design_thinking", "scamper"],
  "objectives": ["Reduce time to first value", "Increase completion rate"],
  "timeframe": "thorough"
}
```

### 🎯 execute_thinking_step

Executes a single step in your creative thinking process.

**Inputs:**

- `planId` (string, required): ID from plan_thinking_session
- `technique` (string, required): The lateral thinking technique to use
- `problem` (string, optional): Resolved from `planId` when omitted — the plan states it once and
  its `executionGraph` nodes leave it out, so nodes run verbatim without it. Send it only to
  override; a sent value wins.
- `currentStep` (integer, required): Current step number in the technique
- `totalSteps` (integer, required): Total steps for this technique
- `output` (string, required): Your creative output for this step
- `nextStepNeeded` (boolean, required): Whether another step is needed

**Technique-specific inputs:**

- `hatColor` (string, optional): Current hat color for six_hats technique
- `provocation` (string, optional): The provocative statement for po technique — plans assign one at
  plan time (`stimulus` on the technique's first workflow step); send the assigned value, or a
  `stimulus.mismatch` advisory finding is attached
- `principles` (array, optional): Extracted principles for po technique
- `randomStimulus` (string, optional): The random word/concept for random_entry — plans assign one
  at plan time; send the assigned value, or a `stimulus.mismatch` advisory finding is attached
- `connections` (array, optional): Generated connections for random_entry
- `scamperAction` (string, optional): Current SCAMPER action
- `successExample` (string, optional): Successful solution to analyze for concept_extraction
- `extractedConcepts` (array, optional): Key concepts from success example
- `abstractedPatterns` (array, optional): Generalized patterns from concepts
- `applications` (array, optional): Applications of patterns to problem
- `initialIdea` (string, optional): Starting idea for yes_and technique
- `additions` (array, optional): Creative additions building on idea
- `evaluations` (array, optional): Critical evaluations of potential issues
- `synthesis` (string, optional): Final integrated solution
- `designStage` (string, optional): Current Design Thinking stage
- `empathyInsights` (array, optional): User needs and threat vectors
- `problemStatement` (string, optional): Framed problem with failure modes
- `ideaList` (array, optional): Generated ideas with risk assessment
- `prototypeDescription` (string, optional): Prototype including edge cases
- `userFeedback` (array, optional): Feedback from testing
- `failureInsights` (array, optional): Insights from failure analysis
- `contradiction` (string, optional): Core contradiction for TRIZ
- `inventivePrinciples` (array, optional): TRIZ principles applied
- `viaNegativaRemovals` (array, optional): Elements removed via negativa
- `minimalSolution` (string, optional): Final minimal solution

**Unified Framework fields (applicable to all techniques):**

- `risks` (array, optional): Identified risks or potential issues
- `failureModes` (array, optional): Ways the solution could fail
- `mitigations` (array, optional): Strategies to address risks
- `antifragileProperties` (array, optional): Ways solution benefits from stress
- `blackSwans` (array, optional): Low probability, high impact events to consider

**Advanced features:**

- `isRevision` (boolean, optional): Whether this revises a previous step
- `revisesStep` (integer, optional): Which step is being revised
- `branchFromStep` (integer, optional): Step number to branch from
- `branchId` (string, optional): Identifier for the branch

**Example Reality Assessment:**

```
📊 Reality Navigator:
Idea: "Wireless energy transmission with 100% efficiency"
Reality Assessment:
- Level: breakthrough-required (physical)
- Type: physical impossibility
- Breakthroughs required:
  • Discover new physical principles
  • Work within constraints creatively
  • Find loopholes in current understanding
- Historical precedents:
  • Pre-1903: Human flight was deemed impossible
  • 1903: Wright Brothers achieve powered flight
  • Breakthrough: Understanding of aerodynamics + lightweight engines
- Mechanism: Would require new physics or energy source
- Confidence: 90%
```

## Technique Selection Guide

### Quick Decision Tree

```
What type of problem are you solving?
│
├── 🎯 Need fresh ideas or breakthrough thinking?
│   ├── Want random inspiration → Random Entry 🎲
│   ├── Need systematic innovation → SCAMPER 🔧
│   └── Challenge assumptions → PO (Provocative Operation) 💭
│
├── 🔍 Need comprehensive analysis?
│   ├── Multiple perspectives needed → Six Thinking Hats 🎩
│   ├── User-centered design → Design Thinking 🎨
│   └── System-wide view → Nine Windows 🔲
│
├── ⚡ Facing contradictions or paradoxes?
│   ├── Technical/engineering problem → TRIZ ⚡
│   └── Complex systemic tensions → Paradoxical Problem Solving ⚖️
│
├── 🌍 Need cultural or collaborative approaches?
│   ├── Cross-cultural integration → Cultural Integration 🌍
│   ├── Team collaboration → Yes, And ✅
│   └── Collective wisdom → Collective Intelligence 🧩
│
├── ⏰ Time-related challenges?
│   ├── Personal productivity → Temporal Work ⏰
│   └── Creative time exploration → Temporal Creativity ⏳
│
├── 🧠 Want to optimize thinking process?
│   ├── Your cognitive state → Neural State 🧠
│   ├── AI/computational methods → Neuro-Computational ⚛️
│   └── Learn from patterns → Meta-Learning 📈
│
└── 🔬 Need fundamental or advanced approaches?
    ├── Strip to basics → First Principles 🏗️
    ├── Extract key concepts → Concept Extraction 💡
    ├── Nature-inspired solutions → Biomimetic Path 🦋
    └── Quantum possibilities → Quantum Superposition 🌌
```

### Use Case Matrix

| Your Situation                              | Best Techniques                    | Why It Works                  |
| ------------------------------------------- | ---------------------------------- | ----------------------------- |
| **"I'm stuck and need inspiration"**        | Random Entry, PO                   | Breaks mental patterns        |
| **"Product needs innovation"**              | SCAMPER, Design Thinking           | Systematic transformation     |
| **"Team has conflicting views"**            | Six Hats, Cultural Integration     | Structured perspective-taking |
| **"Technical limitation seems impossible"** | TRIZ, First Principles             | Eliminates false constraints  |
| **"System has complex trade-offs"**         | Paradoxical Problem, Nine Windows  | Manages complexity            |
| **"Need to plan long-term"**                | Temporal Work, Temporal Creativity | Time-aware planning           |
| **"Want to think more creatively"**         | Neural State, Meta-Learning        | Optimizes cognitive process   |
| **"Learning from past failures"**           | Meta-Learning, Concept Extraction  | Pattern recognition           |
| **"Nature might have solved this"**         | Biomimetic Path                    | Biological inspiration        |
| **"Need radical innovation"**               | Quantum Superposition, PO          | Transcends normal thinking    |

### Quick Start Recommendations

1. **First-time users**: Start with **Six Hats** - comprehensive and easy to follow
2. **Quick win needed**: Try **Random Entry** - fast and often surprising
3. **Complex problem**: Begin with **Nine Windows** to understand full context
4. **Team setting**: Use **Yes, And** or **Collective Intelligence**
5. **Technical challenge**: Go straight to **TRIZ** or **First Principles**

## Thinking Techniques

### Six Thinking Hats Plus with Purple Hat

Multi-perspective analysis enhanced with meta-uncertainty awareness and path dependency tracking:

1. **Blue Hat** - Process control with meta-uncertainty awareness
2. **White Hat** - Facts and data including unknown unknowns
3. **Red Hat** - Emotions, intuition, and collective behavior
4. **Yellow Hat** - Optimism and positive possibilities
5. **Black Hat** - Critical judgment and risk assessment
6. **Green Hat** - Creative solutions and antifragile innovations
7. **Purple Hat** (NEW) - Path dependencies, constraints, and ergodicity awareness

### Provocative Operation (PO)

Four-step process for breaking mental patterns:

1. Create provocative statements
2. Explore without judgment, then systematically challenge
3. Extract and verify underlying principles
4. Develop robust solutions with failure mode analysis

### Random Entry

Three-step process for unexpected connections:

1. Introduce random stimuli
2. Generate connections while questioning assumptions
3. Validate insights before solution development

### SCAMPER+P

Eight transformations with integrated risk assessment:

- **Substitute** - Replace elements while identifying dependencies
- **Combine** - Merge concepts while managing conflicts
- **Adapt** - Adjust for new contexts and vulnerabilities
- **Modify** - Scale attributes up or down systematically
- **Put to other use** - Find new applications and contexts
- **Eliminate** - Remove elements while preserving core function
- **Reverse** - Invert or rearrange while testing assumptions
- **Parameterize** - Identify and vary key parameters systematically

### Concept Extraction

Four-step cross-domain pattern transfer:

1. **Identify** - Analyze successful solutions from any domain
2. **Extract** - Isolate key principles and their limitations
3. **Abstract** - Generalize patterns with clear boundaries
4. **Apply** - Transfer patterns with risk assessment

### Yes, And

Four-step collaborative ideation process:

1. **Accept** - Acknowledge initial ideas
2. **Build** - Add creative expansions
3. **Evaluate** - Assess risks and issues
4. **Integrate** - Synthesize into robust solutions

### Design Thinking

Five-stage human-centered process with risk integration:

1. **Empathize** - Understand users and potential misuse cases
2. **Define** - Frame problems with failure mode consideration
3. **Ideate** - Generate solutions with built-in critique
4. **Prototype** - Build tests including edge cases
5. **Test** - Gather feedback and harvest failure insights

### TRIZ

Four-step innovation through contradiction resolution:

1. **Identify** - Find core contradictions
2. **Remove** - Apply via negativa before adding
3. **Apply** - Use inventive principles bidirectionally
4. **Minimize** - Achieve more through systematic removal

### Neural State Management

Four-step cognitive optimization process:

1. **Assess** - Identify dominant neural network (Default Mode vs Executive Control)
2. **Suppress** - Strategically suppress overactive networks (depth 0-10)
3. **Rhythm** - Develop switching patterns between cognitive modes
4. **Integrate** - Synthesize insights from both network states

**Features**:

- Deep suppression detection (≥8) triggers noteworthy moment alerts
- Network balance optimization for enhanced creativity
- Cognitive flexibility tracking across states

### Temporal Work Design

Five-step time-based problem solving:

1. **Map** - Create temporal landscape with Kairos opportunity detection
2. **Align** - Match work with circadian rhythms and energy patterns
3. **Transform** - Convert time pressure into creative fuel
4. **Balance** - Optimize synchronous vs asynchronous work
5. **Escape** - Build temporal buffers and flexibility

**Temporal Landscape Elements**:

- Fixed deadlines and flexible windows
- Pressure points and dead zones
- Kairos opportunities (optimal timing moments)
- Temporal escape routes for flexibility preservation

### Cross-Cultural Integration

Four-step multi-perspective synthesis:

1. **Explore** - Examine problem through multiple cultural frameworks
2. **Bridge** - Build connections between diverse perspectives
3. **Synthesize** - Create respectful integration of approaches
4. **Adaptive** - Develop culture-specific implementation paths

**Cultural Awareness Features**:

- Multiple framework support (individualist, collectivist, hierarchical, etc.)
- Adaptive implementation patterns for different contexts
- Respectful synthesis approaches
- Future relevance tracking for global solutions

### Collective Intelligence Orchestration

Four-step wisdom aggregation:

1. **Source** - Identify diverse wisdom sources (experts, crowds, AI, data)
2. **Synthesize** - Aggregate collective insights and patterns
3. **Emerge** - Detect emergent patterns invisible to individuals
4. **Synergize** - Create combinations that amplify value

**Intelligence Sources**:

- Domain experts and practitioners
- Crowd wisdom and collective experience
- AI systems and data analytics

### Disney Method

Three-role sequential creative process:

1. **Dreamer** - Envision ideal solutions without constraints
2. **Realist** - Develop practical implementation plans
3. **Critic** - Identify risks, gaps, and improvement opportunities

**Integration Features**:

- Path dependency tracking between roles
- Flexibility preservation through iterative cycles
- Risk mitigation built into critic phase

### Nine Windows

Systematic 3×3 matrix analysis:

- **Time Dimension**: Past → Present → Future
- **System Levels**: Sub-system → System → Super-system

**Analysis Grid**:

1. Past sub-system: Component history and evolution
2. Past system: Historical context and patterns
3. Past super-system: Environmental influences
4. Present sub-system: Current components
5. Present system: Current state analysis
6. Present super-system: Current environment
7. Future sub-system: Component trends
8. Future system: Projected outcomes
9. Future super-system: Environmental evolution

**Path Dependency Features**:

- Tracks decisions across time dimensions
- Identifies system-level constraints
- Maps flexibility across scales
- Historical patterns and cultural knowledge

### Quantum Superposition

Six-step process for maintaining multiple solution states simultaneously:

1. **State Generation** - Create 3-5 mutually exclusive solution states
2. **Interference Mapping** - Identify constructive and destructive interference patterns
3. **Entanglement Analysis** - Map dependencies between solution states
4. **Amplitude Evolution** - Adjust probability amplitudes based on emerging constraints
5. **Measurement Context** - Define criteria that will force state collapse
6. **State Collapse** - Collapse to optimal solution while preserving insights from non-chosen
   states

**Key Benefits**:

- Avoids premature commitment to single solutions
- Maintains maximum flexibility until decision point
- Preserves insights from all explored possibilities
- Optimal for situations with high uncertainty

## Example Workflow

1. **Discover suitable techniques:**

```json
{
  "tool": "discover_techniques",
  "arguments": {
    "problem": "Improve team collaboration in remote work",
    "preferredOutcome": "collaborative"
  }
}
```

2. **Create a structured plan:**

```json
{
  "tool": "plan_thinking_session",
  "arguments": {
    "problem": "Improve team collaboration in remote work",
    "techniques": ["yes_and", "six_hats"],
    "timeframe": "thorough"
  }
}
```

3. **Execute thinking steps:**

```json
{
  "tool": "execute_thinking_step",
  "arguments": {
    "planId": "plan_7f8a9b2c-3d4e-5f6a",
    "technique": "six_hats",
    "problem": "Improve team collaboration in remote work",
    "currentStep": 1,
    "totalSteps": 6,
    "hatColor": "blue",
    "output": "Establishing systematic approach to analyze collaboration challenges",
    "nextStepNeeded": true
  }
}
```

### Disney Method Example

```json
{
  "tool": "execute_thinking_step",
  "arguments": {
    "planId": "plan_disney_example",
    "technique": "disney_method",
    "problem": "Design a new product feature",
    "currentStep": 1,
    "totalSteps": 3,
    "output": "Imagine a feature that reads users' minds and automatically completes their tasks before they even think of them",
    "nextStepNeeded": true,
    "risks": ["Technical feasibility", "Privacy concerns"],
    "antifragileProperties": ["Gets better with more user data"]
  }
}
```

### Nine Windows Example

```json
{
  "tool": "execute_thinking_step",
  "arguments": {
    "planId": "plan_nine_windows",
    "technique": "nine_windows",
    "problem": "Improve urban transportation",
    "currentStep": 5,
    "totalSteps": 9,
    "output": "Current system: Mix of cars, public transit, bikes. Key issues: congestion, emissions, accessibility",
    "nextStepNeeded": true
  }
}
```

This example used to send a `pathImpact` object alongside the step. Don't — `pathImpact` is derived
by the server from its own reading of the step, and the tool schema says plainly that the server
"REPLACES anything sent here, however fully populated". It appears **on the response**, not in the
request. Sending one was not merely ineffective: a `pathImpact` missing `dependenciesCreated`, which
the schema marks optional, used to end the session with `E999` the moment it completed — after every
step had already been recorded.

## Environment Variables

The server supports environment variables for advanced features:

- `NEURAL_OPTIMIZATION=true` - Enable neural state optimization features
- `CULTURAL_FRAMEWORKS=framework1,framework2` - Specify available cultural frameworks
- `DISABLE_THOUGHT_LOGGING=true` - Disable visual output logging
- `PERSISTENCE_TYPE=filesystem|postgres` - Choose storage backend (default: filesystem)
- `PERSISTENCE_PATH=/path/to/sessions` - Custom session storage location (filesystem only)
- `DATABASE_URL=postgres://...` - PostgreSQL connection string (postgres adapter only)
- `RESPONSE_VERBOSITY=minimal|full` - Default execute-response verbosity when a call omits
  `verbosity` (default: full; `minimal` is the declared future default)

### MCP Sampling Configuration

- `SAMPLING_TIMEOUT=30000` - Timeout for AI requests in milliseconds (default: 30s)
- `SAMPLING_MAX_RETRIES=3` - Maximum retry attempts for failed requests
- `SAMPLING_RETRY_DELAY=1000` - Initial retry delay in milliseconds
- `SAMPLING_RATE_LIMIT=10` - Maximum requests per minute (default: 10)

### Telemetry Configuration (Optional)

- `TELEMETRY_ENABLED=true` - Enable anonymous usage analytics (opt-in)
- `TELEMETRY_LEVEL=basic|detailed|full` - Control data collection granularity
- `TELEMETRY_STORAGE=memory|filesystem` - Analytics storage backend
- `TELEMETRY_PRIVACY_MODE=strict|balanced|minimal` - Privacy protection level

See [Telemetry in Contributing Guide](./CONTRIBUTING.md#telemetry-system) for details.

## Using the `socketes` CLI

`socketes` is a single-turn CLI that mirrors the three-tool contract. Each invocation runs one
operation and exits. State persists between invocations on the local filesystem under
`PERSISTENCE_PATH` (default `~/.creative-thinking`) — sessions can span days across many calls.

> **Full operating manual:** see [`SOCKETES.md`](./SOCKETES.md) for the meticulous reference —
> install paths, every flag, output shapes, parallel execution semantics, and a thorough gotchas
> section.

Typical end-to-end flow:

```bash
# 1. Discover candidate techniques for a problem
socketes discover --problem "How do we reduce churn in self-serve trials?"

# 2. Build a plan (returns planId, persisted to disk)
socketes plan --problem "How do we reduce churn in self-serve trials?" \
              --techniques six_hats --timeframe thorough

# 3. Execute steps. First call mints a sessionId; subsequent calls pass it back.
socketes execute --plan <planId> --technique six_hats \
                 --problem "How do we reduce churn in self-serve trials?" \
                 --step 1 --total-steps 7 \
                 --output "Process control: define what success looks like…" \
                 --next-step-needed

socketes execute --plan <planId> --session <sessionId> --technique six_hats \
                 --problem "..." --step 2 --total-steps 7 \
                 --output "..." --next-step-needed
```

Each command also accepts a JSON object on stdin; flags override stdin fields. Use stdin for
technique-specific long-tail params (`hatColor`, `scamperAction`, `risks`, etc.). See
`socketes <command> --help` for the full flag set.

### Parallel execution

`socketes plan` returns an `executionGraph` with `parallelizableGroups` and a `recommendedStrategy`
of `sequential | parallel | hybrid`. The skill or shell driver can fan out N concurrent
`socketes execute` invocations against parallelizable nodes. Concurrent invocations against
**different** sessionIds are safe; against the **same** sessionId is last-writer-wins — coordinate
from the client.

### Session management

```bash
socketes session list --status active --limit 20
socketes session save --session-id <sessionId> --name "Strategy Q3" --tags strategy,q3
socketes session export --session-id <sessionId> --format markdown
socketes session delete --session-id <sessionId> --confirm
```

`socketes execute` auto-saves the session after every step; explicit `session save` is for
labelling/tagging an existing session.

## Using as an MCP Server

The `creative-thinking` binary is the long-running stdio MCP server — same three tools, JSON-RPC
over stdin/stdout, designed for an MCP client to drive. Two ways to wire it up:

### Option 1: Run from GitHub via NPX

```json
{
  "mcpServers": {
    "creative-thinking": {
      "command": "npx",
      "args": ["-y", "github:uddhav/creative-thinking"]
    }
  }
}
```

### Option 2: Local development setup

```json
{
  "mcpServers": {
    "creative-thinking": {
      "command": "node",
      "args": ["/path/to/creative-thinking/dist/mcp-server-main.js"]
    }
  }
}
```

### Auto-Save Feature

Sessions can be automatically saved during execution by setting `autoSave: true` in the
execute_thinking_step input. This ensures progress is preserved even if the session is interrupted.
The `socketes` CLI defaults this to `true` on every `execute` call.

## Session Management

Save and resume your creative thinking sessions at any time.

### Session Operations

Add `sessionOperation` to your request to perform session management:

- **save**: Save the current session with optional name and tags
- **load**: Load a previously saved session
- **list**: List all saved sessions with filtering options
- **delete**: Delete a saved session
- **export**: Export a session in JSON, Markdown, or CSV format

### Quick Examples

Save current session:

```json
{
  "sessionOperation": "save",
  "saveOptions": {
    "sessionName": "Product Innovation Brainstorm",
    "tags": ["product", "innovation", "q1-2024"]
  }
}
```

List sessions:

```json
{
  "sessionOperation": "list",
  "listOptions": {
    "technique": "scamper",
    "status": "active"
  }
}
```

Load a session:

```json
{
  "sessionOperation": "load",
  "loadOptions": {
    "sessionId": "session_12345"
  }
}
```

Export a session:

```json
{
  "sessionOperation": "export",
  "exportOptions": {
    "sessionId": "session_12345",
    "format": "markdown" // Options: "markdown", "json", "csv"
  }
}
```

### Export Formats

- **Markdown** - Human-readable reports with formatting
- **JSON** - Structured data for analysis and integration
- **CSV** - Tabular format for spreadsheet applications

### Persistence Options

The server supports two persistence backends for session storage:

#### Filesystem Storage (Default)

Simple file-based storage ideal for single-server deployments and development:

```bash
export PERSISTENCE_TYPE=filesystem
export PERSISTENCE_PATH=~/.creative-thinking  # Optional, defaults to home directory
```

**Use when:**

- Running single server instance
- Simple deployment requirements
- Development and testing

#### PostgreSQL Storage (Production)

Recommended for production deployments requiring:

- Multi-server horizontal scaling with shared session state
- Crash recovery and session persistence
- Advanced querying and search capabilities

```bash
export PERSISTENCE_TYPE=postgres
export DATABASE_URL=postgres://user:pass@localhost/creative_thinking
```

**Setup:**

1. Install PostgreSQL dependency: `npm install pg`
2. Create database: `createdb creative_thinking`
3. Tables auto-created on first connection
4. Supports connection pooling and automatic cleanup

**Features:**

- JSONB storage for flexible schema
- Full-text search with GIN indexes
- Automatic session TTL (24-hour expiry)
- Transaction support for batch operations
- Efficient metadata querying

For detailed examples, see the [examples directory](examples/).

## Test Coverage

The project includes comprehensive test suites ensuring reliability and correctness:

### Unit Tests

- **Core functionality**: All thinking techniques, session management, persistence
- **Ergodicity system**: Path memory, flexibility tracking, barrier detection
- **Option generation**: All 12 generation strategies with evaluation
- **Export formats**: JSON, Markdown, and CSV exporters
- **Orchestrators**: ErgodicityOrchestrator, RiskAssessmentOrchestrator
- **Builders**: ErrorContextBuilder, ExecutionResponseBuilder
- **Validators**: ExecutionValidator with technique-specific strategies

### Integration Tests

- **Workflow tests**: End-to-end execution of all techniques ✅
- **MCP protocol**: Compliance with Model Context Protocol ✅
- **Three-layer architecture**: Discovery → Planning → Execution flow ✅
- **Performance tests**: Concurrent operations, large sessions, memory usage ✅
- **Persistence**: Save/load, auto-save, search, and export functionality ✅

**Note**: Comprehensive integration test suites have been implemented in the
`src/__tests__/integration/` directory, providing complete coverage of MCP protocol compliance,
three-layer architecture, persistence, and performance testing.

### Test Statistics

- **Total Tests**: 750+ tests across 60+ test files
- **Coverage**: >80% coverage target across all modules
- **Performance**: All tests complete in under 10 seconds
- **MCP Compliance**: Automated protocol compliance testing

Run tests with:

```bash
npm test                    # Run tests in watch mode
npm run test:run            # Run tests once
npm run test:coverage       # Generate coverage report
```

## Version 0.3.1 Features

### New Techniques

- **Disney Method**: Three-role creative process with integrated path dependency tracking
- **Nine Windows**: Systematic 3×3 analysis across time and system levels with ergodicity awareness

### Enhanced User Experience

- **Workflow Guidance**: Discovery responses now include explicit next-step guidance
- **Technique Progress**: Clear visibility of both local technique progress and global workflow
  progress
- **User-Provided Session IDs**: Support for custom session identifiers
- **Ruin Risk Analysis**: Enhanced Purple Hat with comprehensive ruin risk detection

## Version 0.3.0 Features

### Complete Specification Alignment

- **SCAMPER+P**: Added 8th transformation step "Parameterize" for systematic parameter variation
- **Memory-Aware Outputs**: All three layers now provide contextual memory outputs
- **Environment Variables**: Support for NEURAL_OPTIMIZATION and CULTURAL_FRAMEWORKS flags
- **Enhanced Integration Tests**: 13 comprehensive end-to-end workflow tests

## Integration Examples

### Disney Method + Path Dependency Tracking

When using Disney Method, the system tracks how decisions in each role affect flexibility:

- **Dreamer decisions** may open new paths but require validation
- **Realist constraints** reduce options but increase feasibility
- **Critic insights** may require cycling back to earlier roles

### Nine Windows + Ergodicity Analysis

Nine Windows automatically integrates with ergodicity detection:

- **Past analysis** reveals if the domain has historical ruin events
- **System levels** show where non-ergodic risks emerge
- **Future projections** consider both ensemble and time averages

### Multi-Technique Workflows

Combine techniques for comprehensive analysis:

```json
{
  "techniques": ["nine_windows", "disney_method"],
  "reasoning": "Use Nine Windows to understand system context, then Disney Method to design solutions"
}
```

## Recent Enhancements

### PDA-SCAMPER (Path Dependency Analysis)

SCAMPER technique now includes path dependency tracking:

- **Commitment levels**: Low (🔄), Medium (⚠️), High (🔒), Irreversible (🔒)
- **Flexibility tracking**: Monitors how each action reduces future options
- **Alternative suggestions**: Recommends lower-commitment actions when flexibility is critical
- **Recovery paths**: Shows how to undo or mitigate each transformation

### Collective Intelligence Orchestration

New technique for synthesizing insights from multiple sources:

- **Wisdom aggregation**: Combines expert knowledge, crowd insights, and data
- **Emergence detection**: Identifies patterns not visible to individual sources
- **Synergy optimization**: Finds combinations that amplify collective value
- **Integration synthesis**: Creates unified solutions from diverse perspectives

### Enhanced Memory and Suggestions

All techniques now include memory-suggestive output patterns:

- **Contextual insights**: Related observations from session history
- **Historical notes**: Relevant past decisions and their outcomes
- **Pattern recognition**: Recurring themes and approaches
- **Cross-technique learning**: Insights that transfer between methods

## Implementation Architecture

### Core Design Principles

- **Three-tool constraint**: All features integrated into discover/plan/execute workflow
- **MCP protocol compliance**: Strict stdout/stderr separation for JSON-RPC
- **Visual feedback**: Progress indicators, warning levels, and mode markers
- **Path dependency tracking**: Every decision's impact on future flexibility
- **Graceful degradation**: Optional features (persistence) don't break core functionality

### Key Implementation Components

#### 1. Error Context Builder

Provides consistent, actionable error messages with:

- Step-by-step guidance for workflow errors
- Examples of correct usage
- Emoji-enhanced clarity (❌, ⚠️, 👉)
- Session validation feedback

#### 2. Option Generation Engine

12 strategies that activate automatically when flexibility drops below 0.4:

- **Core**: Decomposition, Temporal, Abstraction, Inversion, Stakeholder, Resource, Capability,
  Recombination
- **Enhanced**: Neural Optimization, Temporal Flexibility, Cultural Bridging, Collective Divergence

#### 3. Early Warning System

Multi-sensor architecture monitoring:

- **ResourceMonitor**: Energy, time, material constraints
- **CognitiveAssessor**: Rigidity, perspective diversity
- **TechnicalDebtAnalyzer**: Complexity, coupling metrics

#### 4. Escape Protocols

5 levels of intervention:

1. Pattern Interruption (flexibility 0.5-0.7)
2. Resource Reallocation (flexibility 0.4-0.5)
3. Stakeholder Reset (flexibility 0.3-0.4)
4. Technical Refactoring (flexibility 0.2-0.3)
5. Strategic Pivot (flexibility < 0.2)

## Documentation

### Error Recovery and Resilience

The Creative Thinking Server implements comprehensive error recovery patterns to ensure robust
operation:

- **[Error Handling Guide](./CONTRIBUTING.md#error-handling)** - Comprehensive error handling
  documentation including patterns, implementation guide, and quick reference

Key error recovery features:

- Automatic session recovery with custom IDs
- Graceful degradation when persistence unavailable
- Clear workflow guidance for user errors
- State preservation through error conditions
- Memory management with automatic eviction

## Building

Docker:

```bash
docker build -t creative-thinking .
```

NPM:

```bash
npm install
npm run build
```

Development:

```bash
npm run dev     # TypeScript watch mode
npm run lint    # ESLint checks
npm run test    # Run tests
```

## Development Guidelines

### Dist File Management

This project includes compiled `dist/` files in the repository to support GitHub distribution via
`npx`. When making changes:

1. **Always rebuild after modifying src files**: Run `npm run build` before committing
2. **Commit dist changes with src changes**: Keep src and dist in sync
3. **Pre-push hook**: A git hook will prevent pushing with uncommitted dist changes
4. **Version script**: The `npm version` command automatically rebuilds and stages dist files

The pre-push hook will:

- ❌ Block pushes with uncommitted dist changes
- ⚠️ Warn if src was modified more recently than dist
- ✅ Pass when everything is in sync

## Best Practices

### Getting Started

1. Use `discover_techniques` to find the best approach for your problem
2. Create comprehensive workflows with `plan_thinking_session`
3. Follow the structured guidance through `execute_thinking_step`
4. Combine multiple techniques for complex challenges

### Technique-Specific Tips

- **Six Hats** - Begin with the Blue Hat to establish process and objectives
- **PO** - Work with the plan's assigned provocation (`stimulus` on the technique's first workflow
  step); diverging from it draws a `stimulus.mismatch` advisory finding
- **Random Entry** - The plan assigns the random stimulus at plan time — externally-sourced entropy
  is the point; use the assigned value rather than choosing your own
- **SCAMPER** - Complete all seven transformations for comprehensive exploration
- **Design Thinking** - Engage real users throughout the process
- **TRIZ** - Focus on identifying and resolving core contradictions

## Roadmap

The project roadmap is tracked through GitHub issues with priority and timeline labels. View the
[2025 Roadmap & Prioritization](https://github.com/uddhav/creative-thinking/issues/162) for detailed
plans.

### Recent Releases

- **v0.4.0** - MCP Sampling Integration ✅
- **v0.5.0** - Telemetry & Analytics ✅
- **v0.6.0** - Part VII Techniques (4 of 8 complete) ✅

### Coming Soon

- **v0.7.0** - Biomimetic Path Management (#158) - Q3 2025
- **v0.8.0** - Cultural Path Navigation (#159) - Q3 2025
- **v0.9.0** - Neuro-Computational Synthesis (#160) - Q4 2025
- **v1.0.0** - Cultural Creativity Orchestration (#161) - Q4 2025

### Filter Issues By:

- [Critical Priority](https://github.com/uddhav/creative-thinking/issues?q=is%3Aopen+label%3Apriority%3A1-critical)
- [Q1 2025](https://github.com/uddhav/creative-thinking/issues?q=is%3Aopen+label%3Aroadmap%3AQ1-2025)
- [Part VII Techniques](https://github.com/uddhav/creative-thinking/issues?q=is%3Aopen+label%3Apart-vii)

## License

This MCP server is licensed under the GPL-3.0 License. This means you are free to use, modify, and
distribute the software, subject to the terms and conditions of the GPL-3.0 License. For more
details, please see the LICENSE file in the project repository.

```

```
