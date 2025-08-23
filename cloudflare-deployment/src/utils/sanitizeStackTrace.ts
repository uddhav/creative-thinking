/**
 * Sanitize Stack Trace Utility
 *
 * Removes sensitive information from stack traces before exposing them
 */

/**
 * Sanitize a stack trace to remove sensitive information
 * @param stack - The raw stack trace string
 * @param maxDepth - Maximum number of stack frames to include (default 5)
 * @returns Sanitized stack trace
 */
export function sanitizeStackTrace(stack: string | undefined, maxDepth = 5): string {
  if (!stack) return '';

  const lines = stack.split('\n');
  const sanitized: string[] = [];
  let frameCount = 0;

  for (const line of lines) {
    // Skip if we've reached max depth
    if (frameCount >= maxDepth) {
      sanitized.push('    ... stack trace truncated ...');
      break;
    }

    // Remove absolute paths, keep only relative paths
    let sanitizedLine = line
      // Remove absolute paths (e.g., /Users/username/...)
      .replace(/\/Users\/[^/]+\//g, '~/')
      .replace(/\/home\/[^/]+\//g, '~/')
      .replace(/C:\\Users\\[^\\]+\\/g, '~\\')
      // Remove node_modules internal paths
      .replace(/node_modules\/[^)]+/g, 'node_modules/...')
      // Remove file system paths that might contain sensitive info
      .replace(/file:\/\/[^)]+/g, 'file://...')
      // Remove potential secrets or tokens in URLs
      .replace(/([?&])(token|key|secret|password|auth)=[^&\s)]*/gi, '$1$2=***')
      // Remove port numbers that might reveal internal services
      .replace(/:(\d{4,5})/g, ':****');

    // Count actual stack frames (lines starting with 'at')
    if (line.trim().startsWith('at ')) {
      frameCount++;
    }

    // Skip internal Node.js or system frames
    if (
      line.includes('node:internal') ||
      line.includes('node:async_hooks') ||
      line.includes('node:events') ||
      line.includes('node:net') ||
      line.includes('node:stream')
    ) {
      continue;
    }

    sanitized.push(sanitizedLine);
  }

  return sanitized.join('\n');
}

/**
 * Create a safe error object for responses
 * @param error - The error to sanitize
 * @param isDevelopment - Whether in development mode
 * @returns Safe error object
 */
export function createSafeErrorResponse(
  error: unknown,
  isDevelopment: boolean
): {
  message: string;
  stack?: string;
  type?: string;
} {
  if (!isDevelopment) {
    return {
      message: 'An unexpected error occurred',
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      type: error.constructor.name,
      // Even in development, sanitize the stack trace
      stack: sanitizeStackTrace(error.stack),
    };
  }

  // Handle non-Error objects
  return {
    message: String(error),
  };
}
