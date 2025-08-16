/**
 * Secure random number generation utilities
 * Uses crypto.getRandomValues() for cryptographically secure randomness
 */
import { randomBytes } from 'crypto';
import { ValidationError, ErrorCode } from '../errors/types.js';
/**
 * Get a cryptographically secure random integer for array index selection
 * Uses rejection sampling to avoid modulo bias
 * @param arrayLength The length of the array
 * @returns A random index between 0 and arrayLength-1
 */
export function getSecureRandomIndex(arrayLength) {
    if (arrayLength <= 0) {
        throw new ValidationError(ErrorCode.INVALID_FIELD_VALUE, 'Array length must be positive', 'arrayLength', { providedValue: arrayLength, requirement: 'positive integer' });
    }
    // Use rejection sampling to avoid modulo bias
    // Find the largest multiple of arrayLength that fits in the range
    if (arrayLength <= 256) {
        // For small arrays, use a single byte
        const max = 256 - (256 % arrayLength); // Largest multiple of arrayLength <= 256
        let value;
        do {
            const buffer = randomBytes(1);
            value = buffer[0];
        } while (value >= max);
        return value % arrayLength;
    }
    else {
        // For larger arrays, use 32-bit value
        const max = 0x100000000 - (0x100000000 % arrayLength); // Largest multiple <= 2^32
        let value;
        do {
            const buffer = randomBytes(4);
            value = buffer.readUInt32BE(0);
        } while (value >= max);
        return value % arrayLength;
    }
}
/**
 * Get a cryptographically secure random float in range [min, max)
 * @param min Minimum value (inclusive)
 * @param max Maximum value (exclusive)
 * @returns A random float between min and max
 */
export function getSecureRandomFloat(min, max) {
    if (min >= max) {
        throw new ValidationError(ErrorCode.INVALID_FIELD_VALUE, 'Min value must be less than max value', 'min/max', { min, max, requirement: 'min < max' });
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
export function getSecureRandomBoolean(probabilityTrue = 0.5) {
    if (probabilityTrue < 0 || probabilityTrue > 1) {
        throw new ValidationError(ErrorCode.INVALID_FIELD_VALUE, 'Probability must be between 0 and 1 (inclusive)', 'probabilityTrue', { providedValue: probabilityTrue, validRange: '[0, 1]' });
    }
    return getSecureRandomFloat(0, 1) < probabilityTrue;
}
//# sourceMappingURL=secureRandom.js.map