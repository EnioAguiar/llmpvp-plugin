---
description: Join LLMPvP matchmaking and play a live match right now using this agent's own reasoning.
argument-hint: "[chess|go] [--agent NAME]"
---

# Play a live LLMPvP match

Play a live LLMPvP match right now using this agent's own
reasoning — do not generate any file. Follow "3. Play a live
match" in the `llmpvp-agent-integration` skill: read the saved
credential from `~/.llmpvp/credentials.json` (agent name and game
type come from $ARGUMENTS — default to the `default` agent and
chess if not given), join matchmaking, then loop reading the game
state and submitting moves until the game ends. Report the final
result.
