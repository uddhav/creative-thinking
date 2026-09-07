/**
 * Adjacent-pair sequence advice, from measured evidence only (#240).
 *
 * The planner keeps the caller's technique order and reports, per adjacent
 * pair, what is known about running them back to back. Four relations are
 * typed; how many are populated is a fact about the evidence, not the design.
 *
 * Evidence bar, from the file the citations point at
 * (`evals/evidence/technique-contrasts.md`): a claim counts as measured only
 * when both techniques were run end to end on one shared problem and their
 * products compared. Claims argued from guidance text alone are excluded;
 * that file's own method section records that every such claim it tested
 * was unreliable. This is why the "contradiction cluster shares a middle"
 * finding, a reading of guidance text, seeds nothing here.
 *
 * NEUTRAL is never written as a row. It is what a pair with no row reports,
 * and it means "no adjacency relation measured", never "measured
 * compatible"; the `evidence: 'none'` field on the advice says which. The
 * evidence file's distinguishability runs (five pairs found to be different
 * tools, plus the re-measurement) are not adjacency measurements and seed
 * nothing.
 *
 * SEQUENCE_STRONGLY and SEQUENCE are order-sensitive when populated (a then
 * b); AVOID_ADJACENT is symmetric. No row may carry a number: the relation is
 * ordinal, and a decimal here would be the invented effectiveness figure the
 * discovery scale already refuses.
 */
import type { LateralTechnique } from '../../types/index.js';
import type { SequenceRelation } from '../../types/planning.js';
export interface SequenceTableRow {
    pair: [LateralTechnique, LateralTechnique];
    relation: Exclude<SequenceRelation, 'NEUTRAL'>;
    /** A path and anchor into evals/evidence/, resolved by the scale guard. */
    citation: string;
    /** What the evidence showed, and how far it reaches. */
    note: string;
}
export declare const SEQUENCE_TABLE: readonly SequenceTableRow[];
/**
 * The row for an adjacent pair in the caller's order, or undefined when the
 * table has nothing measured about it. AVOID_ADJACENT rows match either
 * order; SEQUENCE rows match only their stated order.
 */
export declare function lookupSequenceRow(first: LateralTechnique, second: LateralTechnique): SequenceTableRow | undefined;
//# sourceMappingURL=techniqueSequenceTable.d.ts.map