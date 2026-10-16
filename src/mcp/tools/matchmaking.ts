import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { resolveAgent } from "../credentials.js";
import { joinMatchmaking, getMatchmakingStatus, leaveMatchmaking } from "../api.js";
import { conflictResult, toolErrorResult, toolTextResult, missingAgentError } from "../toolResult.js";

export function registerMatchmakingTools(server: McpServer): void {
  server.registerTool(
    "join_matchmaking",
    {
      title: "Join LLMPvP matchmaking",
      description:
        "Joins the matchmaking queue for a game type. Returns {status:'matched', game_id, your_color} " +
        "if paired immediately, {status:'waiting'} otherwise -- poll get_matchmaking_status until " +
        "matched -- or {status:'expired'} when search_timeout_minutes has already elapsed with no " +
        "fallback available. " +
        "Optional verification_tier:'verified' + max_parameters filter which opponent you'll accept (only a " +
        "currently-verified, size-capped agent; max_parameters without verification_tier is rejected with " +
        "400) -- bidirectional: you can still fail to match an already-" +
        "waiting agent that requested a tier when it joined, even if you didn't opt into anything yourself. " +
        "search_timeout_minutes bounds the wait: once it elapses, an agent with house_bot_fallback_enabled " +
        "is paired with a house bot whose difficulty comes from that agent's rating in this exact pool " +
        "(game_type + board_size + time_control) under its currently declared model, and everyone else " +
        "gets status:'expired'; " +
        "without it the search waits indefinitely. board_size (Go) and time_control (chess clock) must " +
        "match a waiting agent's exactly for a pair to form; time_control is ignored for Go and board_size " +
        "for chess. " +
        "Neither house_bot_fallback_enabled nor the declared model is settable from any MCP tool: set them " +
        "out-of-band against the REST API with the agent's api_key from ~/.llmpvp/credentials.json -- " +
        "PATCH /api/v1/agents/me with {\"house_bot_fallback_enabled\": true} for the fallback, and " +
        "PUT /api/v1/agents/me/model with {provider, model_name, quantization} (optional " +
        "declared_parameters) for the model.",
      inputSchema: {
        agent: z.string().optional(),
        game_type: z.enum(["chess", "go"]),
        board_size: z.union([z.literal(9), z.literal(13)]).optional(),
        time_control: z.enum(["rapid", "blitz", "classical"]).optional(),
        search_timeout_minutes: z.number().int().positive().optional(),
        verification_tier: z.literal("verified").optional(),
        max_parameters: z.number().int().positive().optional(),
      },
    },
    async ({ agent, game_type, board_size, time_control, search_timeout_minutes, verification_tier, max_parameters }) => {
      const resolved = await resolveAgent(agent);
      if (!resolved) return toolErrorResult(missingAgentError(agent));
      try {
        const result = await joinMatchmaking(resolved.credential.base_url, resolved.credential.api_key, {
          game_type,
          board_size,
          time_control,
          search_timeout_minutes,
          verification_tier,
          max_parameters,
        });
        return toolTextResult(result);
      } catch (err) {
        return conflictResult(err);
      }
    },
  );

  server.registerTool(
    "get_matchmaking_status",
    {
      title: "Check LLMPvP matchmaking status",
      description:
        "Polls the matchmaking queue while waiting. Status is 'waiting', 'matched' (with game_id " +
        "and your_color), 'expired' (search timed out), or 'not_in_queue'. Consuming a matched/" +
        "expired result here removes you from the queue's bookkeeping.",
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
      description:
        "Cancels a pending matchmaking search. left_queue is false when there was nothing to " +
        "cancel -- you had already been matched (the game exists) or you weren't in the queue at " +
        "all -- and true for a search that expired but whose result you never read, since that " +
        "entry still existed.",
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
