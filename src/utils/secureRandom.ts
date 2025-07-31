/**
 * Secure random number generation utilities
 * Uses crypto.getRandomValues() for cryptographically secure randomness
 */

import { randomBytes } from 'crypto';

/**
 * Get a cryptographically secure random integer for array index selection
 * @param arrayLength The length of the array
 * @returns A random index between 0 and arrayLength-1
 */
export function getSecureRandomIndex(arrayLength: number): number {
  if (arrayLength <= 0) {
    throw new Error('Array length must be positive');
  }

  // For small arrays, use a single byte
  if (arrayLength <= 256) {
    const buffer = randomBytes(1);
    return buffer[0] % arrayLength;
  }

  // For larger arrays, use 32-bit value
  const buffer = randomBytes(4);
  const value = buffer.readUInt32BE(0);
  return value % arrayLength;
}

/**
 * Get a cryptographically secure random float in range [min, max)
 * @param min Minimum value (inclusive)
 * @param max Maximum value (exclusive)
 * @returns A random float between min and max
 */
export function getSecureRandomFloat(min: number, max: number): number {
  if (min >= max) {
    throw new Error('Min must be less than max');
  }

  const buffer = randomBytes(4);
  const value = buffer.readUInt32BE(0);
  // Normalize to [0, 1) then scale to desired range
  const normalized = value / 0x100000000; // Divide by 2^32
  return min + normalized * (max - min);
}

/**
 * Get a cryptographically secure random boolean
 * @param probabilityTrue Probability of returning true (default 0.5)
 * @returns A random boolean
 */
export function getSecureRandomBoolean(probabilityTrue: number = 0.5): boolean {
  if (probabilityTrue < 0 || probabilityTrue > 1) {
    throw new Error('Probability must be between 0 and 1');
  }

  return getSecureRandomFloat(0, 1) < probabilityTrue;
}
