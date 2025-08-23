/**
 * Middleware utilities for Cloudflare Workers
 */

/**
 * Middleware function type
 */
export type Middleware = (request: Request, next: () => Promise<Response>) => Promise<Response>;

/**
 * Apply a chain of middleware functions in sequence
 *
 * @param request - The incoming request
 * @param middlewares - Array of middleware functions to apply in order
 * @param finalHandler - The final handler to execute after all middleware
 * @returns The response from the middleware chain
 */
export function applyMiddlewareChain(
  request: Request,
  middlewares: Middleware[],
  finalHandler: () => Promise<Response>
): Promise<Response> {
  // Compose middleware functions from right to left
  // This ensures they execute in the order they appear in the array
  return middlewares.reduceRight<() => Promise<Response>>(
    (next, middleware) => () => middleware(request, next),
    finalHandler
  )();
}

/**
 * Compose multiple middleware functions into a single middleware
 *
 * @param middlewares - Array of middleware functions to compose
 * @returns A single middleware function that applies all middlewares in sequence
 */
export function composeMiddleware(...middlewares: Middleware[]): Middleware {
  return async (request: Request, next: () => Promise<Response>) => {
    return applyMiddlewareChain(request, middlewares, next);
  };
}
