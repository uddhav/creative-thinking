/**
 * Build one MCP protocol server wired to a shared engine.
 *
 * An SDK `Server` connects to exactly one transport. stdio has one transport
 * for the life of the process, so it builds one of these. The HTTP transport
 * is stateless and builds one per request (see `./httpTransport.ts`). Either
 * way the `LateralThinkingServer` engine is shared, so plans and sessions do
 * not depend on which protocol server handled the call.
 *
 * No side effects: importing this module starts nothing.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { RequestHandlers } from './RequestHandlers.js';
import { getVersion } from '../version.js';
export function createMcpServer(lateralServer) {
    const server = new Server({
        name: 'creative-thinking',
        version: getVersion(),
    }, {
        capabilities: {
            tools: {},
            prompts: {},
        },
    });
    const requestHandlers = new RequestHandlers(server, lateralServer);
    requestHandlers.setupHandlers();
    return { server, requestHandlers };
}
//# sourceMappingURL=createMcpServer.js.map