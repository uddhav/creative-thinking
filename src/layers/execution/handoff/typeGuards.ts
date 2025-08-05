/**
 * Type guards for safe type checking in the LLM Handoff Bridge
 */

// Type guard for risk array
export function isRiskArray(
  data: unknown
): data is Array<{ description: string; severity?: string }> {
  return (
    Array.isArray(data) &&
    data.every(
      item =>
        typeof item === 'object' &&
        item !== null &&
        'description' in item &&
        typeof (item as { description: unknown }).description === 'string'
    )
  );
}

// Type guard for simple string array
export function isStringArray(data: unknown): data is string[] {
  return Array.isArray(data) && data.every(item => typeof item === 'string');
}

// Type guard for risk data (can be string or risk object)
export function getRiskDescription(risk: unknown): string {
  if (typeof risk === 'string') {
    return risk;
  }

  if (
    typeof risk === 'object' &&
    risk !== null &&
    'description' in risk &&
    typeof (risk as { description: unknown }).description === 'string'
  ) {
    return (risk as { description: string }).description;
  }

  return 'Unknown risk';
}

// Type guard for results object
export function isResultsObject(data: unknown): data is Record<string, unknown> {
  return typeof data === 'object' && data !== null && !Array.isArray(data);
}

// Extract risks safely from results
export function extractRisksFromResults(results: unknown): unknown[] {
  if (!isResultsObject(results)) {
    return [];
  }

  const risksData = results.risks;
  if (Array.isArray(risksData)) {
    return risksData;
  }

  return [];
}

// Safe risk count extraction
export function getRiskCount(results: unknown): number {
  const risks = extractRisksFromResults(results);
  return risks.length;
}

// Extract text content from various data types
export function extractTextContent(value: unknown): string[] {
  const textParts: string[] = [];

  if (typeof value === 'string') {
    textParts.push(value);
  } else if (Array.isArray(value)) {
    value.forEach(item => {
      if (typeof item === 'string') {
        textParts.push(item);
      } else if (typeof item === 'object' && item !== null && 'description' in item) {
        const desc = (item as { description?: unknown }).description;
        if (typeof desc === 'string') {
          textParts.push(desc);
        }
      }
    });
  }

  return textParts;
}
