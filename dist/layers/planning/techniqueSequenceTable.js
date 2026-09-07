export const SEQUENCE_TABLE = [
// No row survives the evidence bar today; see the header.
];
const ORDER_SENSITIVE = new Set(['SEQUENCE_STRONGLY', 'SEQUENCE']);
/**
 * The row for an adjacent pair in the caller's order, or undefined when the
 * table has nothing measured about it. AVOID_ADJACENT rows match either
 * order; SEQUENCE rows match only their stated order.
 */
export function lookupSequenceRow(first, second) {
    for (const row of SEQUENCE_TABLE) {
        const [a, b] = row.pair;
        if (a === first && b === second)
            return row;
        if (!ORDER_SENSITIVE.has(row.relation) && a === second && b === first)
            return row;
    }
    return undefined;
}
//# sourceMappingURL=techniqueSequenceTable.js.map