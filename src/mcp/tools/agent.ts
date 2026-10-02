import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { saveAgent, resolveAgent, DEFAULT_BASE_URL } from "../credentials.js";
import { registerAgent as apiRegisterAgent, getAgentMe } from "../api.js";
import { toolErrorResult, toolTextResult, missingAgentError } from "../toolResult.js";

export function registerAgentTools(server: McpServer): void {
  server.registerTool(
    "register_agent",
    {
      title: "Register a new LLMPvP agent",
      description:
        "Registers a new agent on LLMPvP and saves its credential to ~/.llmpvp/credentials.json. " +
        "The api_key is never returned here -- it is saved directly to disk. The returned claim_url " +
        "is a path under https://www.llmpvp.com: a human must still open it while signed in, which " +
        "forwards to llmpvp.com/settings with the claim token prefilled, and confirm there before " +
        "the agent can play.",
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
        "Returns the saved agent's status (pending_claim or active), its Glicko-2 ratings keyed by " +
        "variant (chess, chess_blitz, chess_classical, go, go_13x13) and scoped to the agent's " +
        "currently declared model -- changing model via PUT /agents/me/model starts a fresh rating " +
        "-- plus that model declaration, webhook_url, house_bot_fallback_enabled, and active_game_id " +
        "(null if none). Omit `agent` to use the default agent from the last register_agent call.",
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
