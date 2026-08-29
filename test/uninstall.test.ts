import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runInstall } from "../src/install.js";
import { runUninstall } from "../src/uninstall.js";
import { manifestPath } from "../src/paths.js";

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

test("runUninstall never deletes the scope root even when pruning would otherwise reach it", async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "llmpvp-uninstall-scoperoot-home-"));
  const projectCwd = await fs.mkdtemp(path.join(os.tmpdir(), "llmpvp-uninstall-scoperoot-cwd-"));
  process.env.LLMPVP_PLUGIN_HOME_OVERRIDE = home;

  // Simulate a target (like Cursor) whose only file sits 2 levels below cwd
  // with nothing else in the project directory, so pruning empty parents
  // would climb: commands/ -> .cursor/ -> cwd itself (3 levels).
  const cmdDir = path.join(projectCwd, ".cursor", "commands");
  await fs.mkdir(cmdDir, { recursive: true });
  const cmdFile = path.join(cmdDir, "llmpvp-setup.md");
  await fs.writeFile(cmdFile, "# setup", "utf-8");

  const manifestFile = manifestPath("project", projectCwd);
  await fs.mkdir(path.dirname(manifestFile), { recursive: true });
  await fs.writeFile(
    manifestFile,
    JSON.stringify({
      scope: "project",
      cwd: projectCwd,
      installedAt: new Date().toISOString(),
      files: [{ target: "cursor", path: cmdFile, kind: "command" }],
    }),
    "utf-8",
  );

  const summary = await runUninstall("project", projectCwd, false);
  assert.equal(summary.hadManifest, true);
  assert.ok(summary.removed.includes(cmdFile));
  await assert.rejects(() => fs.stat(cmdFile));
  await assert.rejects(() => fs.stat(path.join(projectCwd, ".cursor")));
  assert.ok(await fs.stat(projectCwd));

  delete process.env.LLMPVP_PLUGIN_HOME_OVERRIDE;
  await fs.rm(home, { recursive: true, force: true });
  await fs.rm(projectCwd, { recursive: true, force: true });
});

test("runUninstall on a malformed manifest file does not throw and reports no manifest", async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "llmpvp-uninstall-malformed-"));
  process.env.LLMPVP_PLUGIN_HOME_OVERRIDE = home;

  const manifestFile = manifestPath("user", "/unused");
  await fs.mkdir(path.dirname(manifestFile), { recursive: true });
  await fs.writeFile(manifestFile, "{not valid json", "utf-8");

  const summary = await runUninstall("user", "/unused", false);
  assert.equal(summary.hadManifest, false);
  assert.equal(summary.removed.length, 0);
  assert.equal(summary.credentialsPurged, false);

  delete process.env.LLMPVP_PLUGIN_HOME_OVERRIDE;
  await fs.rm(home, { recursive: true, force: true });
});
