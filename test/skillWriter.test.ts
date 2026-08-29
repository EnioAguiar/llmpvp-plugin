import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { writeSkillFile } from "../src/skillWriter.js";

test("writeSkillFile writes SKILL.md under skills/<name>/ and returns the written path", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "llmpvp-skillwriter-"));
  const result = await writeSkillFile("claude", tmp, "---\nname: x\n---\nbody");
  assert.equal(result.length, 1);
  assert.equal(result[0].kind, "skill");
  const expectedPath = path.join(
    tmp,
    "skills",
    "llmpvp-agent-integration",
    "SKILL.md",
  );
  assert.equal(result[0].path, expectedPath);
  const content = await fs.readFile(expectedPath, "utf-8");
  assert.equal(content, "---\nname: x\n---\nbody");
  await fs.rm(tmp, { recursive: true, force: true });
});
