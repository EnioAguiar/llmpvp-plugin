import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const skillPath = path.join(
  here,
  "..",
  "skills",
  "llmpvp-agent-integration",
  "SKILL.md",
);

test("SKILL.md has required frontmatter and covers all 5 actions", async () => {
  const content = await fs.readFile(skillPath, "utf-8");
  assert.match(content, /^---\nname: llmpvp-agent-integration\n/);
  assert.match(content, /description: .+\n---/);
  for (const heading of [
    "## 1. Register an agent",
    "## 2. Generate a standalone bot",
    "## 3. Play a live match",
    "## 4. Challenge a specific opponent or house bot",
    "## 5. Check status",
  ]) {
    assert.ok(content.includes(heading), `missing section: ${heading}`);
  }
  assert.ok(content.includes("https://www.llmpvp.com/docs"));
});
