# Session Management Examples

The Creative Thinking MCP Tool now supports session management, allowing you to save, load, list,
delete, and export your creative thinking sessions.

## Session Management Operations

### 1. Save Current Session

Save your current creative thinking session with a name and tags:

```json
{
  "technique": "six_hats",
  "problem": "How to improve team collaboration",
  "currentStep": 3,
  "totalSteps": 6,
  "output": "Looking at emotions and team dynamics...",
  "nextStepNeeded": true,
  "hatColor": "red",
  "sessionOperation": "save",
  "saveOptions": {
    "sessionName": "Team Collaboration Brainstorm",
    "tags": ["teamwork", "productivity", "management"]
  }
}
```

### 2. List Saved Sessions

View all your saved sessions or filter by criteria:

```json
{
  "sessionOperation": "list",
  "listOptions": {
    "limit": 10,
    "technique": "six_hats",
    "status": "active",
    "tags": ["teamwork"]
  }
}
```

Example output:

```
📚 Saved Creative Thinking Sessions
══════════════════════════════════════════════════

📝 Team Collaboration Brainstorm
   Technique: 🎩 SIX HATS
   Progress: ████░░░░░░ 3/6 steps
   Updated: 5 minutes ago
   Tags: teamwork, productivity, management

📝 Product Innovation Session
   Technique: 🔄 SCAMPER
   Progress: ██████████ 7/7 steps ✓
   Updated: 2 hours ago
   Tags: innovation, product-design

Showing 2 sessions.
```

### 3. Load a Session

Load a previously saved session to continue where you left off:

```json
{
  "sessionOperation": "load",
  "loadOptions": {
    "sessionId": "session_12345",
    "continueFrom": 3
  }
}
```

### 4. Delete a Session

Remove a saved session:

```json
{
  "sessionOperation": "delete",
  "deleteOptions": {
    "sessionId": "session_12345",
    "confirm": true
  }
}
```

### 5. Export a Session

Export a session in various formats:

```json
{
  "sessionOperation": "export",
  "exportOptions": {
    "sessionId": "session_12345",
    "format": "markdown"
  }
}
```

## Auto-Save Feature

Enable auto-save to automatically persist your session after each step:

```json
{
  "technique": "po",
  "problem": "How to reduce customer support tickets",
  "currentStep": 2,
  "totalSteps": 4,
  "output": "What if we eliminated all support tickets by making the product psychic?",
  "nextStepNeeded": true,
  "provocation": "Po: Products can read minds",
  "autoSave": true
}
```

## Environment Variables

Configure persistence behavior with environment variables:

- `PERSISTENCE_TYPE`: Choose storage backend (`filesystem` or `memory`)
- `PERSISTENCE_PATH`: Custom path for filesystem storage (default: `~/.creative-thinking/sessions`)

Example:

```bash
export PERSISTENCE_TYPE=filesystem
export PERSISTENCE_PATH=/path/to/sessions
```

## Workflow Example

Here's a complete workflow using session management:

1. **Start a new thinking session**

```json
{
  "technique": "concept_extraction",
  "problem": "How to make online meetings more engaging",
  "currentStep": 1,
  "totalSteps": 4,
  "output": "Looking at successful game shows that keep audiences engaged...",
  "nextStepNeeded": true,
  "successExample": "TV game shows with live audience participation",
  "autoSave": true
}
```

2. **Continue with more steps** (session ID returned from step 1)

```json
{
  "sessionId": "session_abc123",
  "technique": "concept_extraction",
  "problem": "How to make online meetings more engaging",
  "currentStep": 2,
  "totalSteps": 4,
  "output": "Limitations: Can't have physical prizes, time zones vary...",
  "nextStepNeeded": true,
  "extractedConcepts": ["real-time interaction", "competitive elements", "audience participation"],
  "autoSave": true
}
```

3. **Save with a memorable name**

```json
{
  "sessionOperation": "save",
  "saveOptions": {
    "sessionName": "Meeting Engagement Ideas - Game Show Concepts",
    "tags": ["meetings", "engagement", "remote-work"]
  }
}
```

4. **Later, list and reload the session**

```json
{
  "sessionOperation": "list",
  "listOptions": {
    "searchTerm": "meeting"
  }
}
```

Then load it:

```json
{
  "sessionOperation": "load",
  "loadOptions": {
    "sessionId": "session_abc123"
  }
}
```

5. **Export the completed session**

```json
{
  "sessionOperation": "export",
  "exportOptions": {
    "sessionId": "session_abc123",
    "format": "markdown"
  }
}
```

## Benefits of Session Management

1. **Persistence**: Never lose your creative thinking progress
2. **Organization**: Tag and name sessions for easy retrieval
3. **Collaboration**: Export sessions to share with teammates
4. **Analysis**: Review past sessions to identify patterns
5. **Templates**: Save successful sessions as templates for reuse
