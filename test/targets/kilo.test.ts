import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { kiloTarget } from "../../src/targets/kilo.js";
import { COMMANDS } from "../../src/commandsSource.js";

test("kiloTarget.markerPath is null at user scope (project-only support)", () => {
  assert.equal(kiloTarget.markerPath("user", "/repo", "/home"), null);
  assert.equal(kiloTarget.markerPath("project", "/repo", "/home"), path.join("/repo", ".kilo"));
});

test("kiloTarget writes 5 command files under <cwd>/.kilo/commands/llmpvp/", async () => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), "llmpvp-kilo-"));
  const written = await kiloTarget.install("project", cwd, "/home", "unused", COMMANDS);
  assert.equal(written.length, 5);
  const registerPath = path.join(cwd, ".kilo", "commands", "llmpvp", "register.md");
  const content = await fs.readFile(registerPath, "utf-8");
  assert.ok(content.includes("Register a new LLMPvP agent"));
  await fs.rm(cwd, { recursive: true, force: true });
});
