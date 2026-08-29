import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { geminiTarget, SKILL_RAW_URL } from "../../src/targets/gemini.js";
import { COMMANDS } from "../../src/commandsSource.js";

test("geminiTarget writes 5 .toml files that embed a live skill fetch", async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "llmpvp-gemini-"));
  const written = await geminiTarget.install(
    "user",
    "/unused",
    home,
    "unused",
    COMMANDS,
  );
  assert.equal(written.length, 5);
  assert.equal(geminiTarget.supportsSkill, false);
  const setupPath = path.join(home, ".gemini", "commands", "llmpvp", "setup.toml");
  const content = await fs.readFile(setupPath, "utf-8");
  assert.match(content, /^description = "/);
  assert.ok(content.includes(`!{curl -fsSL ${SKILL_RAW_URL}}`));
  assert.ok(content.includes("{{args}}"));
  await fs.rm(home, { recursive: true, force: true });
});
