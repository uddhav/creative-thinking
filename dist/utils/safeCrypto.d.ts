/**
 * Safe wrappers for cryptographic operations with fallback
 * Provides graceful degradation when crypto operations fail
 */
/**
 * Get a random boolean with crypto fallback
 * @param probabilityTrue Probability of returning true (default 0.5)
 * @returns A random boolean
 */
export declare function safeRandomBoolean(probabilityTrue?: number): boolean;
/**
 * Get a random float with crypto fallback
 * @param min Minimum value (inclusive)
 * @param max Maximum value (exclusive)
 * @returns A random float between min and max
 */
export declare function safeRandomFloat(min: number, max: number): number;
/**
 * Get a random array index with crypto fallback
 * @param arrayLength The length of the array
 * @returns A random index between 0 and arrayLength-1
 */
export declare function safeRandomIndex(arrayLength: number): number;
export declare function getSecureRandomBoolean(probabilityTrue?: number): boolean;
export declare function getSecureRandomFloat(min: number, max: number): number;
export declare function getSecureRandomIndex(arrayLength: number): number;
//# sourceMappingURL=safeCrypto.d.ts.map