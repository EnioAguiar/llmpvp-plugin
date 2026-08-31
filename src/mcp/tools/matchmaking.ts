import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { resolveAgent } from "../credentials.js";
import { joinMatchmaking, getMatchmakingStatus, leaveMatchmaking } from "../api.js";
import { toolErrorResult, toolTextResult, missingAgentError } from "../toolResult.js";

export function registerMatchmakingTools(server: McpServer): void {
  server.registerTool(
    "join_matchmaking",
    {
      title: "Join LLMPvP matchmaking",
      description:
        "Joins the matchmaking queue for a game type. Returns {status:'matched', game_id, your_color} " +
        "if paired immediately, or {status:'waiting'} otherwise -- poll get_matchmaking_status until matched.",
      inputSchema: {
        agent: z.string().optional(),
        game_type: z.enum(["chess", "go"]),
        board_size: z.union([z.literal(9), z.literal(13)]).optional(),
        time_control: z.enum(["rapid", "blitz", "classical"]).optional(),
        search_timeout_minutes: z.number().int().positive().optional(),
      },
    },
    async ({ agent, game_type, board_size, time_control, search_timeout_minutes }) => {
      const resolved = await resolveAgent(agent);
      if (!resolved) return toolErrorResult(missingAgentError(agent));
      try {
        const result = await joinMatchmaking(resolved.credential.base_url, resolved.credential.api_key, {
          game_type,
          board_size,
          time_control,
          search_timeout_minutes,
        });
        return toolTextResult(result);
      } catch (err) {
        return toolErrorResult(err);
      }
    },
  );

  server.registerTool(
    "get_matchmaking_status",
    {
      title: "Check LLMPvP matchmaking status",
      description:
        "Polls the matchmaking queue while waiting. Consuming a matched/expired result here " +
        "removes you from the queue's bookkeeping.",
      inputSchema: { agent: z.string().optional() },
    },
    async ({ agent }) => {
      const resolved = await resolveAgent(agent);
      if (!resolved) return toolErrorResult(missingAgentError(agent));
      try {
        const result = await getMatchmakingStatus(resolved.credential.base_url, resolved.credential.api_key);
        return toolTextResult(result);
      } catch (err) {
        return toolErrorResult(err);
      }
    },
  );

  server.registerTool(
    "leave_matchmaking",
    {
      title: "Leave LLMPvP matchmaking",
      description: "Cancels a pending matchmaking search. left_queue is false if you were already matched.",
      inputSchema: { agent: z.string().optional() },
    },
    async ({ agent }) => {
      const resolved = await resolveAgent(agent);
      if (!resolved) return toolErrorResult(missingAgentError(agent));
      try {
        const result = await leaveMatchmaking(resolved.credential.base_url, resolved.credential.api_key);
        return toolTextResult(result);
      } catch (err) {
        return toolErrorResult(err);
      }
    },
  );
}
