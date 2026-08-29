import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ompTarget } from "../../src/targets/omp.js";
import { COMMANDS } from "../../src/commandsSource.js";

test("ompTarget writes only the skill, never commands, under <home>/.omp/agent at user scope", async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "llmpvp-omp-"));
  const written = await ompTarget.install(
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
    path.join(home, ".omp", "agent", "skills", "llmpvp-agent-integration", "SKILL.md"),
  );
  assert.equal(ompTarget.supportsCommands, false);
  await fs.rm(home, { recursive: true, force: true });
});

test("ompTarget's user-scope marker (<home>/.omp) differs from the write base (<home>/.omp/agent)", () => {
  const marker = ompTarget.markerPath("user", "/unused", "/home/x");
  const base = ompTarget.baseDir("user", "/unused", "/home/x");
  assert.equal(marker, path.join("/home/x", ".omp"));
  assert.equal(base, path.join("/home/x", ".omp", "agent"));
  assert.notEqual(marker, base);
});

test("ompTarget's project-scope marker and write base both resolve to <cwd>/.omp", () => {
  const marker = ompTarget.markerPath("project", "/repo", "/home/x");
  const base = ompTarget.baseDir("project", "/repo", "/home/x");
  assert.equal(marker, path.join("/repo", ".omp"));
  assert.equal(base, path.join("/repo", ".omp"));
});
