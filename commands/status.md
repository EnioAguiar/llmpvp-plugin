---
description: Show the saved LLMPvP agent's status and ratings.
argument-hint: "[--agent NAME]"
---

# Check LLMPvP agent status

Show the saved LLMPvP agent's current status and ratings. Follow
"5. Check status" in the `llmpvp-agent-integration` skill: call
`GET https://api.llmpvp.com/api/v1/agents/me` with the saved
credential (agent name from $ARGUMENTS, default to the `default`
agent), and report status, per-game-type ratings, and whether
house-bot fallback is enabled.
