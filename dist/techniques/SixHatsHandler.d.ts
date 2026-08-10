/**
 * Six Thinking Hats technique handler
 */
import type { SixHatsColor } from '../types/index.js';
import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';
interface HatInfo {
    name: string;
    focus: string;
    emoji: string;
    enhancedFocus: string;
}
export declare class SixHatsHandler extends BaseTechniqueHandler {
    private readonly hats;
    private readonly hatOrder;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): HatInfo;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    /**
     * Report what each hat actually surfaced, labelled by the hat.
     *
     * This reads `entry.output`. Gating on vocabulary — reporting a Green Hat
     * finding only when the text happens to contain "could" or "might", a Red Hat
     * one only on "concern" or "worry" — silently drops everything phrased another
     * way, so a session of substantive hat outputs can return nothing at all. The
     * absence of a keyword is not the absence of a finding.
     *
     * The hat is derived from the step, not demanded from the caller. `hatColor`
     * is optional, and `validateStep` accepts it only when it equals
     * `hatOrder[step - 1]` — so the step already determines the hat. Yet a
     * session that omitted the field got no insights at all, from any hat,
     * including the Black Hat's enumerated risks. A caller should not lose the
     * whole technique for withholding a value the server can compute. An
     * explicit `hatColor` still wins, which keeps a history that carries no step
     * numbers working as before.
     */
    extractInsights(history: Array<{
        currentStep?: number;
        hatColor?: string;
        risks?: string[];
        output?: string;
    }>): string[];
    getHatColor(step: number): SixHatsColor;
    getAllHats(): Record<SixHatsColor, HatInfo>;
}
export {};
//# sourceMappingURL=SixHatsHandler.d.ts.map