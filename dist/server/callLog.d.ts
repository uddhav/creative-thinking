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
interface ToolResponse {
    content: unknown;
    isError?: boolean;
}
/**
 * Record that a call was attempted.
 *
 * Written BEFORE validation on purpose: a call refused for its shape is
 * precisely what this is for, and a call with no matching result line is one
 * the server died during. Both are findings.
 */
export declare function recordCall(name: string, args: unknown): void;
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
export declare function recordResult(name: string, response: ToolResponse): void;
export {};
//# sourceMappingURL=callLog.d.ts.map