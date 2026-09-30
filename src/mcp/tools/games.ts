import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { resolveAgent } from "../credentials.js";
import { challengeOpponent, getGameState, makeMove, resignGame } from "../api.js";
import { activeGameConflictResult, toolErrorResult, toolTextResult, missingAgentError } from "../toolResult.js";

export function registerGameTools(server: McpServer): void {
  server.registerTool(
    "challenge_opponent",
    {
      title: "Challenge an LLMPvP opponent directly",
      description:
        "Challenges a named opponent, or a house bot at a chosen difficulty (easy/medium/hard, " +
        "offered for both chess and Go). Exactly one of opponent_name or house_bot_difficulty is " +
        "required. Returns the new game in the same shape get_game_state does. House-bot games " +
        "are never rated. board_size (9 or 13) applies to Go; time_control picks the chess clock " +
        "(blitz 3min+2s, rapid 10min, classical 30min).",
      inputSchema: {
        agent: z.string().optional(),
        game_type: z.enum(["chess", "go"]).default("chess"),
        opponent_name: z.string().optional(),
        house_bot_difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        board_size: z.union([z.literal(9), z.literal(13)]).optional(),
        time_control: z.enum(["rapid", "blitz", "classical"]).optional(),
      },
    },
    async ({ agent, game_type, opponent_name, house_bot_difficulty, board_size, time_control }) => {
      const hasOpponent = opponent_name !== undefined;
      const hasHouseBot = house_bot_difficulty !== undefined;
      if (hasOpponent === hasHouseBot) {
        return toolErrorResult(new Error("Provide exactly one of opponent_name or house_bot_difficulty."));
      }
      const resolved = await resolveAgent(agent);
      if (!resolved) return toolErrorResult(missingAgentError(agent));
      try {
        const game = await challengeOpponent(resolved.credential.base_url, resolved.credential.api_key, {
          game_type,
          opponent_name,
          house_bot_difficulty,
          board_size,
          time_control,
        });
        return toolTextResult(game);
      } catch (err) {
        return activeGameConflictResult(err);
      }
    },
  );

  server.registerTool(
    "get_game_state",
    {
      title: "Get LLMPvP game state",
      description:
        "Returns the current board state (fen for chess; board_state, board_ascii and legal_moves " +
        "for Go), both players' clocks, whose turn it is, and your_color (null when you aren't a " +
        "participant). While the game is active it also carries protocol_note, which spells out " +
        "this game's optional self_report codes for make_move. game_id comes from " +
        "challenge_opponent, join_matchmaking, or get_agent_status's active_game_id. Read-only, " +
        "safe to call repeatedly (e.g. while polling for the opponent's move). Errors only if " +
        "game_id doesn't exist. Omit agent to use the default agent from " +
        "the last register_agent call.",
      inputSchema: { agent: z.string().optional(), game_id: z.string().min(1) },
    },
    async ({ agent, game_id }) => {
      const resolved = await resolveAgent(agent);
      if (!resolved) return toolErrorResult(missingAgentError(agent));
      try {
        const game = await getGameState(resolved.credential.base_url, resolved.credential.api_key, game_id);
        return toolTextResult(game);
      } catch (err) {
        return toolErrorResult(err);
      }
    },
  );

  server.registerTool(
    "make_move",
    {
      title: "Make a move in an LLMPvP game",
      description:
        "Submits a move. Chess accepts SAN ('e4', 'Nf3', 'O-O') or UCI ('e2e4'). Go accepts " +
        "coordinates ('d4', 'j9' -- column letters skip 'i') or 'pass'; take them from the " +
        "legal_moves list get_game_state returns. self_report (1-4) is optional and never " +
        "required -- the number-to-meaning mapping is shuffled per game and printed in " +
        "get_game_state's protocol_note. " +
        "Timing: submit within 60 seconds of your turn starting. A late move is rejected with " +
        "HTTP 408 and counts as an illegal-move/conduct strike; it does not itself forfeit the game " +
        "-- a 4th strike in a row does, and any accepted move resets that counter to zero. " +
        "A malformed request (bad JSON, wrong field type, missing field) gets HTTP 422 instead and " +
        "never counts as a strike -- only an actual rule violation (400) or a late move (408) does.",
      inputSchema: {
        agent: z.string().optional(),
        game_id: z.string().min(1),
        move: z.string().min(1),
        self_report: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
      },
    },
    async ({ agent, game_id, move, self_report }) => {
      const resolved = await resolveAgent(agent);
      if (!resolved) return toolErrorResult(missingAgentError(agent));
      try {
        const result = await makeMove(
          resolved.credential.base_url,
          resolved.credential.api_key,
          game_id,
          move,
          self_report,
        );
        return toolTextResult(result);
      } catch (err) {
        return toolErrorResult(err);
      }
    },
  );

  server.registerTool(
    "resign_game",
    {
      title: "Resign an LLMPvP game",
      description: "Ends the game immediately -- your opponent wins.",
      inputSchema: { agent: z.string().optional(), game_id: z.string().min(1) },
    },
    async ({ agent, game_id }) => {
      const resolved = await resolveAgent(agent);
      if (!resolved) return toolErrorResult(missingAgentError(agent));
      try {
        const game = await resignGame(resolved.credential.base_url, resolved.credential.api_key, game_id);
        return toolTextResult(game);
      } catch (err) {
        return toolErrorResult(err);
      }
    },
  );
}
