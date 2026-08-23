/**
 * Planning layer type definitions
 */
/**
 * The caller-declared shape of the problem's stuckness ("crux"). Six values,
 * deliberately no 'other' — an absent crux is an absent param. PROVISIONAL
 * until P6 launches; renames after that carry a versioned mapping, because
 * cross-session priors will be keyed on these strings.
 */
export const CRUX_VALUES = [
    'framing',
    'contested',
    'generation',
    'evaluation',
    'risk',
    'path',
];
//# sourceMappingURL=planning.js.map