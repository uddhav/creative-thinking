/**
 * Platform crypto shim
 *
 * Workers `nodejs_compat` exposes `node:crypto`, so `randomUUID` and
 * `createHash` work as-is. This module re-exports them with a consistent
 * surface for the rest of the ported code.
 */

import { randomUUID as nodeRandomUUID, createHash as nodeCreateHash } from 'node:crypto';

export const randomUUID = (): string => nodeRandomUUID();

export const createHash = (algorithm: string) => nodeCreateHash(algorithm);

/**
 * SHA-256 hash convenience helper.
 */
export function sha256Hex(input: string): string {
  return nodeCreateHash('sha256').update(input).digest('hex');
}
