/**
 * Type guards for safe type checking in the LLM Handoff Bridge
 */
// Type guard for risk array
export function isRiskArray(data) {
    return (Array.isArray(data) &&
        data.every(item => typeof item === 'object' &&
            item !== null &&
            'description' in item &&
            typeof item.description === 'string'));
}
// Type guard for simple string array
export function isStringArray(data) {
    return Array.isArray(data) && data.every(item => typeof item === 'string');
}
// Type guard for risk data (can be string or risk object)
export function getRiskDescription(risk) {
    if (typeof risk === 'string') {
        return risk;
    }
    if (typeof risk === 'object' &&
        risk !== null &&
        'description' in risk &&
        typeof risk.description === 'string') {
        return risk.description;
    }
    return 'Unknown risk';
}
// Type guard for results object
export function isResultsObject(data) {
    return typeof data === 'object' && data !== null && !Array.isArray(data);
}
// Extract risks safely from results
export function extractRisksFromResults(results) {
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
export function getRiskCount(results) {
    const risks = extractRisksFromResults(results);
    return risks.length;
}
// Extract text content from various data types
export function extractTextContent(value) {
    const textParts = [];
    if (typeof value === 'string') {
        textParts.push(value);
    }
    else if (Array.isArray(value)) {
        value.forEach(item => {
            if (typeof item === 'string') {
                textParts.push(item);
            }
            else if (typeof item === 'object' &&
                item !== null &&
                'description' in item) {
                const desc = item.description;
                if (typeof desc === 'string') {
                    textParts.push(desc);
                }
            }
        });
    }
    return textParts;
}
//# sourceMappingURL=typeGuards.js.map