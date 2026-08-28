/**
 * The call log both binaries write to.
 *
 * This lived as two private methods on `RequestHandlers`, which the MCP server
 * reaches and the CLI does not — `src/cli/commands/*.ts` call
 * `LateralThinkingServer` directly. So `CT_CALL_LOG` recorded nothing at all on
 * `socketes`, the surface the project notes call preferred for skill-driven
 * use, and an empty log read as "no gates fired" when it meant "nothing was
 * watching".
 *
 * Off unless `CT_CALL_LOG` is set, so it costs one undefined check otherwise.
 *
 * It exists because a record of what was called has to be written by the thing
 * being called: an agent asked to log its own calls writes what it believes it
 * sent, which is the same evidence as its prose and fails the same way. This is
 * the only version of that record that can contradict the caller.
 *
 * Failures are swallowed deliberately. A logging path that can take the server
 * down is worse than no logging, and in MCP mode stderr is the only place it
 * could complain to anyway.
 */
import { appendFileSync } from 'fs';
/** The text body of a tool response, or undefined if it has none. */
function textOf(content) {
    if (!Array.isArray(content))
        return undefined;
    const first = content[0];
    if (typeof first !== 'object' || first === null)
        return undefined;
    const text = first.text;
    return typeof text === 'string' ? text : undefined;
}
function append(line) {
    const path = process.env.CT_CALL_LOG;
    if (!path)
        return;
    try {
        appendFileSync(path, `${JSON.stringify(line)}\n`);
    }
    catch {
        /* never let logging break the call it is observing */
    }
}
/**
 * Record that a call was attempted.
 *
 * Written BEFORE validation on purpose: a call refused for its shape is
 * precisely what this is for, and a call with no matching result line is one
 * the server died during. Both are findings.
 */
export function recordCall(name, args) {
    append({ kind: 'call', tool: name, arguments: args });
}
/**
 * Record what the server actually told the caller.
 *
 * A summary, not the response. The measurement this exists for is whether a
 * steering signal changed what the caller did next, which needs the gates that
 * fired and nothing else. Logging the payload would put the caller's problem
 * statement and outputs on disk a second time, and a plan response alone
 * measured 62KB before #319.
 *
 * Recorded at emission rather than reconstructed by replaying the log later:
 * a replay records what the server says NOW, so every server change would
 * silently rewrite the history the analysis depends on.
 */
export function recordResult(name, response) {
    if (!process.env.CT_CALL_LOG)
        return;
    const summary = {
        kind: 'result',
        tool: name,
        isError: response.isError === true,
    };
    try {
        const text = textOf(response.content);
        if (text !== undefined) {
            const parsed = JSON.parse(text);
            // Identity, so calls can be grouped into sessions without a timestamp.
            if (typeof parsed.sessionId === 'string')
                summary.sessionId = parsed.sessionId;
            if (typeof parsed.planId === 'string')
                summary.planId = parsed.planId;
            if (typeof parsed.currentStep === 'number')
                summary.currentStep = parsed.currentStep;
            if (typeof parsed.technique === 'string')
                summary.technique = parsed.technique;
            // The steering signals themselves — gate and severity only, never the
            // message, which quotes caller content.
            const findings = parsed.advisoryFindings;
            if (Array.isArray(findings) && findings.length > 0) {
                summary.advisoryFindings = findings.map(f => {
                    const finding = f;
                    return { gate: finding.gate, severity: finding.severity };
                });
            }
            if (parsed.blocked === true)
                summary.blocked = true;
        }
    }
    catch {
        /* an unparseable body still deserves its result line */
    }
    append(summary);
}
//# sourceMappingURL=callLog.js.map