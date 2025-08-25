# Creative Thinking MCP Client SDK

A TypeScript/JavaScript SDK for interacting with the Creative Thinking and Idea Storming MCP Servers
deployed on Cloudflare Workers. This SDK provides two separate clients for the dual-agent
architecture.

## 🚀 Installation

```bash
npm install @creative-thinking/client-sdk
# or
yarn add @creative-thinking/client-sdk
```

## 📖 Quick Start

### Creative Thinking Client

```typescript
import { CreativeThinkingClient } from '@creative-thinking/client-sdk';

// Create client for creative thinking (3 tools)
const creativeClient = new CreativeThinkingClient({
  serverUrl: 'https://your-server.workers.dev/thinker/streamable',
  auth: {
    type: 'api-key',
    credentials: { apiKey: 'your-api-key' },
  },
  enableStreaming: true,
});

// Connect
await creativeClient.connect();

// Discover techniques
const discovery = await creativeClient.discoverTechniques('How to improve product design?');

// Plan session
const plan = await creativeClient.planThinkingSession(discovery.problem, ['six_hats', 'scamper']);

// Execute steps
const result = await creativeClient.executeThinkingStep({
  planId: plan.planId,
  technique: 'six_hats',
  problem: plan.problem,
  currentStep: 1,
  totalSteps: 6,
  output: 'Analyzing facts...',
  nextStepNeeded: true,
});
```

### Idea Storming Client

```typescript
import { IdeaStormingClient } from '@creative-thinking/client-sdk';

// Create client for AI-powered idea enhancement
const ideaClient = new IdeaStormingClient({
  serverUrl: 'https://your-server.workers.dev/ideator/streamable',
  auth: {
    type: 'api-key',
    credentials: { apiKey: 'your-api-key' },
  },
});

// Connect
await ideaClient.connect();

// Check AI capability
const capability = await ideaClient.checkSamplingCapability();

if (capability.available) {
  // Enhance ideas
  const enhanced = await ideaClient.enhanceIdea(
    'Mobile app for gardeners',
    'Product design context',
    {
      style: 'innovative',
      depth: 'deep',
      addExamples: true,
    }
  );

  // Generate variations
  const variations = await ideaClient.generateVariations('Original idea', 5, 'diverse');

  // Synthesize multiple ideas
  const synthesis = await ideaClient.synthesizeIdeas(['Idea 1', 'Idea 2', 'Idea 3'], 'Common goal');
}
```

## 🔧 Configuration

### Transport Options

The SDK supports multiple transport protocols:

- **HTTP** (default): Standard HTTP requests
- **SSE**: Server-Sent Events for streaming
- **WebSocket**: Bidirectional real-time communication

```typescript
const client = new CreativeThinkingClient({
  serverUrl: 'https://your-server.workers.dev',
  transport: 'websocket', // 'http' | 'sse' | 'websocket'
  enableStreaming: true,
});
```

### Authentication

Three authentication methods are supported:

```typescript
// API Key
{
  auth: {
    type: 'api-key',
    credentials: { apiKey: 'your-key' }
  }
}

// Basic Auth
{
  auth: {
    type: 'basic',
    credentials: { username: 'user', password: 'pass' }
  }
}

// OAuth
{
  auth: {
    type: 'oauth',
    credentials: { token: 'bearer-token' }
  }
}
```

### Advanced Options

```typescript
const client = new CreativeThinkingClient({
  serverUrl: 'https://your-server.workers.dev',

  // Retry configuration
  retry: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2,
  },

  // Timeout configuration
  timeout: {
    connect: 10000,
    request: 30000,
    idle: 60000,
  },

  // Features
  enableStreaming: true,
  enableSampling: true,
  autoReconnect: true,
  debug: true,
});
```

## 📡 Real-time Streaming

Subscribe to real-time updates for progress tracking and state changes:

```typescript
// Get streaming client
const streaming = client.getStreamingClient();

// Subscribe to session
client.subscribeToSession(sessionId);

// Handle events
client.on('progress', event => {
  console.log(`${event.operation}: ${event.percent}%`);
});

client.on('warning', (level, message) => {
  console.warn(`[${level}] ${message}`);
});

client.on('streamingEvent', event => {
  // Handle custom streaming events
});
```

## 📊 Session Management

```typescript
// Create session
const session = await client.createSession('Problem statement', { metadata: 'values' });

// Get session
const retrieved = await client.getSession(session.id);

// List sessions
const sessions = await client.listSessions({
  limit: 10,
  offset: 0,
  sortBy: 'createdAt',
});

// Update session
await client.updateSession(session.id, {
  metadata: { status: 'in-progress' },
});

// Delete session
await client.deleteSession(session.id);
```

## 📚 Resources & Prompts

```typescript
// List resources
const resources = await client.listResources();

// Read resource
const content = await client.readResource('session://abc123');

// List prompts
const prompts = await client.listPrompts();

// Get prompt
const prompt = await client.getPrompt('creative_workshop', {
  topic: 'Innovation',
});
```

## 🎯 Event Handling

```typescript
// Connection events
client.on('connect', () => console.log('Connected'));
client.on('disconnect', reason => console.log('Disconnected:', reason));
client.on('reconnect', attempt => console.log('Reconnecting:', attempt));

// Session events
client.on('sessionCreated', id => console.log('Session created:', id));
client.on('sessionUpdated', (id, update) => console.log('Updated:', update));

// Technique events
client.on('techniqueStarted', (technique, step) => {
  console.log(`Started ${technique} step ${step}`);
});

client.on('techniqueProgress', (technique, step, total) => {
  console.log(`Progress: ${technique} ${step}/${total}`);
});

// Error handling
client.on('error', error => {
  console.error('Client error:', error);
});
```

## 📈 Metrics

Track client performance and usage:

```typescript
const metrics = client.getMetrics();

console.log({
  requests: metrics.requestCount,
  successRate: (metrics.successCount / metrics.requestCount) * 100,
  averageLatency: metrics.averageLatency,
  reconnects: metrics.reconnectCount,
});

// Reset metrics
client.resetMetrics();
```

## 🔄 Batch Operations

Execute multiple requests efficiently:

```typescript
const results = await client.batch([
  { id: '1', method: 'discover_techniques', params: { problem: 'Problem 1' } },
  { id: '2', method: 'discover_techniques', params: { problem: 'Problem 2' } },
  { id: '3', method: 'enhance_idea', params: { idea: 'Idea to enhance' } },
]);

results.forEach(result => {
  if (result.error) {
    console.error(`Request ${result.id} failed:`, result.error);
  } else {
    console.log(`Request ${result.id} succeeded:`, result.result);
  }
});
```

## 🧪 TypeScript Support

The SDK is fully typed with TypeScript:

```typescript
import type {
  ClientConfig,
  DiscoveryResult,
  PlanningResult,
  ExecutionResult,
  Session,
  Technique,
  StreamingEvent,
} from '@creative-thinking/client-sdk';
```

## 🛠️ Error Handling

```typescript
try {
  const result = await client.discoverTechniques('Problem');
} catch (error) {
  if (error.code === 'timeout') {
    // Handle timeout
  } else if (error.code === 'auth_failed') {
    // Handle auth failure
  } else {
    // Handle other errors
  }
}
```

## 📝 Examples

See the [examples](./examples) directory for more usage examples:

- [Basic Usage](./examples/basic-usage.ts) - Complete walkthrough
- More examples coming soon...

## 🤝 Contributing

Contributions are welcome! Please see the main repository's contributing guidelines.

## 📄 License

MIT License - see LICENSE file for details.
