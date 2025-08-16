# Security Best Practices for Creative Thinking MCP Server on Cloudflare

## 🔒 Overview

This document outlines security best practices for deploying and maintaining the Creative Thinking
MCP Server on Cloudflare Workers.

## 🛡️ Authentication & Authorization

### Environment Variables

**NEVER hardcode credentials in your code.** Always use environment variables:

```toml
# wrangler.toml
[vars]
AUTH_DEMO_USERNAME = "your-secure-username"
AUTH_DEMO_API_KEY = "your-secure-api-key"
```

For production, use Cloudflare secrets:

```bash
npx wrangler secret put AUTH_API_KEY
npx wrangler secret put OAUTH_CLIENT_SECRET
```

### Token Security

The server uses cryptographically secure token generation:

- ✅ Uses `crypto.randomUUID()` for token generation
- ✅ Tokens stored in KV with automatic expiry
- ✅ Single-use auth codes (5-minute expiry)
- ✅ Access tokens with configurable expiry (default: 24 hours)

### OAuth Integration

For production, integrate with established OAuth providers:

1. **GitHub OAuth**:

   ```javascript
   const provider = new GitHubOAuthProvider({
     clientId: env.GITHUB_CLIENT_ID,
     clientSecret: env.GITHUB_CLIENT_SECRET,
     redirectUri: 'https://your-domain.com/callback',
   });
   ```

2. **Google OAuth**:
   ```javascript
   const provider = new GoogleOAuthProvider({
     clientId: env.GOOGLE_CLIENT_ID,
     clientSecret: env.GOOGLE_CLIENT_SECRET,
     redirectUri: 'https://your-domain.com/callback',
   });
   ```

## 🚦 Rate Limiting

### Built-in Rate Limiting

The server includes middleware for rate limiting:

```javascript
import { RateLimiter } from './middleware/rateLimiter';

// Configure per-endpoint limits
const rateLimiter = RateLimiter.forEndpoint(env.KV, request.url);
const limitResponse = await rateLimiter.enforce(request);
if (limitResponse) return limitResponse;
```

### Cloudflare Rate Limiting

Configure additional rate limiting in Cloudflare Dashboard:

1. Go to **Security → WAF → Rate limiting rules**
2. Create rules for:
   - `/mcp`: 100 requests/minute per IP
   - `/authorize`: 10 requests/minute per IP
   - `/token`: 5 requests/minute per IP

## 🔐 Data Protection

### KV Storage Security

- ✅ Session data expires automatically (7 days default)
- ✅ Token data expires after configured TTL
- ✅ Error logs expire after 24 hours
- ✅ Use encryption for sensitive data:

```javascript
// Encrypt sensitive data before storing
const encrypted = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  encoder.encode(sensitiveData)
);
await kv.put(key, encrypted);
```

### Input Validation

All inputs are validated before processing:

```javascript
// ExecutionAdapter validates all required fields
if (!planId || !technique || !problem) {
  return { error: 'Missing required fields', isError: true };
}

if (typeof currentStep !== 'number' || currentStep < 1 || currentStep > totalSteps) {
  return { error: 'Invalid currentStep', isError: true };
}
```

## 🌐 Network Security

### CORS Configuration

Configure CORS appropriately:

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': env.ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};
```

### Security Headers

Add security headers to all responses:

```javascript
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
};
```

## 🚨 Error Handling

### Safe Error Messages

Never expose sensitive information in error messages:

```javascript
// ❌ Bad: Exposes internal details
return { error: `Database connection failed: ${dbError.stack}` };

// ✅ Good: Generic message with logged details
console.error('Database error:', dbError);
return { error: 'An error occurred processing your request' };
```

### Error Logging

Errors are logged securely:

- Stored in KV with 24-hour expiry
- Includes error ID for tracking
- Stack traces only in development mode

## 📊 Monitoring & Auditing

### Cloudflare Analytics

Monitor your application through Cloudflare Dashboard:

1. **Workers Analytics**: Request counts, errors, latency
2. **Security Events**: Rate limiting, WAF blocks
3. **Real User Monitoring**: Performance metrics

### Audit Logging

Implement audit logging for sensitive operations:

```javascript
async function auditLog(action: string, userId: string, details: any) {
  await env.KV.put(
    `audit:${Date.now()}:${crypto.randomUUID()}`,
    JSON.stringify({
      action,
      userId,
      details,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('CF-Connecting-IP'),
    }),
    { expirationTtl: 2592000 } // 30 days
  );
}
```

## 🔄 Updates & Maintenance

### Dependency Management

Keep dependencies updated:

```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update

# Fix vulnerabilities
npm audit fix
```

### Security Patches

- Monitor [Cloudflare Security Advisories](https://developers.cloudflare.com/security-center/)
- Subscribe to dependency security alerts on GitHub
- Regularly update the Worker runtime compatibility date

## 🧪 Security Testing

### Penetration Testing

Regular security testing checklist:

- [ ] Test rate limiting effectiveness
- [ ] Verify token expiry and rotation
- [ ] Check for SQL injection in KV queries
- [ ] Test CORS configuration
- [ ] Verify error message sanitization
- [ ] Check for XSS vulnerabilities
- [ ] Test authentication bypass attempts

### Automated Security Scanning

Use GitHub's security features:

1. Enable Dependabot alerts
2. Enable code scanning
3. Review security advisories regularly

## 📝 Incident Response

### Response Plan

1. **Detect**: Monitor error rates and security events
2. **Contain**: Use Cloudflare's emergency mode if needed
3. **Investigate**: Review logs in KV and Cloudflare Analytics
4. **Remediate**: Deploy fixes via `wrangler deploy`
5. **Document**: Update this security guide with lessons learned

### Emergency Contacts

- Cloudflare Support: [support.cloudflare.com](https://support.cloudflare.com)
- Security Issues: Report to repository maintainers

## 🎯 Security Checklist

Before deploying to production:

- [ ] All credentials in environment variables or secrets
- [ ] OAuth provider configured (not demo auth)
- [ ] Rate limiting configured and tested
- [ ] CORS configured for your domain only
- [ ] Security headers implemented
- [ ] Error messages sanitized
- [ ] Logging and monitoring enabled
- [ ] Dependencies updated and audited
- [ ] Security testing completed
- [ ] Incident response plan documented

## 📚 Additional Resources

- [Cloudflare Workers Security](https://developers.cloudflare.com/workers/platform/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MCP Security Guidelines](https://modelcontextprotocol.io/docs/concepts/security)
- [Cloudflare WAF Documentation](https://developers.cloudflare.com/waf/)

---

**Remember**: Security is an ongoing process. Regularly review and update these practices as your
application evolves.
