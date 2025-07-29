# Creative Thinking MCP Server

A Model Context Protocol (MCP) server that provides structured creative thinking techniques for problem-solving and ideation. This server implements a unified framework combining generative creativity with systematic risk assessment.

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

This constraint ensures a clean, focused API that mirrors the natural creative thinking workflow and prevents tool proliferation.

## Overview

The three-layer architecture guides you through comprehensive problem-solving:

1. **Discovery Layer** (`discover_techniques`) - Analyzes problems and recommends suitable thinking techniques based on characteristics, context, and desired outcomes.

2. **Planning Layer** (`plan_thinking_session`) - Creates structured workflows that combine techniques, providing step-by-step guidance adapted to your timeframe.

3. **Execution Layer** (`execute_thinking_step`) - Guides you through each thinking step while maintaining session state and integrating risk assessment.

This layered approach ensures efficient problem-solving by matching techniques to problems, creating comprehensive workflows, and maintaining focus throughout the creative process.

## Installation

### Using npx

```bash
# Run directly from GitHub
npx -y github:uddhav/creative-thinking

# Or if published to npm
npx -y creative-thinking
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/uddhav/creative-thinking.git
cd creative-thinking

# Install dependencies
npm install

# Build the project
npm run build

# Run locally
node dist/index.js
```

## Core Features

### Twelve Enhanced Thinking Techniques

Each technique integrates creative generation with systematic verification:

- **Six Thinking Hats Plus** - Multi-perspective analysis with meta-uncertainty awareness
- **Provocative Operation (PO)** - Pattern-breaking through systematic verification
- **Random Entry** - Creative connections validated through systematic doubt
- **SCAMPER** - Systematic transformations with integrated pre-mortem analysis
- **Concept Extraction** - Cross-domain pattern transfer with boundary awareness
- **Yes, And** - Collaborative ideation with built-in critical evaluation
- **Design Thinking** - Human-centered innovation with embedded risk management
- **TRIZ** - Contradiction resolution through addition and systematic removal
- **Neural State** - Cognitive mode optimization for creative breakthroughs
- **Temporal Work Design** - Time-based problem solving and pressure transformation
- **Cross-Cultural Integration** - Multi-perspective synthesis across cultural frameworks
- **Collective Intelligence** - Wisdom aggregation from diverse knowledge sources

### Unified Framework Features

- Dual thinking modes with visual indicators for creative and critical phases
- Comprehensive risk and failure mode tracking across all techniques
- Antifragile solution design that benefits from stress and change
- Consideration of low-probability, high-impact events
- Meta-learning metrics to track session effectiveness

### Session Management

- Full session persistence with save, load, list, delete, and export capabilities
- Automatic progress saving and session tagging for organization
- Multiple export formats (JSON, Markdown, CSV) for different use cases
- Support for revisions and branching during creative exploration
- Progress tracking with visual indicators and formatted output
- Insights extraction and summary generation upon completion

### Ergodicity Awareness (NEW)

The server now tracks path dependencies and non-ergodic effects in creative thinking:

- **Path Memory System** - Tracks how each decision creates irreversible constraints
- **Flexibility Metrics** - Real-time monitoring of remaining creative options
- **Absorbing Barrier Detection** - Warns about approaching irreversible states like:
  - Cognitive lock-in (stuck in one way of thinking)
  - Analysis paralysis (overthinking preventing action)
  - Perfectionism trap (standards preventing completion)
- **Escape Routes** - Suggests ways to regain flexibility when options are limited
- **Visual Indicators** - Shows path metrics in every thinking step output

The system recognizes that creative processes are non-ergodic: each decision permanently changes the landscape of future possibilities. This helps you maintain awareness of path dependencies and avoid getting trapped in absorbing states.

### 🚨 Absorbing Barrier Early Warning System

The integrated early warning system continuously monitors for approaching "points of no return" in your creative process:

- **Multi-Sensor Monitoring**: Tracks cognitive rigidity, resource depletion, and technical debt accumulation
- **Four Warning Levels**: 🟢 SAFE > 🟡 CAUTION > 🟠 WARNING > 🔴 CRITICAL
- **Escape Protocols**: Provides actionable strategies to regain flexibility before hitting barriers
- **Visual Alerts**: Critical warnings appear prominently in the output to ensure timely action

When barriers are detected, the system recommends specific escape protocols ranging from simple pattern interruption to strategic pivots, each calibrated to your current flexibility level.

### 🌱 Option Generation Engine

When flexibility drops below 0.4, the system automatically activates the Option Generation Engine to create new possibilities through eight strategic approaches:

- **Decomposition** - Break monolithic commitments into flexible modules
- **Temporal** - Adjust time parameters (delay commitments, accelerate options)
- **Abstraction** - Move up abstraction levels to find new solution spaces
- **Inversion** - Flip constraints into features and reverse assumptions
- **Stakeholder** - Introduce new perspectives and collaborative opportunities
- **Resource** - Reallocate or discover untapped resources
- **Capability** - Leverage hidden skills or develop new competencies
- **Recombination** - Mix existing elements in novel ways

The engine evaluates each generated option for flexibility gain, implementation cost, reversibility, and synergy with existing choices, ensuring practical and effective recommendations.

## Tools

### 🔍 discover_techniques

Analyzes your problem and recommends the most suitable creative thinking techniques.

**Inputs:**
- `problem` (string, required): The problem or challenge you want to solve
- `context` (string, optional): Additional context about the situation
- `preferredOutcome` (string, optional): The type of solution you prefer
  - Options: 'innovative', 'systematic', 'risk-aware', 'collaborative', 'analytical'
- `constraints` (array, optional): Any constraints or limitations to consider

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
  - Options: 'six_hats', 'po', 'random_entry', 'scamper', 'concept_extraction', 'yes_and', 'design_thinking', 'triz', 'neural_state', 'temporal_work', 'cross_cultural', 'collective_intel'
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
- `problem` (string, required): The problem or challenge to address
- `currentStep` (integer, required): Current step number in the technique
- `totalSteps` (integer, required): Total steps for this technique
- `output` (string, required): Your creative output for this step
- `nextStepNeeded` (boolean, required): Whether another step is needed

**Technique-specific inputs:**
- `hatColor` (string, optional): Current hat color for six_hats technique
- `provocation` (string, optional): The provocative statement for po technique
- `principles` (array, optional): Extracted principles for po technique
- `randomStimulus` (string, optional): The random word/concept for random_entry
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

### SCAMPER
Seven transformations with integrated risk assessment:
- **Substitute** - Replace elements while identifying dependencies
- **Combine** - Merge concepts while managing conflicts
- **Adapt** - Adjust for new contexts and vulnerabilities
- **Modify** - Scale attributes up or down systematically
- **Put to other use** - Find new applications and contexts
- **Eliminate** - Remove elements while preserving core function
- **Reverse** - Invert or rearrange while testing assumptions

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
2. **Suppress** - Strategically suppress overactive networks
3. **Rhythm** - Develop switching patterns between cognitive modes
4. **Integrate** - Synthesize insights from both network states

### Temporal Work Design
Five-step time-based problem solving:
1. **Map** - Create temporal landscape (pressure points, dead zones, opportunities)
2. **Align** - Match work with circadian rhythms and energy patterns
3. **Transform** - Convert time pressure into creative fuel
4. **Balance** - Optimize synchronous vs asynchronous work
5. **Escape** - Build temporal buffers and flexibility

### Cross-Cultural Integration
Four-step multi-perspective synthesis:
1. **Explore** - Examine problem through multiple cultural lenses
2. **Parallel** - Develop culture-specific implementation paths
3. **Bridge** - Build conceptual connections between approaches
4. **Synthesize** - Create respectful integration of diverse solutions

### Collective Intelligence Orchestration
Five-step wisdom aggregation:
1. **Assess** - Evaluate collective knowledge landscape
2. **Orchestrate** - Coordinate diverse wisdom sources
3. **Facilitate** - Enable emergence of collective insights
4. **Harvest** - Extract synthesized intelligence
5. **Evolve** - Continuously improve collective understanding

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

## Configuration

### For Desktop Applications

Add to your MCP configuration file:

```json
{
  "mcpServers": {
    "creative-thinking": {
      "command": "npx",
      "args": [
        "-y",
        "github:uddhav/creative-thinking"
      ]
    }
  }
}
```

### For Code Editors

Add to your editor's MCP settings:

```json
{
  "mcp": {
    "servers": {
      "creative-thinking": {
        "command": "npx",
        "args": [
          "-y",
          "github:uddhav/creative-thinking"
        ]
      }
    }
  }
}
```

To disable visual output logging, set the environment variable: `DISABLE_THOUGHT_LOGGING=true`

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
    "format": "markdown"  // Options: "markdown", "json", "csv"
  }
}
```

### Export Formats

- **Markdown** - Human-readable reports with formatting
- **JSON** - Structured data for analysis and integration
- **CSV** - Tabular format for spreadsheet applications

### Persistence Options

- `PERSISTENCE_TYPE` - Choose between filesystem or memory storage
- `PERSISTENCE_PATH` - Customize session storage location
- `autoSave` - Enable automatic progress saving

For detailed examples, see the [examples directory](examples/).

## Test Coverage

The project includes comprehensive test suites ensuring reliability and correctness:

### Unit Tests
- **Core functionality**: All thinking techniques, session management, persistence
- **Ergodicity system**: Path memory, flexibility tracking, barrier detection
- **Option generation**: All 8 generation strategies with evaluation
- **Export formats**: JSON, Markdown, and CSV exporters

### Integration Tests
- **Workflow tests**: End-to-end execution of all techniques ✅
- **MCP protocol**: Compliance with Model Context Protocol ✅
- **Three-layer architecture**: Discovery → Planning → Execution flow ✅
- **Performance tests**: Concurrent operations, large sessions, memory usage ✅
- **Persistence**: Save/load, auto-save, search, and export functionality ✅

**Note**: Comprehensive integration test suites have been implemented in the `src/__tests__/integration/` 
directory, providing complete coverage of MCP protocol compliance, three-layer architecture, 
persistence, and performance testing.

Run tests with:
```bash
npm test                    # Run tests in watch mode
npm run test:run            # Run tests once
npm run test:coverage       # Generate coverage report
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

## Best Practices

### Getting Started
1. Use `discover_techniques` to find the best approach for your problem
2. Create comprehensive workflows with `plan_thinking_session`
3. Follow the structured guidance through `execute_thinking_step`
4. Combine multiple techniques for complex challenges

### Technique-Specific Tips
- **Six Hats** - Begin with the Blue Hat to establish process and objectives
- **PO** - The more provocative the statement, the better the creative breakthrough
- **Random Entry** - Use genuinely random stimuli for unexpected connections
- **SCAMPER** - Complete all seven transformations for comprehensive exploration
- **Design Thinking** - Engage real users throughout the process
- **TRIZ** - Focus on identifying and resolving core contradictions

## License

This MCP server is licensed under the GPL-3.0 License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the GPL-3.0 License. For more details, please see the LICENSE file in the project repository.
