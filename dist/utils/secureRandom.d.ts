/**
 * Secure random number generation utilities
 * Uses crypto.getRandomValues() for cryptographically secure randomness
 */
/**
 * Get a cryptographically secure random integer for array index selection
 * @param arrayLength The length of the array
 * @returns A random index between 0 and arrayLength-1
 */
export declare function getSecureRandomIndex(arrayLength: number): number;
/**
 * Get a cryptographically secure random float in range [min, max)
 * @param min Minimum value (inclusive)
 * @param max Maximum value (exclusive)
 * @returns A random float between min and max
 */
export declare function getSecureRandomFloat(min: number, max: number): number;
/**
 * Get a cryptographically secure random boolean
 * @param probabilityTrue Probability of returning true (default 0.5)
 * @returns A random boolean
 */
export declare function getSecureRandomBoolean(probabilityTrue?: number): boolean;
//# sourceMappingURL=secureRandom.d.ts.map