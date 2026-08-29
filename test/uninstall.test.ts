import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runInstall } from "../src/install.js";
import { runUninstall } from "../src/uninstall.js";

test("runUninstall removes every file the manifest recorded and the manifest itself", async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "llmpvp-uninstall-"));
  await fs.mkdir(path.join(home, ".claude"), { recursive: true });
  process.env.LLMPVP_PLUGIN_HOME_OVERRIDE = home;

  await runInstall("user", "/unused", "body");
  const skillPath = path.join(
    home,
    ".claude",
    "skills",
    "llmpvp-agent-integration",
    "SKILL.md",
  );
  assert.ok(await fs.readFile(skillPath, "utf-8"));

  const summary = await runUninstall("user", "/unused", false);
  assert.equal(summary.hadManifest, true);
  assert.ok(summary.removed.includes(skillPath));
  await assert.rejects(() => fs.stat(skillPath));

  delete process.env.LLMPVP_PLUGIN_HOME_OVERRIDE;
  await fs.rm(home, { recursive: true, force: true });
});

test("runUninstall with purgeCredentials removes ~/.llmpvp/credentials.json", async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "llmpvp-uninstall2-"));
  const credDir = path.join(home, ".llmpvp");
  await fs.mkdir(credDir, { recursive: true });
  await fs.writeFile(path.join(credDir, "credentials.json"), "{}", "utf-8");
  process.env.LLMPVP_PLUGIN_HOME_OVERRIDE = home;

  const summary = await runUninstall("user", "/unused", true);
  assert.equal(summary.hadManifest, false);
  assert.equal(summary.credentialsPurged, true);
  await assert.rejects(() => fs.stat(path.join(credDir, "credentials.json")));

  delete process.env.LLMPVP_PLUGIN_HOME_OVERRIDE;
  await fs.rm(home, { recursive: true, force: true });
});

test("runUninstall without purgeCredentials on a never-installed scope reports no manifest", async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "llmpvp-uninstall3-"));
  process.env.LLMPVP_PLUGIN_HOME_OVERRIDE = home;

  const summary = await runUninstall("user", "/unused", false);
  assert.equal(summary.hadManifest, false);
  assert.equal(summary.removed.length, 0);
  assert.equal(summary.credentialsPurged, false);

  delete process.env.LLMPVP_PLUGIN_HOME_OVERRIDE;
  await fs.rm(home, { recursive: true, force: true });
});
