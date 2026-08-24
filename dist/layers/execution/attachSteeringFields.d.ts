/**
 * Attach server-authored fields to an already-serialized step response.
 *
 * Some fields must survive the response builder's verbosity filter because
 * they are steering or status, not an echo of the caller's own input:
 * advisory findings, and the auto-save status. The builder slims its payload
 * to a keep-list before serializing, so those fields are merged here, after
 * the filter has run — the same mechanism the auto-save path established,
 * named once instead of copy-pasted per field.
 *
 * A no-op when `fields` is empty, so quiet steps pay nothing.
 */
import type { LateralThinkingResponse } from '../../types/index.js';
export declare function attachSteeringFields(response: LateralThinkingResponse, fields: Record<string, unknown>): void;
//# sourceMappingURL=attachSteeringFields.d.ts.map