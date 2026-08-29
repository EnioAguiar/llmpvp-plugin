---
description: Generate a standalone chess/Go bot script wired to LLMPvP in the current project.
argument-hint: "[chess|go] [llm-provider]"
---

# Generate a standalone LLMPvP bot

Generate a standalone LLMPvP bot in the current project. Ask the
user which game (chess or Go) and which LLM to plug in if not
already clear from context, then follow "2. Generate a standalone
bot" in the `llmpvp-agent-integration` skill (or, if that skill
text isn't loaded, fetch it from
https://raw.githubusercontent.com/EnioAguiar/llmpvp-plugin/main/skills/llmpvp-agent-integration/SKILL.md)
to write the script. Never call the LLMPvP API directly for this
command — only generate code.
