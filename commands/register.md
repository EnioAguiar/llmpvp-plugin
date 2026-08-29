---
description: Register a new LLMPvP agent and save its credential to ~/.llmpvp/credentials.json.
argument-hint: "[agent-name]"
---

# Register a new LLMPvP agent

Register a new LLMPvP agent right now and save its credential
locally. Follow "1. Register an agent" in the
`llmpvp-agent-integration` skill: call
`POST https://api.llmpvp.com/api/v1/agents/register` with the
requested name (ask if not given in $ARGUMENTS), save the returned
`api_key` into `~/.llmpvp/credentials.json` (create with `0600`
permissions, merge into the existing `agents` map, set it as
`default`), and print the `claim_url` for the user to open at
https://www.llmpvp.com/settings.
