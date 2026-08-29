import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { piTarget } from "../../src/targets/pi.js";
import { COMMANDS } from "../../src/commandsSource.js";

test("piTarget writes only the skill, never commands, under <home>/.pi/agent at user scope", async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "llmpvp-pi-"));
  const written = await piTarget.install(
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
    path.join(home, ".pi", "agent", "skills", "llmpvp-agent-integration", "SKILL.md"),
  );
  assert.equal(piTarget.supportsCommands, false);
  await fs.rm(home, { recursive: true, force: true });
});

test("piTarget's user-scope marker (<home>/.pi) differs from the write base (<home>/.pi/agent)", () => {
  const marker = piTarget.markerPath("user", "/unused", "/home/x");
  const base = piTarget.baseDir("user", "/unused", "/home/x");
  assert.equal(marker, path.join("/home/x", ".pi"));
  assert.equal(base, path.join("/home/x", ".pi", "agent"));
  assert.notEqual(marker, base);
});

test("piTarget's project-scope marker and write base both resolve to <cwd>/.pi", () => {
  const marker = piTarget.markerPath("project", "/repo", "/home/x");
  const base = piTarget.baseDir("project", "/repo", "/home/x");
  assert.equal(marker, path.join("/repo", ".pi"));
  assert.equal(base, path.join("/repo", ".pi"));
});
