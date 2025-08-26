# Security Best Practices for Cloudflare Deployment

## Authentication and Authorization

### Debug Mode Security

- **Never use URL parameters for authentication tokens** - Tokens in URLs can be exposed in:
  - Server access logs
  - Browser history
  - Referrer headers
  - Proxy logs
- **Use header-based authentication only**: `X-Debug-Token` header
- **Store tokens as Cloudflare secrets**: Never commit tokens to source control

### Token Management

```bash
# Generate secure tokens
openssl rand -hex 32

# Store as Cloudflare secrets
npx wrangler secret put DEBUG_TOKEN
npx wrangler secret put AUTH_API_KEY
npx wrangler secret put OAUTH_CLIENT_SECRET
```

## Error Handling

### Information Disclosure Prevention

- Stack traces are **only shown in development** environment
- Production errors return minimal information
- Error IDs are provided for tracking without exposing internals

### MCP Protocol Compliance

- All errors return properly formatted JSON-RPC 2.0 error responses
- Error codes follow JSON-RPC specifications:
  - `-32603`: Internal error
  - `-32602`: Invalid params
  - `-32601`: Method not found

## Deployment Security

### Environment Configuration

```toml
# wrangler.toml - Production settings
[vars]
ENVIRONMENT = "production"  # Ensures stack traces are hidden
LOG_LEVEL = "warn"         # Reduces information in logs
```

### Headers and CORS

- CORS is configured per endpoint
- Security headers should be added in production:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Content-Security-Policy: default-src 'none'`

## Monitoring and Logging

### Safe Logging Practices

- Never log authentication tokens
- Sanitize user input before logging
- Use structured logging with appropriate levels

### Rate Limiting

- Configure Cloudflare rate limiting rules
- Monitor for suspicious patterns
- Use IP-based rate limiting for unauthenticated endpoints

## Security Checklist

Before deploying to production:

- [ ] All secrets stored using `wrangler secret`
- [ ] Debug mode disabled or properly secured
- [ ] Environment set to "production"
- [ ] Error responses don't leak sensitive information
- [ ] Rate limiting configured
- [ ] Security headers configured
- [ ] Logging doesn't expose sensitive data
- [ ] CORS properly configured for your domain

## Incident Response

If a token is exposed:

1. Immediately rotate the token using `wrangler secret put`
2. Review access logs for unauthorized usage
3. Update all systems using the old token
4. Document the incident for future prevention

## Regular Security Tasks

- **Monthly**: Review and rotate authentication tokens
- **Quarterly**: Audit security configurations
- **Annually**: Full security review and penetration testing
