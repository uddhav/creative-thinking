export type ReleaseAction = 'release' | 'bump' | 'none' | 'error';

export interface ReleaseDecision {
  action: ReleaseAction;
  version?: string;
  reason?: string;
}

export function parseVersion(v: string | undefined): [number, number, number] | null;

export function decide(input: {
  next?: string;
  current?: string;
  openBumpVersion?: string;
}): ReleaseDecision;

export function openBumpVersionFrom(
  prs: Array<{ headRefName: string; title: string; mergeable?: string }>
): string | undefined;
