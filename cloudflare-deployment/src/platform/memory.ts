/**
 * Platform memory shim
 *
 * Workers do not expose `process.memoryUsage()`. Provide stub values so
 * `SessionMetrics` and `MemoryManager` can continue to report "healthy"
 * without crashing. Heap threshold logic becomes a no-op since we always
 * return 0.
 */

export interface MemoryUsage {
  heapUsed: number;
  heapTotal: number;
  rss: number;
  external: number;
  arrayBuffers: number;
}

/**
 * Returns a stubbed memory usage snapshot.
 *
 * Cloudflare Workers enforce memory limits at the runtime level; there is
 * no user-visible heap metric. All fields return 0.
 */
export function memoryUsage(): MemoryUsage {
  return {
    heapUsed: 0,
    heapTotal: 0,
    rss: 0,
    external: 0,
    arrayBuffers: 0,
  };
}

/**
 * Returns the ratio of heap used to heap total (0..1).
 * Always 0 in Workers — used by `MemoryManager` to decide when to GC.
 */
export function heapUsageRatio(): number {
  return 0;
}
