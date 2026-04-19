/**
 * Platform lifecycle shim
 *
 * Workers lifecycle is managed by the runtime — there is no
 * `process.on('beforeExit', ...)`. We provide a no-op registration API so
 * ported modules (e.g. `TelemetryCollector`) can request shutdown hooks
 * without special-casing the platform.
 *
 * If the DO is evicted, any in-flight state is lost; telemetry is flushed
 * opportunistically on each request boundary instead of on exit.
 */

type ShutdownHandler = () => void | Promise<void>;

const handlers = new Set<ShutdownHandler>();

/**
 * Register a shutdown handler. In Workers this is a no-op at runtime —
 * handlers are never invoked automatically. Call `flushShutdownHandlers()`
 * explicitly from the DO if you need to.
 */
export function onShutdown(fn: ShutdownHandler): void {
  handlers.add(fn);
}

/**
 * Remove a previously-registered shutdown handler.
 */
export function offShutdown(fn: ShutdownHandler): void {
  handlers.delete(fn);
}

/**
 * Invoke all registered shutdown handlers.
 * The DO may call this on `alarm()` or periodic checkpoints.
 */
export async function flushShutdownHandlers(): Promise<void> {
  for (const fn of handlers) {
    try {
      await fn();
    } catch {
      // swallow — shutdown is best-effort
    }
  }
}

/**
 * Clear all handlers (used in tests).
 */
export function clearShutdownHandlers(): void {
  handlers.clear();
}

/**
 * Type alias for `NodeJS.Timeout` that works in Workers.
 * Use `PlatformTimeout` in place of `NodeJS.Timeout`.
 */
export type PlatformTimeout = ReturnType<typeof setInterval>;
