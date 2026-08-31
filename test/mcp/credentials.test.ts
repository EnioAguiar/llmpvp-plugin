import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  readCredentials,
  writeCredentials,
  saveAgent,
  resolveAgent,
  credentialsPath,
} from "../../src/mcp/credentials.js";

async function withFakeHome(fn: () => Promise<void>): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "llmpvp-mcp-test-"));
  const previous = process.env.LLMPVP_PLUGIN_HOME_OVERRIDE;
  process.env.LLMPVP_PLUGIN_HOME_OVERRIDE = dir;
  try {
    await fn();
  } finally {
    if (previous === undefined) delete process.env.LLMPVP_PLUGIN_HOME_OVERRIDE;
    else process.env.LLMPVP_PLUGIN_HOME_OVERRIDE = previous;
    await fs.rm(dir, { recursive: true, force: true });
  }
}

test("readCredentials returns an empty shape when the file does not exist", async () => {
  await withFakeHome(async () => {
    const creds = await readCredentials();
    assert.deepEqual(creds, { default: "", agents: {} });
  });
});

test("readCredentials returns an empty shape when the file is malformed JSON", async () => {
  await withFakeHome(async () => {
    await fs.mkdir(path.dirname(credentialsPath()), { recursive: true });
    await fs.writeFile(credentialsPath(), "{not json", "utf-8");
    const creds = await readCredentials();
    assert.deepEqual(creds, { default: "", agents: {} });
  });
});

test("saveAgent persists the agent and sets it as default", async () => {
  await withFakeHome(async () => {
    await saveAgent("Bot1", {
      api_key: "arn_test123",
      base_url: "https://api.llmpvp.com",
      registered_at: "2026-08-30T00:00:00Z",
    });
    const creds = await readCredentials();
    assert.equal(creds.default, "Bot1");
    assert.equal(creds.agents.Bot1.api_key, "arn_test123");
  });
});

test("writeCredentials sets file permissions to 0600", async () => {
  await withFakeHome(async () => {
    await writeCredentials({
      default: "Bot1",
      agents: {
        Bot1: { api_key: "arn_x", base_url: "https://api.llmpvp.com", registered_at: "2026-08-30T00:00:00Z" },
      },
    });
    const stat = await fs.stat(credentialsPath());
    assert.equal(stat.mode & 0o777, 0o600);
  });
});

test("saveAgent called twice keeps both agents and switches default to the most recent", async () => {
  await withFakeHome(async () => {
    await saveAgent("Bot1", { api_key: "a", base_url: "https://api.llmpvp.com", registered_at: "2026-08-30T00:00:00Z" });
    await saveAgent("Bot2", { api_key: "b", base_url: "https://api.llmpvp.com", registered_at: "2026-08-30T00:01:00Z" });
    const creds = await readCredentials();
    assert.equal(creds.default, "Bot2");
    assert.ok(creds.agents.Bot1);
    assert.ok(creds.agents.Bot2);
  });
});

test("resolveAgent falls back to the default when no name is given", async () => {
  await withFakeHome(async () => {
    await saveAgent("Bot1", { api_key: "a", base_url: "https://api.llmpvp.com", registered_at: "2026-08-30T00:00:00Z" });
    const resolved = await resolveAgent();
    assert.equal(resolved?.name, "Bot1");
    assert.equal(resolved?.credential.api_key, "a");
  });
});

test("resolveAgent returns null when no credentials file exists yet", async () => {
  await withFakeHome(async () => {
    const resolved = await resolveAgent();
    assert.equal(resolved, null);
  });
});

test("resolveAgent returns null when the named agent does not exist", async () => {
  await withFakeHome(async () => {
    await saveAgent("Bot1", { api_key: "a", base_url: "https://api.llmpvp.com", registered_at: "2026-08-30T00:00:00Z" });
    const resolved = await resolveAgent("Ghost");
    assert.equal(resolved, null);
  });
});
