import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { homeDir, stateDir, manifestPath } from "../src/paths.js";

test("homeDir respects LLMPVP_PLUGIN_HOME_OVERRIDE", () => {
  const previous = process.env.LLMPVP_PLUGIN_HOME_OVERRIDE;
  process.env.LLMPVP_PLUGIN_HOME_OVERRIDE = "/tmp/fake-home";
  assert.equal(homeDir(), "/tmp/fake-home");
  assert.equal(stateDir(), path.join("/tmp/fake-home", ".llmpvp-plugin"));
  if (previous === undefined) delete process.env.LLMPVP_PLUGIN_HOME_OVERRIDE;
  else process.env.LLMPVP_PLUGIN_HOME_OVERRIDE = previous;
});

test("manifestPath is stable for the same project cwd and differs across cwds", () => {
  process.env.LLMPVP_PLUGIN_HOME_OVERRIDE = "/tmp/fake-home";
  const a1 = manifestPath("project", "/tmp/project-a");
  const a2 = manifestPath("project", "/tmp/project-a");
  const b = manifestPath("project", "/tmp/project-b");
  assert.equal(a1, a2);
  assert.notEqual(a1, b);
  delete process.env.LLMPVP_PLUGIN_HOME_OVERRIDE;
});

test("manifestPath for user scope ignores cwd", () => {
  process.env.LLMPVP_PLUGIN_HOME_OVERRIDE = "/tmp/fake-home";
  const u1 = manifestPath("user", "/tmp/project-a");
  const u2 = manifestPath("user", "/tmp/project-b");
  assert.equal(u1, u2);
  delete process.env.LLMPVP_PLUGIN_HOME_OVERRIDE;
});
