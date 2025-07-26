# Creative Thinking MCP Server

An MCP server implementation that provides structured lateral and creative thinking techniques for problem-solving and ideation.

## Installation

### Quick Install with npx

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

## Features

### Creative Thinking Techniques (Enhanced with Unified Framework)

All techniques integrate creative generation with critical evaluation for robust, antifragile solutions:

- **Six Thinking Hats Plus**: Enhanced with Black Swan awareness - each hat considers unknown unknowns and extreme events
- **PO (Provocative Operation)**: With systematic verification - provocations are tested through hypothesis validation
- **Random Entry**: With systematic doubt - connections validated through Cartesian questioning
- **SCAMPER**: With pre-mortem analysis - each transformation includes "What could go wrong?" assessment
- **Concept Extraction**: With failure mode analysis - identifies where patterns won't work
- **Yes, And...**: With critical evaluation - includes "But" step for risk assessment
- **Design Thinking**: With embedded risk management - 5 stages integrating threat modeling and failure harvesting
- **TRIZ**: Enhanced with Via Negativa - systematic innovation through both addition and removal

### Key Features of the Unified Framework

- **Dual Thinking Modes**: Visual indicators (✨ creative, ⚠️ critical) show whether you're in generative or adversarial mode
- **Risk & Failure Mode Tracking**: All techniques support identifying risks, failure modes, and mitigations
- **Antifragile Properties**: Solutions designed to benefit from stress and volatility
- **Black Swan Consideration**: Techniques account for low-probability, high-impact events
- **Meta-Learning Metrics**: Track creativity scores, risks caught, and antifragile features across sessions

### Session Management Features

- **Session Persistence**: Save, load, list, delete, and export thinking sessions
- **Auto-save**: Automatically persist progress after each step
- **Tagging & Organization**: Categorize sessions with names and tags
- **Multiple Export Formats**: Export sessions as JSON, Markdown, or CSV
- Visual progress tracking with emojis and formatted output
- Support for revisions and branching in creative exploration
- Session management with unique IDs and history tracking
- Insights extraction and summary when sessions complete
- Colored console output with chalk (can be disabled with DISABLE_THOUGHT_LOGGING environment variable)

## Tool

### lateralthinking

Guides users through proven lateral thinking techniques for creative problem-solving.

**Inputs:**
- `technique` (string): The lateral thinking technique to use ("six_hats", "po", "random_entry", "scamper", "concept_extraction", "yes_and", "design_thinking", "triz")
- `problem` (string): The problem or challenge to address
- `currentStep` (integer): Current step number in the technique
- `totalSteps` (integer): Total steps for this technique
- `output` (string): Your creative output for this step
- `nextStepNeeded` (boolean): Whether another step is needed

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

## Techniques

### Six Thinking Hats Plus (Enhanced with Black Swan Awareness)
Edward de Bono's method enhanced with meta-uncertainty and extreme event consideration:
1. **Blue Hat Plus** 🔵: Process control with meta-uncertainty awareness - "What if our process assumptions are wrong?"
2. **White Hat Plus** ⚪: Facts and information including unknown unknowns - "What data might be hiding black swans?"
3. **Red Hat Plus** 🔴: Emotions, intuition, and collective behavior prediction - "What collective madness might emerge?"
4. **Yellow Hat Plus** 🟡: Optimism, benefits, and positive black swans - "What explosive upsides might we miss?"
5. **Black Hat Plus** ⚫: Critical judgment and catastrophic discontinuities - "What could destroy everything?"
6. **Green Hat Plus** 🟢: Creativity and antifragile innovations - "What solutions get stronger under stress?"

### PO (Provocative Operation with Systematic Verification)
Four-step process for escaping mental patterns with hypothesis testing:
1. Create a provocative statement (Po: ...)
2. Suspend judgment and explore the provocation (then challenge it)
3. Extract and verify principles through hypothesis testing
4. Develop robust solutions addressing failure modes

### Random Entry (With Systematic Doubt)
Three-step creative connection process with validation:
1. Introduce a random stimulus (word, image, concept)
2. Generate connections with systematic doubt ("Is this always true?")
3. Validate insights before developing solutions

### SCAMPER (With Pre-Mortem Analysis)
Seven systematic transformations, each with risk assessment:
- **S**ubstitute: Replace parts with alternatives | "What dependencies break?"
- **C**ombine: Merge with other ideas or functions | "What conflicts arise?"
- **A**dapt: Adjust for different contexts | "What new vulnerabilities emerge?"
- **M**odify: Magnify, minimize, or modify attributes | "What breaks under enhancement?"
- **P**ut to other use: Find new applications | "What context-specific dangers?"
- **E**liminate: Remove unnecessary elements | "What's actually load-bearing?"
- **R**everse: Invert or rearrange components | "Which assumptions must hold?"

### Concept Extraction (With Failure Mode Analysis)
Four-step process for transferring successful principles across domains:
1. **Identify Success**: Analyze a successful solution from any domain
2. **Extract & Analyze Limitations**: Identify key principles AND where they wouldn't work
3. **Abstract with Boundaries**: Generalize patterns with clear domain boundaries
4. **Apply with Risk Assessment**: Transfer patterns only where success probability is high

### Yes, And... (With Critical Evaluation)
Four-step collaborative ideation process from improv theater:
1. **Accept (Yes)**: Acknowledge and accept the initial idea or contribution
2. **Build (And)**: Add creative expansions and possibilities
3. **Evaluate (But)**: Critically assess potential issues and risks
4. **Integrate**: Synthesize insights into a robust solution

### Design Thinking (With Embedded Risk Management)
Five-stage human-centered design process with integrated threat modeling:
1. **Empathize + Threat Modeling**: Understand user needs AND potential misuse cases
2. **Define + Problem Inversion**: Frame the problem AND ask "How might we fail?"
3. **Ideate + Devil's Advocate**: Generate solutions with internal critic for each idea
4. **Prototype + Stress Testing**: Build quick tests including edge cases and failure modes
5. **Test + Failure Harvesting**: Gather user feedback AND analyze what breaks

### TRIZ (Enhanced with Via Negativa)
Four-step systematic innovation through contradiction resolution:
1. **Identify Contradiction**: Find the core conflict (Need X but get Y)
2. **Via Negativa - What to Remove?**: Ask what can be eliminated before adding
3. **Apply Inventive Principles**: Use TRIZ principles both additively and subtractively
4. **Minimal Solution**: Achieve more by doing less - optimize through removal

## Usage Examples

### Six Thinking Hats Example
```json
{
  "technique": "six_hats",
  "problem": "How to improve team collaboration in remote work",
  "currentStep": 1,
  "totalSteps": 6,
  "hatColor": "blue",
  "output": "We need a systematic approach to analyze our remote collaboration challenges. Let's examine this from all perspectives to find comprehensive solutions.",
  "nextStepNeeded": true
}
```

### SCAMPER Example
```json
{
  "technique": "scamper",
  "problem": "Redesign the coffee mug for better user experience",
  "currentStep": 3,
  "totalSteps": 7,
  "scamperAction": "adapt",
  "output": "Adapt the mug handle design from ergonomic tools - add a thumb rest and finger grooves like those found on professional photography equipment for better grip and reduced fatigue.",
  "nextStepNeeded": true
}
```

### Concept Extraction Example
```json
{
  "technique": "concept_extraction",
  "problem": "How to improve employee onboarding process",
  "currentStep": 3,
  "totalSteps": 4,
  "abstractedPatterns": [
    "Orchestrated parallel workflows",
    "Role clarity through visual systems",
    "Time-boxed task completion",
    "Cross-functional visibility"
  ],
  "output": "Abstract patterns: Create systems where multiple activities happen simultaneously with clear visual indicators, time boundaries, and everyone understanding the full picture.",
  "nextStepNeeded": true
}
```

## Configuration

### Usage with Claude Desktop

Add this to your `claude_desktop_config.json`:

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

### Usage with VS Code

Add the following to your VS Code settings:

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

The Creative Thinking tool now supports full session persistence, allowing you to save your creative thinking progress and return to it later.

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

The tool supports three export formats:

- **Markdown**: Human-readable reports with rich formatting
- **JSON**: Complete structured data for analysis and integration
- **CSV**: Tabular data for spreadsheets and data visualization

See [examples/export-formats.md](examples/export-formats.md) for detailed export examples and use cases.

### Auto-Save

Enable automatic saving after each step by adding `"autoSave": true` to your thinking step requests.

### Configuration

- `PERSISTENCE_TYPE`: Storage backend (`filesystem` or `memory`)
- `PERSISTENCE_PATH`: Custom storage path (default: `~/.creative-thinking/sessions`)

For detailed session management examples, see [examples/session-management.md](examples/session-management.md).

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

## Usage Tips

1. **Start with Blue Hat**: For Six Hats technique, always begin with the Blue Hat to establish process and goals
2. **Embrace Absurdity**: For PO technique, the more provocative the statement, the better the creative leaps
3. **True Randomness**: For Random Entry, use genuinely random words - avoid choosing "relevant" stimuli
4. **Complete SCAMPER**: Work through all seven actions even if some seem less applicable
5. **Session Continuity**: The server maintains session state, allowing for natural creative flow
6. **Revision Support**: Use the revision feature to refine earlier creative outputs as insights develop

## License

This MCP server is licensed under the GPL-3.0 License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the GPL-3.0 License. For more details, please see the LICENSE file in the project repository.
