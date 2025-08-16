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

# Deploy to production
npm run deploy

# Your server will be available at:
# https://creative-thinking-mcp.<your-subdomain>.workers.dev
```

## 🏗️ Architecture

This implementation uses:

- **Cloudflare Agents SDK** with `McpAgent` class for MCP protocol support
- **Durable Objects** for session state persistence
- **WebSocket Hibernation** for cost-efficient real-time connections (1000x cost savings)
- **KV Storage** for session data
- **OAuth Provider** for authentication

## 🔧 Configuration

### Environment Variables

Edit `wrangler.toml` to configure:

```toml
[vars]
ENVIRONMENT = "production"
LOG_LEVEL = "info"
```

### Custom Domain

To use a custom domain, uncomment and update in `wrangler.toml`:

```toml
[[routes]]
pattern = "your-domain.com/*"
zone_name = "your-domain.com"
```

## 🔌 Connecting Clients

### WebSocket Connection

Connect directly via WebSocket (bypasses OAuth):

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

### MCP Client Connection

Connect any MCP client to:

```
https://your-server.workers.dev/mcp
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

- ✅ All 23 creative thinking techniques
- ✅ WebSocket real-time communication
- ✅ Session persistence with Durable Objects
- ✅ OAuth authentication
- ✅ Cost-optimized with hibernation
- ✅ Progress streaming
- ✅ Multi-client support

## 🏛️ Project Structure

```
creative-thinking-cloudflare/
├── src/
│   ├── index.ts                    # Worker entry point
│   ├── CreativeThinkingMcpAgent.ts # Main MCP Agent
│   ├── auth-handler.ts             # OAuth handler
│   └── adapters/                   # Adapters for core logic
│       ├── SessionAdapter.ts       # Session management
│       ├── TechniqueAdapter.ts     # Technique registry
│       └── ExecutionAdapter.ts     # Execution logic
├── wrangler.toml                   # Cloudflare config
├── example-client.html             # Test client
└── package.json
```

## 🔒 Security

- OAuth 2.1 compliant authentication
- API key support for simple auth
- Request validation before Durable Object processing
- Rate limiting via Cloudflare
- CORS properly configured

## 💰 Cost Optimization

- **WebSocket Hibernation**: Connections stay open for free during idle periods
- **Pay only for active processing**: No charges during hibernation
- **Efficient state management**: Durable Objects with SQL storage
- **Smart caching**: KV for frequently accessed data

## 📊 Monitoring

View logs and metrics in the Cloudflare dashboard:

1. Go to Workers & Pages
2. Select your worker
3. View Analytics, Logs, and Real-time logs

## 🐛 Troubleshooting

### Common Issues

1. **Connection refused**: Check server URL and ensure it's deployed
2. **Auth errors**: Verify OAuth configuration in `wrangler.toml`
3. **Session not found**: Sessions expire after 7 days

### Debug Mode

Enable debug logging:

```toml
[env.development]
vars = { LOG_LEVEL = "debug" }
```

## 📝 License

GPL-3.0 - See LICENSE file in parent repository

## 🤝 Contributing

Contributions welcome! Please see CONTRIBUTING.md in the parent repository.

## 🔗 Links

- [Main Repository](https://github.com/uddhav/creative-thinking)
- [MCP Specification](https://modelcontextprotocol.io)
- [Cloudflare Agents SDK](https://developers.cloudflare.com/agents/)
- [Durable Objects Docs](https://developers.cloudflare.com/durable-objects/)
