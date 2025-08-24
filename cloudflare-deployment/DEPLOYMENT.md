# Cloudflare Deployment Guide

This guide explains how to deploy the Creative Thinking MCP Server to Cloudflare Workers.

## Prerequisites

- Cloudflare account
- Wrangler CLI installed (`npm install -g wrangler`)
- Node.js 18+ installed

## Setup Steps

### 1. Configure Wrangler

Copy the example configuration:

```bash
cp wrangler.toml.example wrangler.toml
```

### 2. Create KV Namespaces

Create the required KV namespaces:

```bash
# For session storage
npx wrangler kv namespace create sessions

# For OAuth storage
npx wrangler kv namespace create oauth
```

Update `wrangler.toml` with the IDs returned from these commands.

### 3. Set Environment Variables

For production security, set an admin registration key:

```bash
npx wrangler secret put ADMIN_REGISTRATION_KEY
```

This key will be required to register new OAuth clients in production.

### 4. Deploy

Deploy to Cloudflare Workers:

```bash
npx wrangler deploy
```

## Architecture

The deployment uses:

- **Cloudflare Workers** for the main application
- **Durable Objects** for stateful MCP sessions
- **KV Storage** for OAuth clients and tokens
- **Workers AI** (optional) for enhanced features

## OAuth Configuration

The server implements OAuth 2.0 with:

- Client credentials grant type for machine-to-machine auth
- Protected client registration (requires admin key in production)
- Token expiry and refresh mechanisms

### Registering Clients

In production, client registration requires an admin key:

```bash
curl -X POST https://your-worker.workers.dev/register \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -d '{
    "client_name": "Your Client",
    "grant_types": ["client_credentials"],
    "redirect_uris": ["http://localhost:3000/callback"],
    "scope": "read write execute"
  }'
```

### Getting Access Tokens

Use client credentials to obtain an access token:

```bash
curl -X POST https://your-worker.workers.dev/token \
  -u "CLIENT_ID:CLIENT_SECRET" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&scope=read+write+execute"
```

## MCP Integration

The server exposes MCP tools at the `/sse` endpoint. Clients must:

1. Obtain an access token using OAuth
2. Connect to `/sse` with the Bearer token
3. Use the MCP protocol for tool invocation

## Security Considerations

- **Client Registration**: Restricted to localhost in development, requires admin key in production
- **Token Storage**: Uses Cloudflare KV with TTL
- **Rate Limiting**: Configure via Cloudflare dashboard
- **Secrets Management**: Use `wrangler secret` for sensitive values

## Monitoring

View logs and metrics:

```bash
npx wrangler tail
```

Enable observability in `wrangler.toml` for detailed metrics.

## Troubleshooting

### Common Issues

1. **Migration Errors**: If you see Durable Object migration errors, you may need to handle existing
   objects
2. **KV Namespace Issues**: Ensure KV namespaces are created and IDs are correctly set
3. **Authentication Failures**: Verify client credentials and token expiry

### Health Check

Test the deployment:

```bash
curl https://your-worker.workers.dev/health
```

## Cost Considerations

- Workers free tier: 100,000 requests/day
- Durable Objects: Billed per request and duration
- KV Storage: Free tier includes 100,000 reads/day
- Workers AI: Usage-based pricing

## Development

For local development:

```bash
npm run dev
```

This starts a local server with hot reload at `http://localhost:8787`.

## License

See LICENSE file in the repository root.
