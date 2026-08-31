import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAgentTools } from "./tools/agent.js";
import { registerMatchmakingTools } from "./tools/matchmaking.js";
import { registerGameTools } from "./tools/games.js";

export function buildMcpServer(): McpServer {
  const server = new McpServer({ name: "llmpvp", version: "0.1.0" });
  registerAgentTools(server);
  registerMatchmakingTools(server);
  registerGameTools(server);
  return server;
}

export async function runMcpServer(): Promise<void> {
  const server = buildMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
