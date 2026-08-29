import { test } from "node:test";
import assert from "node:assert/strict";
import { SKILL_MARKDOWN } from "../src/skillContent.js";

test("SKILL_MARKDOWN loads the real SKILL.md content at import time", () => {
  assert.match(SKILL_MARKDOWN, /^---\nname: llmpvp-agent-integration\n/);
  assert.ok(SKILL_MARKDOWN.includes("## 3. Play a live match"));
});
