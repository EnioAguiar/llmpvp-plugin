import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { agentsUniversalTarget } from "../../src/targets/agentsUniversal.js";
import { COMMANDS } from "../../src/commandsSource.js";

test("agentsUniversalTarget is always installed regardless of scope", () => {
  assert.equal(agentsUniversalTarget.alwaysInstall, true);
  assert.equal(agentsUniversalTarget.markerPath("user", "/x", "/home"), null);
  assert.equal(agentsUniversalTarget.markerPath("project", "/x", "/home"), null);
});

test("agentsUniversalTarget writes only the skill file, no commands", async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "llmpvp-agents-"));
  const written = await agentsUniversalTarget.install(
    "user",
    "/unused",
    home,
    "---\nname: x\n---\nbody",
    COMMANDS,
  );
  assert.equal(written.length, 1);
  assert.equal(written[0].kind, "skill");
  const skillPath = path.join(
    home,
    ".agents",
    "skills",
    "llmpvp-agent-integration",
    "SKILL.md",
  );
  assert.equal(await fs.readFile(skillPath, "utf-8"), "---\nname: x\n---\nbody");
  await fs.rm(home, { recursive: true, force: true });
});
