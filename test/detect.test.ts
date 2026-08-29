import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { detectTargets } from "../src/detect.js";

test("detectTargets always includes agents-universal, and marks CLIs without a marker dir as skipped", async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "llmpvp-detect-"));
  process.env.LLMPVP_PLUGIN_HOME_OVERRIDE = home;
  const results = await detectTargets("user", "/unused");
  delete process.env.LLMPVP_PLUGIN_HOME_OVERRIDE;

  const universal = results.find((r) => r.id === "agents-universal")!;
  assert.equal(universal.shouldInstall, true);

  const claude = results.find((r) => r.id === "claude")!;
  assert.equal(claude.shouldInstall, false);
  assert.ok(claude.reason?.includes("not found"));

  const kilo = results.find((r) => r.id === "kilo")!;
  assert.equal(kilo.shouldInstall, false);
  assert.ok(kilo.reason?.includes("does not support user scope"));

  await fs.rm(home, { recursive: true, force: true });
});

test("detectTargets finds Claude Code when <home>/.claude exists", async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "llmpvp-detect2-"));
  await fs.mkdir(path.join(home, ".claude"), { recursive: true });
  process.env.LLMPVP_PLUGIN_HOME_OVERRIDE = home;
  const results = await detectTargets("user", "/unused");
  delete process.env.LLMPVP_PLUGIN_HOME_OVERRIDE;
  const claude = results.find((r) => r.id === "claude")!;
  assert.equal(claude.shouldInstall, true);
  await fs.rm(home, { recursive: true, force: true });
});
