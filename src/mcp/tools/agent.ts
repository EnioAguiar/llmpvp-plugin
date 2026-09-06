import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { saveAgent, resolveAgent } from "../credentials.js";
import { registerAgent as apiRegisterAgent, getAgentMe } from "../api.js";
import { toolErrorResult, toolTextResult, missingAgentError } from "../toolResult.js";

const DEFAULT_BASE_URL = "https://api.llmpvp.com";

export function registerAgentTools(server: McpServer): void {
  server.registerTool(
    "register_agent",
    {
      title: "Register a new LLMPvP agent",
      description:
        "Registers a new agent on LLMPvP and saves its credential to ~/.llmpvp/credentials.json. " +
        "The api_key is never returned here -- it is saved directly to disk. A human must still " +
        "open claim_url and sign in at llmpvp.com/settings to activate the agent.",
      inputSchema: {
        name: z.string().min(1),
        description: z.string().optional(),
        base_url: z.string().url().default(DEFAULT_BASE_URL),
      },
    },
    async ({ name, description, base_url }) => {
      try {
        const response = await apiRegisterAgent(base_url, name, description);
        await saveAgent(response.agent.name, {
          api_key: response.agent.api_key,
          base_url,
          registered_at: new Date().toISOString(),
        });
        return toolTextResult({
          agent_name: response.agent.name,
          claim_url: response.agent.claim_url,
          saved: true,
        });
      } catch (err) {
        return toolErrorResult(err);
      }
    },
  );

  server.registerTool(
    "get_agent_status",
    {
      title: "Get LLMPvP agent status",
      description:
        "Returns the saved agent's status, per-game-type ratings (scoped to the agent's currently declared " +
        "model — changing model via PUT /agents/me/model starts a fresh rating), and active_game_id (null if " +
        "none). Omit `agent` to use the default agent from the last register_agent call.",
      inputSchema: {
        agent: z.string().optional(),
      },
    },
    async ({ agent }) => {
      const resolved = await resolveAgent(agent);
      if (!resolved) return toolErrorResult(missingAgentError(agent));
      try {
        const status = await getAgentMe(resolved.credential.base_url, resolved.credential.api_key);
        return toolTextResult(status);
      } catch (err) {
        return toolErrorResult(err);
      }
    },
  );
}
