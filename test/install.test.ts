import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runInstall } from "../src/install.js";
import { manifestPath } from "../src/paths.js";

test("runInstall writes files for detected targets and records a manifest", async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "llmpvp-install-"));
  await fs.mkdir(path.join(home, ".claude"), { recursive: true });
  process.env.LLMPVP_PLUGIN_HOME_OVERRIDE = home;

  const summary = await runInstall("user", "/unused", "---\nname: x\n---\nbody");

  const claudeRow = summary.results.find((r) => r.id === "claude")!;
  assert.equal(claudeRow.installed, true);
  assert.equal(claudeRow.files.length, 6);

  const universalRow = summary.results.find((r) => r.id === "agents-universal")!;
  assert.equal(universalRow.installed, true);

  const geminiRow = summary.results.find((r) => r.id === "gemini")!;
  assert.equal(geminiRow.installed, false);

  const manifestFile = manifestPath("user", "/unused");
  const manifest = JSON.parse(await fs.readFile(manifestFile, "utf-8"));
  assert.ok(Array.isArray(manifest.files));
  assert.equal(manifest.files.length, 7); // 6 claude files + 1 universal skill

  delete process.env.LLMPVP_PLUGIN_HOME_OVERRIDE;
  await fs.rm(home, { recursive: true, force: true });
});

test("runInstall is idempotent -- running twice does not duplicate files", async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "llmpvp-install2-"));
  await fs.mkdir(path.join(home, ".codex"), { recursive: true });
  process.env.LLMPVP_PLUGIN_HOME_OVERRIDE = home;

  await runInstall("user", "/unused", "first");
  await runInstall("user", "/unused", "second");

  const skillPath = path.join(
    home,
    ".codex",
    "skills",
    "llmpvp-agent-integration",
    "SKILL.md",
  );
  assert.equal(await fs.readFile(skillPath, "utf-8"), "second");

  delete process.env.LLMPVP_PLUGIN_HOME_OVERRIDE;
  await fs.rm(home, { recursive: true, force: true });
});
