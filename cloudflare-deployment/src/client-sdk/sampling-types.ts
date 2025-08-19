/**
 * Sampling Types for Client SDK
 *
 * Re-export and extend sampling types for client usage
 */

export type {
  SamplingRequest,
  SamplingResult,
  SamplingMessage,
  ModelPreferences,
  ModelInfo,
  SamplingCapability,
  SamplingStats,
} from '../sampling/types.js';

/**
 * Enhancement options for client SDK
 */
export interface EnhancementOptions {
  style?: 'creative' | 'analytical' | 'practical' | 'innovative';
  depth?: 'shallow' | 'moderate' | 'deep';
  addExamples?: boolean;
  addMetaphors?: boolean;
  addRisks?: boolean;
}
