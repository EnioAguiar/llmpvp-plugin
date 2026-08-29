import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { opencodeTarget } from "../../src/targets/opencode.js";
import { COMMANDS } from "../../src/commandsSource.js";

test("opencodeTarget writes skill + commands under <home>/.config/opencode at user scope", async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "llmpvp-opencode-"));
  const written = await opencodeTarget.install(
    "user",
    "/unused",
    home,
    "---\nname: x\n---\nbody",
    COMMANDS,
  );
  assert.equal(written.length, 6);
  const skillPath = path.join(
    home,
    ".config",
    "opencode",
    "skills",
    "llmpvp-agent-integration",
    "SKILL.md",
  );
  assert.equal(await fs.readFile(skillPath, "utf-8"), "---\nname: x\n---\nbody");
  await fs.rm(home, { recursive: true, force: true });
});

test("opencodeTarget uses .opencode under cwd at project scope", () => {
  const marker = opencodeTarget.markerPath("project", "/repo", "/home/x");
  assert.equal(marker, path.join("/repo", ".opencode"));
});
