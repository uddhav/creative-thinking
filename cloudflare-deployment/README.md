# Creative Thinking MCP Server - Cloudflare Deployment

This is the Cloudflare Workers deployment of the Creative Thinking MCP Server using the Agents SDK
with WebSocket hibernation for optimal performance and cost efficiency.

## 🚀 Quick Start

### Prerequisites

- Cloudflare account (free tier works)
- Node.js 18+
- Wrangler CLI (`npm install -g wrangler`)

### Local Development

```bash
# Install dependencies
npm install

# Run locally with Miniflare
npm run dev

# Open browser to http://localhost:8787
```

### Deploy to Cloudflare

```bash
# Login to Cloudflare
npx wrangler login

# Set up secrets for production (replace with your values)
npx wrangler secret put AUTH_DEMO_USERNAME
npx wrangler secret put AUTH_DEMO_API_KEY

# Deploy to production
npm run deploy

# Your server will be available at:
# https://creative-thinking-mcp.<your-subdomain>.workers.dev
```

## 🏗️ Architecture

This implementation uses:

- **Cloudflare Agents SDK** with `McpAgent` class for MCP protocol support
- **Multi-Transport Architecture**:
  - **Server-Sent Events (SSE)** for MCP protocol streaming at `/mcp`
  - **HTTP API** for standard MCP requests at `/api`
  - **WebSocket** for real-time bidirectional MCP communication at `/ws`
  - **Streaming Architecture** for real-time progress updates at `/stream`
- **Durable Objects** for session state persistence
- **WebSocket Hibernation** for cost-efficient real-time connections (1000x cost savings)
- **KV Storage** for session data
- **OAuth Provider** for authentication (optional)

### 📡 Streaming Architecture

The server includes a comprehensive streaming architecture for real-time updates:

#### Transport Options

1. **Server-Sent Events (SSE)** at `/stream`
   - One-way server-to-client streaming
   - Automatic reconnection support
   - Keep-alive heartbeats
   - Progress tracking for long operations

2. **WebSocket** at `/stream` (with `Upgrade: websocket`)
   - Bidirectional communication
   - Lower latency than SSE
   - RPC support for interactive operations
   - Real-time collaboration features

#### Streaming Events

- **Progress Events**: Track long-running operations with percentage, ETA, and metadata
- **State Changes**: Real-time synchronization of session state
- **Visual Output**: Rich terminal-like output with colors and formatting
- **Warnings**: Risk level notifications (SAFE, CAUTION, WARNING, CRITICAL)
- **Collaboration**: Multi-user session support with presence and activity tracking

#### Visual Output Features

The streaming system provides rich visual output:

- Headers with icons and colors
- Progress bars with percentage tracking
- Divider lines (solid, dashed, double)
- Technique-specific output formatting
- Warning messages with severity indicators

#### Usage Example

````javascript
// Connect via SSE
const eventSource = new EventSource('/stream?sessionId=abc123');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Streaming event:', data);
};

// Or connect via WebSocket
const ws = new WebSocket('wss://your-server.workers.dev/stream?sessionId=abc123');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('WebSocket event:', data);
};

## 🔧 Configuration

### Environment Variables

Edit `wrangler.toml` to configure:

```toml
[vars]
ENVIRONMENT = "production"
LOG_LEVEL = "info"
# Authentication - Replace these in production
AUTH_DEMO_USERNAME = "demo"
AUTH_DEMO_API_KEY = "demo-api-key"
````

**Important**: For production, use Cloudflare secrets instead of plain text:

```bash
npx wrangler secret put AUTH_DEMO_USERNAME
npx wrangler secret put AUTH_DEMO_API_KEY
npx wrangler secret put OAUTH_CLIENT_SECRET
```

### Custom Domain

To use a custom domain, uncomment and update in `wrangler.toml`:

```toml
[[routes]]
pattern = "your-domain.com/*"
zone_name = "your-domain.com"
```

## 🤖 MCP Sampling (AI Enhancement)

The server supports MCP Sampling protocol for AI-powered enhancement of creative thinking sessions.

### Features

- **Idea Enhancement**: Improve and expand creative ideas with AI
- **Variation Generation**: Create multiple variations of ideas
- **Idea Synthesis**: Combine multiple ideas into unified solutions
- **Custom Sampling**: Direct access to AI models for custom prompts

### Sampling Tools

1. **sampling_capability**: Check if sampling is available
2. **enhance_idea**: Enhance a single idea with various styles and depths
3. **generate_variations**: Create variations (similar, diverse, or opposite)
4. **synthesize_ideas**: Combine multiple ideas into one solution
5. **test_sampling**: Test direct AI sampling with custom prompts

### Configuration

Enable sampling by setting the `samplingEnabled` prop when creating the agent:

```javascript
const agent = new CreativeThinkingMcpAgent({
  samplingEnabled: true, // Enable AI features
  // Other props...
});
```

### Example Usage

```javascript
// Enhance an idea
const enhanced = await agent.tools.enhance_idea({
  idea: 'Create a mobile app for gardeners',
  style: 'innovative',
  depth: 'deep',
  addExamples: true,
  addRisks: true,
});

// Generate variations
const variations = await agent.tools.generate_variations({
  idea: 'Virtual reality training',
  count: 5,
  style: 'diverse',
});

// Synthesize ideas
const synthesis = await agent.tools.synthesize_ideas({
  ideas: ['Use AI for personalization', 'Implement gamification', 'Add social features'],
  goal: 'Increase user engagement',
});
```

### Fallback Behavior

When sampling is unavailable, the system gracefully falls back to:

- Basic enhancement using templates
- Rule-based variation generation
- Simple combination for synthesis

This ensures the server remains functional even without AI capabilities.

## 🔌 Connecting Clients

### MCP Server-Sent Events (SSE) Connection

Connect MCP clients via SSE (primary transport):

```
https://your-server.workers.dev/mcp
```

This endpoint supports the full MCP protocol over Server-Sent Events.

### HTTP API Connection

Standard HTTP requests:

```javascript
fetch('https://your-server.workers.dev/api/tools/call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'discover_techniques',
      arguments: { problem: 'Your problem here' },
    },
  }),
});
```

### WebSocket Connection

For real-time bidirectional MCP communication:

```javascript
const ws = new WebSocket('wss://your-server.workers.dev/ws');
ws.onopen = () => {
  ws.send(
    JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'discover_techniques',
        arguments: { problem: 'Your problem here' },
      },
    })
  );
};
```

### OAuth Flow

1. Direct users to `/authorize`
2. After authentication, they'll be redirected with an auth code
3. Exchange code for token at `/token`
4. Use token for authenticated requests

## 📚 Available Tools

The server exposes three MCP tools:

1. **discover_techniques** - Analyze problems and recommend techniques
2. **plan_thinking_session** - Create structured workflows
3. **execute_thinking_step** - Execute individual workflow steps

## 🧪 Testing

Use the included `example-client.html`:

```bash
# Start local server
npm run dev

# Open example-client.html in browser
# Connect to ws://localhost:8787/ws
```

## 💡 Features

- ✅ All 21 creative thinking techniques
- ✅ WebSocket real-time communication with hibernation
- ✅ Session persistence with Durable Objects
- ✅ OAuth authentication with secure token generation
- ✅ Rate limiting middleware
- ✅ Input validation and error handling
- ✅ Cost-optimized with hibernation (1000x savings)
- ✅ Progress streaming
- ✅ Multi-client support

## 🏛️ Project Structure

```
cloudflare-deployment/
├── src/
│   ├── index.ts                    # Worker entry point
│   ├── CreativeThinkingMcpAgent.ts # Main MCP Agent
│   ├── auth-handler.ts             # OAuth handler
│   ├── middleware/                 # Security middleware
│   │   ├── auth.ts                 # Token validation
│   │   └── rateLimiter.ts          # Rate limiting
│   └── adapters/                   # Adapters for core logic
│       ├── SessionAdapter.ts       # Session management
│       ├── TechniqueAdapter.ts     # Technique registry
│       └── ExecutionAdapter.ts     # Execution logic
├── wrangler.toml                   # Cloudflare config
├── example-client.html             # Test client
└── package.json
```

## 🔒 Security Best Practices

### Production Checklist

Before deploying to production:

- [ ] Replace demo credentials with real OAuth provider (GitHub, Google)
- [ ] Use Cloudflare secrets for all sensitive values
- [ ] Configure rate limiting in Cloudflare Dashboard
- [ ] Set CORS to your specific domain
- [ ] Enable Cloudflare WAF rules
- [ ] Review and update CPU limits in `wrangler.toml`
- [ ] Set up error monitoring and alerts
- [ ] Test all authentication flows
- [ ] Verify token expiry and rotation

### Security Features

- **Secure Token Generation**: Uses `crypto.randomUUID()` for all tokens
- **Token Expiry**: Access tokens expire after 24 hours (configurable)
- **Single-Use Auth Codes**: Auth codes expire after 5 minutes
- **Rate Limiting**: Per-endpoint rate limits with burst protection
- **Input Validation**: All inputs validated before processing
- **Error Sanitization**: No sensitive data in error messages
- **KV Data Expiry**: Automatic cleanup of old sessions and logs

### Rate Limiting

Configure in Cloudflare Dashboard:

- `/mcp`: 100 requests/minute per IP
- `/authorize`: 10 requests/minute per IP
- `/token`: 5 requests/minute per IP

## 💰 Cost Optimization

- **WebSocket Hibernation**: Connections stay open for free during idle periods
- **Pay only for active processing**: No charges during hibernation
- **Efficient state management**: Durable Objects with SQL storage
- **Smart caching**: KV for frequently accessed data
- **CPU Limits**: Configured for 200ms to handle complex techniques

## 📊 Monitoring

View logs and metrics in the Cloudflare dashboard:

1. Go to **Workers & Pages**
2. Select your worker
3. View **Analytics**, **Logs**, and **Real-time logs**

Enable detailed logging in development:

```toml
[env.development]
vars = { ENVIRONMENT = "development", LOG_LEVEL = "debug" }
```

## 🐛 Troubleshooting

### Common Issues

1. **Connection refused**: Check server URL and ensure it's deployed
2. **Auth errors**: Verify OAuth configuration and secrets
3. **Session not found**: Sessions expire after 7 days
4. **Rate limit exceeded**: Wait for rate limit window to reset
5. **CPU limit exceeded**: Increase `cpu_ms` in `wrangler.toml`

### Debug Commands

```bash
# View real-time logs
npx wrangler tail

# Check deployment status
npx wrangler deployments list

# View KV data
npx wrangler kv:key list --namespace-id=creative_thinking_sessions
```

## 📝 Implementation Notes

### What's Been Implemented

- **Full MCP Protocol Support**: All three tools with proper Zod validation
- **Adapter Pattern**: Bridges existing logic without rewriting
- **WebSocket Hibernation**: 1000x cost reduction for idle connections
- **Secure Authentication**: OAuth flow with token management
- **Error Handling**: Global error boundary with logging
- **Performance Optimizations**: Batch KV reads, increased CPU limits

### Migration from Local Server

The Cloudflare deployment maintains full compatibility with the local MCP server:

- Same three-tool architecture
- All 21 thinking techniques supported
- Compatible session format
- Identical API responses

## 📝 License

GPL-3.0 - See LICENSE file in parent repository

## 🤝 Contributing

Contributions welcome! Please see CONTRIBUTING.md in the parent repository.

## 🔗 Links

- [Main Repository](https://github.com/uddhav/creative-thinking)
- [MCP Specification](https://modelcontextprotocol.io)
- [Cloudflare Agents SDK](https://developers.cloudflare.com/agents/)
- [Durable Objects Docs](https://developers.cloudflare.com/durable-objects/)
- [Workers Security](https://developers.cloudflare.com/workers/platform/security/)
