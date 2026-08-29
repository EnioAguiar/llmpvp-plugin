import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { codexTarget } from "../../src/targets/codex.js";
import { COMMANDS } from "../../src/commandsSource.js";

test("codexTarget writes only the skill, never commands", async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "llmpvp-codex-"));
  const written = await codexTarget.install(
    "user",
    "/unused",
    home,
    "---\nname: x\n---\nbody",
    COMMANDS,
  );
  assert.equal(written.length, 1);
  assert.equal(written[0].kind, "skill");
  assert.equal(
    written[0].path,
    path.join(home, ".codex", "skills", "llmpvp-agent-integration", "SKILL.md"),
  );
  assert.equal(codexTarget.supportsCommands, false);
  await fs.rm(home, { recursive: true, force: true });
});
