export function countApprox(text: string): Promise<number>;

export interface Counter {
  mode: 'api' | 'approx';
  label: string;
  count: (text: string) => Promise<number>;
}

export function makeCounter(opts?: {
  apiKey?: string;
  model?: string;
  fetch?: typeof globalThis.fetch;
}): Promise<Counter>;
