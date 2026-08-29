import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { claudeTarget } from "../../src/targets/claude.js";
import { COMMANDS } from "../../src/commandsSource.js";

test("claudeTarget writes skill + 5 commands under <home>/.claude at user scope", async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "llmpvp-claude-"));
  const written = await claudeTarget.install(
    "user",
    "/unused",
    home,
    "---\nname: x\n---\nbody",
    COMMANDS,
  );
  assert.equal(written.length, 6);
  const skillPath = path.join(
    home,
    ".claude",
    "skills",
    "llmpvp-agent-integration",
    "SKILL.md",
  );
  assert.equal(await fs.readFile(skillPath, "utf-8"), "---\nname: x\n---\nbody");
  const setupPath = path.join(home, ".claude", "commands", "llmpvp", "setup.md");
  const setupContent = await fs.readFile(setupPath, "utf-8");
  assert.ok(setupContent.includes("Generate a standalone LLMPvP bot"));
  await fs.rm(home, { recursive: true, force: true });
});

test("claudeTarget.markerPath points at project .claude when scope is project", () => {
  const marker = claudeTarget.markerPath("project", "/repo", "/home/x");
  assert.equal(marker, path.join("/repo", ".claude"));
});
