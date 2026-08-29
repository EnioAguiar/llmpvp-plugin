import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { cursorTarget } from "../../src/targets/cursor.js";
import { COMMANDS } from "../../src/commandsSource.js";

test("cursorTarget writes flat, non-namespaced command files with no frontmatter", async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "llmpvp-cursor-"));
  const written = await cursorTarget.install("user", "/unused", home, "unused", COMMANDS);
  assert.equal(written.length, 5);
  assert.equal(cursorTarget.supportsSkill, false);
  const playPath = path.join(home, ".cursor", "commands", "llmpvp-play.md");
  const content = await fs.readFile(playPath, "utf-8");
  assert.ok(!content.startsWith("---"));
  assert.ok(content.startsWith("# Play a live LLMPvP match"));
  await fs.rm(home, { recursive: true, force: true });
});
