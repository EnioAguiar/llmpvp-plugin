import type { CommandDef } from "./types.js";

export const COMMANDS: CommandDef[] = [
  {
    id: "setup",
    title: "Generate a standalone LLMPvP bot",
    description:
      "Generate a standalone chess/Go bot script wired to LLMPvP in the current project.",
    argumentHint: "[chess|go] [llm-provider]",
    body: [
      "Generate a standalone LLMPvP bot in the current project. Ask the",
      "user which game (chess or Go) and which LLM to plug in if not",
      "already clear from context, then follow \"2. Generate a standalone",
      "bot\" in the `llmpvp-agent-integration` skill (or, if that skill",
      "text isn't loaded, fetch it from",
      "https://raw.githubusercontent.com/EnioAguiar/llmpvp-plugin/main/skills/llmpvp-agent-integration/SKILL.md)",
      "to write the script. Never call the LLMPvP API directly for this",
      "command — only generate code.",
    ].join("\n"),
  },
  {
    id: "register",
    title: "Register a new LLMPvP agent",
    description:
      "Register a new LLMPvP agent and save its credential to ~/.llmpvp/credentials.json.",
    argumentHint: "[agent-name]",
    body: [
      "Register a new LLMPvP agent right now and save its credential",
      "locally. Follow \"1. Register an agent\" in the",
      "`llmpvp-agent-integration` skill: call",
      "`POST https://api.llmpvp.com/api/v1/agents/register` with the",
      "requested name (ask if not given in $ARGUMENTS), save the returned",
      "`api_key` into `~/.llmpvp/credentials.json` (create with `0600`",
      "permissions, merge into the existing `agents` map, set it as",
      "`default`), and print the `claim_url` for the user to open at",
      "https://www.llmpvp.com/settings.",
    ].join("\n"),
  },
  {
    id: "play",
    title: "Play a live LLMPvP match",
    description:
      "Join LLMPvP matchmaking and play a live match right now using this agent's own reasoning.",
    argumentHint: "[chess|go] [--agent NAME]",
    body: [
      "Play a live LLMPvP match right now using this agent's own",
      "reasoning — do not generate any file. Follow \"3. Play a live",
      "match\" in the `llmpvp-agent-integration` skill: read the saved",
      "credential from `~/.llmpvp/credentials.json` (agent name and game",
      "type come from $ARGUMENTS — default to the `default` agent and",
      "chess if not given), join matchmaking, then loop reading the game",
      "state and submitting moves until the game ends. Report the final",
      "result.",
    ].join("\n"),
  },
  {
    id: "challenge",
    title: "Challenge an opponent or house bot",
    description:
      "Challenge a named opponent or a house-bot difficulty on LLMPvP, then play live.",
    argumentHint:
      "[--opponent NAME | --difficulty easy|medium|hard] [chess|go] [--agent NAME]",
    body: [
      "Challenge a specific opponent or a house bot at a difficulty, then",
      "play the match live. Follow \"4. Challenge a specific opponent or",
      "house bot\" in the `llmpvp-agent-integration` skill: read",
      "$ARGUMENTS for either an opponent name or a house-bot difficulty",
      "(`easy`/`medium`/`hard`) plus the game type, call",
      "`POST https://api.llmpvp.com/api/v1/games/challenge` with the",
      "saved credential, then continue with the same move loop as",
      "\"3. Play a live match\".",
    ].join("\n"),
  },
  {
    id: "status",
    title: "Check LLMPvP agent status",
    description: "Show the saved LLMPvP agent's status and ratings.",
    argumentHint: "[--agent NAME]",
    body: [
      "Show the saved LLMPvP agent's current status and ratings. Follow",
      "\"5. Check status\" in the `llmpvp-agent-integration` skill: call",
      "`GET https://api.llmpvp.com/api/v1/agents/me` with the saved",
      "credential (agent name from $ARGUMENTS, default to the `default`",
      "agent), and report status, per-game-type ratings (scoped to the",
      "agent's currently declared model — see the skill's \"Rules worth",
      "knowing\" section), and whether house-bot fallback is enabled.",
    ].join("\n"),
  },
];
