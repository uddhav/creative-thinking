/**
 * Safe wrappers for cryptographic operations with fallback
 * Provides graceful degradation when crypto operations fail
 */

import { logger } from './Logger.js';
import {
  getSecureRandomBoolean as cryptoRandomBoolean,
  getSecureRandomFloat as cryptoRandomFloat,
  getSecureRandomIndex as cryptoRandomIndex,
} from './secureRandom.js';

/**
 * Get a random boolean with crypto fallback
 * @param probabilityTrue Probability of returning true (default 0.5)
 * @returns A random boolean
 */
export function safeRandomBoolean(probabilityTrue: number = 0.5): boolean {
  try {
    return cryptoRandomBoolean(probabilityTrue);
  } catch (error) {
    logger.warn('Crypto random boolean failed, falling back to Math.random', {
      error: error instanceof Error ? error.message : 'Unknown error',
      probabilityTrue,
    });
    return Math.random() < probabilityTrue;
  }
}

/**
 * Get a random float with crypto fallback
 * @param min Minimum value (inclusive)
 * @param max Maximum value (exclusive)
 * @returns A random float between min and max
 */
export function safeRandomFloat(min: number, max: number): number {
  try {
    return cryptoRandomFloat(min, max);
  } catch (error) {
    logger.warn('Crypto random float failed, falling back to Math.random', {
      error: error instanceof Error ? error.message : 'Unknown error',
      min,
      max,
    });
    return min + Math.random() * (max - min);
  }
}

/**
 * Get a random array index with crypto fallback
 * @param arrayLength The length of the array
 * @returns A random index between 0 and arrayLength-1
 */
export function safeRandomIndex(arrayLength: number): number {
  try {
    return cryptoRandomIndex(arrayLength);
  } catch (error) {
    logger.warn('Crypto random index failed, falling back to Math.random', {
      error: error instanceof Error ? error.message : 'Unknown error',
      arrayLength,
    });
    if (arrayLength <= 0) {
      throw new Error('Array length must be positive');
    }
    return Math.floor(Math.random() * arrayLength);
  }
}

/**
 * Monitor crypto operation failures
 */
let cryptoFailureCount = 0;
const CRYPTO_FAILURE_THRESHOLD = 10;

/**
 * Track crypto failures and alert if threshold exceeded
 */
function trackCryptoFailure(): void {
  cryptoFailureCount++;
  if (cryptoFailureCount === CRYPTO_FAILURE_THRESHOLD) {
    logger.error('Crypto operations repeatedly failing', {
      failureCount: cryptoFailureCount,
      message: 'Consider checking system crypto availability',
    });
  }
}

// Export versions that track failures
export function getSecureRandomBoolean(probabilityTrue: number = 0.5): boolean {
  try {
    return cryptoRandomBoolean(probabilityTrue);
  } catch (error) {
    trackCryptoFailure();
    logger.warn('Crypto random boolean failed, falling back to Math.random', {
      error: error instanceof Error ? error.message : 'Unknown error',
      probabilityTrue,
    });
    return Math.random() < probabilityTrue;
  }
}

export function getSecureRandomFloat(min: number, max: number): number {
  try {
    return cryptoRandomFloat(min, max);
  } catch (error) {
    trackCryptoFailure();
    logger.warn('Crypto random float failed, falling back to Math.random', {
      error: error instanceof Error ? error.message : 'Unknown error',
      min,
      max,
    });
    return min + Math.random() * (max - min);
  }
}

export function getSecureRandomIndex(arrayLength: number): number {
  try {
    return cryptoRandomIndex(arrayLength);
  } catch (error) {
    trackCryptoFailure();
    logger.warn('Crypto random index failed, falling back to Math.random', {
      error: error instanceof Error ? error.message : 'Unknown error',
      arrayLength,
    });
    if (arrayLength <= 0) {
      throw new Error('Array length must be positive');
    }
    return Math.floor(Math.random() * arrayLength);
  }
}
