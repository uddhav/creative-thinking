# Visual Indicators for Creative Thinking Techniques

This document describes the visual indicators feature that provides real-time technique state
information on stderr output.

## Overview

Visual indicators enhance the visual output by showing:

1. **Technique State** - Current state/mode of the technique (e.g., which hat, which SCAMPER action)
2. **Risk Level** - Visual risk assessment based on identified risks
3. **Flexibility Score** - Path flexibility warnings when options are becoming limited

## Enabling Visual Indicators

Visual indicators are **disabled by default** to maintain clean output. Enable them by setting the
environment variable:

```bash
export SHOW_TECHNIQUE_INDICATORS=true
```

## Technique-Specific Indicators

### Six Thinking Hats

Shows the current hat color and name:

- `[🔵 Blue Hat]` - Process control
- `[⚪ White Hat]` - Facts and data
- `[🔴 Red Hat]` - Emotions and feelings
- `[🟡 Yellow Hat]` - Optimism and benefits
- `[⚫ Black Hat]` - Critical thinking
- `[🟢 Green Hat]` - Creative ideas
- `[🟣 Purple Hat]` - Integration

### SCAMPER

Shows the current transformation action:

- `[🔄 SUBSTITUTE]` - Replace elements
- `[🔗 COMBINE]` - Merge elements
- `[🔧 ADAPT]` - Adjust for context
- `[✏️ MODIFY]` - Change attributes
- `[🎯 PUT_TO_OTHER_USE]` - New applications
- `[❌ ELIMINATE]` - Remove elements
- `[↩️ REVERSE]` - Invert elements
- `[📊 PARAMETERIZE]` - Make configurable

### Design Thinking

Shows the current stage:

- `[💚 Empathize]` - Understand users
- `[🎯 Define]` - Frame the problem
- `[💡 Ideate]` - Generate solutions
- `[🔨 Prototype]` - Build solutions
- `[🧪 Test]` - Validate solutions

### Disney Method

Shows the current role:

- `[🌟 Dreamer]` - Visionary thinking
- `[🔨 Realist]` - Practical planning
- `[🔍 Critic]` - Risk assessment

### Neural State Optimization

Shows the dominant neural network:

- `[🧘 DMN]` - Default Mode Network (creative)
- `[⚡ ECN]` - Executive Control Network (focused)

### Nine Windows

Shows the current position in the 3x3 matrix:

- Time: `⏮️` (past), `▶️` (present), `⏭️` (future)
- System: `🔧` (sub-system), `⚙️` (system), `🌍` (super-system)
- Example: `[▶️⚙️]` means Present System

## Risk Level Indicators

Based on the number of identified risks:

- `[🟢 Low Risk]` - 0 risks identified
- `[🟡 Medium Risk]` - 1-2 risks identified
- `[🔴 High Risk]` - 3-4 risks identified
- `[⚫ Ruin Risk]` - 5+ risks identified

## Flexibility Score Indicators

Shows when path flexibility is becoming constrained:

- `[🔶 Flexibility: XX%]` - Caution (30-40% flexibility remaining)
- `[⚠️  Flexibility: XX%]` - Warning (20-30% flexibility remaining)
- `[⛔ Flexibility: XX%]` - Critical (<20% flexibility remaining)

No indicator is shown when flexibility is above 40%.

## Display Format

When enabled, indicators appear on a separate line below the technique title:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    ✨ 🔧 SCAMPER - Step 6/8                                 │
│                  [❌ ELIMINATE] [🔴 High Risk] [⚠️  Flexibility: 25%]        │
├──────────────────────────────────────────────────────────────────────────────┤
│ Problem: How to improve user onboarding experience                           │
├──────────────────────────────────────────────────────────────────────────────┤
│ ❌ Eliminate: What can we remove to simplify?                                │
│ Progress: ████████████████████░░░░░░░░░ 75%                                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Use Cases

### 1. Teaching and Learning

Visual indicators help users understand which mode of thinking they're currently in, making the
techniques more accessible to beginners.

### 2. Process Tracking

Teams can quickly see the current state without reading the full context, useful in collaborative
sessions.

### 3. Risk Awareness

Real-time risk and flexibility indicators help users make informed decisions about when to pivot or
generate alternatives.

### 4. Debugging

When troubleshooting creative thinking sessions, indicators provide quick state information.

## Terminal Compatibility

Visual indicators use Unicode characters and emoji that work well in modern terminals:

- macOS Terminal ✅
- iTerm2 ✅
- VS Code Terminal ✅
- Windows Terminal ✅
- Linux terminals with UTF-8 support ✅

## Performance Impact

Visual indicators have minimal performance impact:

- Only active when environment variable is set
- No additional API calls or complex calculations
- Uses data already available in the execution context

## Future Enhancements

Potential future improvements:

- Customizable indicator symbols
- Color-blind friendly mode
- Indicator history tracking
- Integration with telemetry system
