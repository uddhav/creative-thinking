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

- **Six Thinking Hats**: Systematic exploration of problems from six distinct perspectives
- **PO (Provocative Operation)**: Break thinking patterns through deliberate provocation
- **Random Entry**: Generate creative connections through random stimuli
- **SCAMPER**: Systematic ideation through seven transformation actions
- Visual progress tracking with emojis and formatted output
- Support for revisions and branching in creative exploration
- Session management with unique IDs and history tracking
- Insights extraction and summary when sessions complete
- Colored console output with chalk (can be disabled with DISABLE_THOUGHT_LOGGING environment variable)

## Tool

### lateralthinking

Guides users through proven lateral thinking techniques for creative problem-solving.

**Inputs:**
- `technique` (string): The lateral thinking technique to use ("six_hats", "po", "random_entry", "scamper")
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

**Advanced features:**
- `isRevision` (boolean, optional): Whether this revises a previous step
- `revisesStep` (integer, optional): Which step is being revised
- `branchFromStep` (integer, optional): Step number to branch from
- `branchId` (string, optional): Identifier for the branch

## Techniques

### Six Thinking Hats
Edward de Bono's method for parallel thinking:
1. **Blue Hat** 🔵: Process control and overview
2. **White Hat** ⚪: Facts and information only
3. **Red Hat** 🔴: Emotions, feelings, and intuition
4. **Yellow Hat** 🟡: Optimism, benefits, and positive thinking
5. **Black Hat** ⚫: Critical judgment, caution, and risk assessment
6. **Green Hat** 🟢: Creativity, alternatives, and new ideas

### PO (Provocative Operation)
Four-step process for escaping mental patterns:
1. Create a provocative statement (Po: ...)
2. Suspend judgment about the provocation
3. Extract useful principles from the provocation
4. Develop practical ideas from the principles

### Random Entry
Three-step creative connection process:
1. Introduce a random stimulus (word, image, concept)
2. Generate connections between stimulus and problem
3. Develop solutions from the connections

### SCAMPER
Seven systematic transformations:
- **S**ubstitute: Replace parts with alternatives
- **C**ombine: Merge with other ideas or functions
- **A**dapt: Adjust for different contexts
- **M**odify: Magnify, minimize, or modify attributes
- **P**ut to other use: Find new applications
- **E**liminate: Remove unnecessary elements
- **R**everse: Invert or rearrange components

### Concept Extraction
Four-step process for transferring successful principles across domains:
1. **Identify Success**: Analyze a successful solution from any domain
2. **Extract Concepts**: Identify the key principles that make it work
3. **Abstract Patterns**: Generalize concepts into transferable patterns
4. **Apply to Problem**: Transfer abstracted patterns to your specific challenge

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
