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
# Authentication - Replace these in production
AUTH_DEMO_USERNAME = "demo"
AUTH_DEMO_API_KEY = "demo-api-key"
```

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

## 🔌 Connecting Clients

### WebSocket Connection

Connect directly via WebSocket:

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
- All 23 thinking techniques supported
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
