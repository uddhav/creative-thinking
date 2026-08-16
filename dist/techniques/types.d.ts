/**
 * Common types and interfaces for technique handlers
 */
/**
 * Step types for reflexivity tracking
 */
export type StepType = 'thinking' | 'action';
export declare function firstSentence(text: string): string;
/**
 * A readable rendering of a structured field a step recorded.
 *
 * An insight keyed to a field's mere presence — "Strategic response formulated
 * based on weak signal analysis" — reports nothing the session produced: it
 * says only that the field was non-empty. These fields arrive as a string, an
 * array or a free-form object depending on the caller, so render whichever
 * shape turned up rather than throwing the content away.
 *
 * Returns '' when there is no content to show, so callers can skip it.
 */
export declare function describeStructuredField(value: unknown): string;
/**
 * Reflexive effects that occur after action steps
 */
export interface ReflexiveEffects {
    triggers: string[];
    realityChanges: string[];
    futureConstraints: string[];
    reversibility: 'high' | 'medium' | 'low' | 'very_low';
}
/**
 * Enhanced step information with reflexivity awareness
 */
export interface StepInfo {
    name: string;
    focus: string;
    emoji: string;
    type?: StepType;
    /**
     * How hard this step is to undo once taken.
     *
     * A thinking step declares it here, because it has no `reflexiveEffects` to
     * carry it: an empty `realityChanges`/`futureConstraints` block would assert
     * the step changes reality when analysing something does not. An action step
     * may instead declare it inside `reflexiveEffects`, where it sits next to the
     * changes that make it hard to undo.
     *
     * So a reader wanting one answer per step takes
     * `reversibility ?? reflexiveEffects?.reversibility` — this field first,
     * because a step that states it directly means the statement to stand.
     */
    reversibility?: 'low' | 'medium' | 'high';
    reflexiveEffects?: ReflexiveEffects;
}
export interface TechniqueInfo {
    name: string;
    emoji: string;
    totalSteps: number;
    description: string;
    focus?: string;
    enhancedFocus?: string;
    parallelSteps?: {
        canParallelize: boolean;
        dependencies?: Array<[number, number]>;
        description?: string;
    };
    reflexivityProfile?: {
        primaryCommitmentType: 'relationship' | 'path' | 'structural' | 'behavioral' | 'technical' | 'strategic' | 'environmental' | 'perceptual' | 'exploratory' | 'observational';
        overallReversibility: 'high' | 'medium' | 'low' | 'very_low';
        riskLevel: 'low' | 'medium' | 'high';
    };
}
/**
 * What the session has already established, for handlers whose guidance depends
 * on it. Optional throughout: a handler that ignores it — which is all but one —
 * needs no change, and a caller that omits it gets the guidance it got before.
 *
 * It exists because `random_entry` carried some ninety lines of Rory Mode
 * guidance behind a third parameter that no call site passed. The branch was
 * unreachable while `roryMode` stayed a documented, strictly-validated input
 * and its own insight extraction read the flag.
 */
export interface StepGuidanceContext {
    roryMode?: boolean;
}
/**
 * One recorded step, as a handler sees it.
 *
 * Declared as `{ output?: string }` until now, which understated the contract
 * badly enough that passing a step number was a type error — while all
 * thirty-two handlers read `currentStep` to let a revision supersede the entry
 * it revises, and most read fields of their own besides. The narrow shape was
 * invisible because tests are not typechecked.
 *
 * Handlers declare their own narrower shapes naming the fields they actually
 * read; method parameter bivariance is what lets them. The index signature
 * carries the technique-specific fields — `hatColor`, `connections`,
 * `coherenceScore` and the rest — which are exactly what a handler is reading
 * when it does more than echo the output back.
 */
export interface HistoryEntry {
    output?: string;
    /** The step within its own technique — see `techniqueLocalStep`. */
    currentStep?: number;
    technique?: string;
    timestamp?: string;
    isRevision?: boolean;
    /** Whatever else the technique recorded for this step. */
    [field: string]: unknown;
}
export interface TechniqueHandler {
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string, context?: StepGuidanceContext): string;
    validateStep(step: number, data: unknown): boolean;
    extractInsights(history: HistoryEntry[]): string[];
}
export declare abstract class BaseTechniqueHandler implements TechniqueHandler {
    abstract getTechniqueInfo(): TechniqueInfo;
    abstract getStepInfo(step: number): StepInfo;
    abstract getStepGuidance(step: number, problem: string, context?: StepGuidanceContext): string;
    validateStep(step: number, _data: unknown): boolean;
    extractInsights(history: Array<{
        output?: string;
    }>): string[];
}
//# sourceMappingURL=types.d.ts.map