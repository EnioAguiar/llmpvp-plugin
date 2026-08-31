import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { registerAgentTools } from "../../../src/mcp/tools/agent.js";
import { saveAgent } from "../../../src/mcp/credentials.js";

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

async function connectedClient(server: McpServer): Promise<Client> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
  return client;
}

type FetchLike = typeof fetch;
let originalFetch: FetchLike;

function mockFetchOnce(status: number, body: unknown): void {
  originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  })) as unknown as FetchLike;
}

function restoreFetch(): void {
  globalThis.fetch = originalFetch;
}

test("register_agent never returns the raw api_key in the tool result", async () => {
  await withFakeHome(async () => {
    mockFetchOnce(200, {
      success: true,
      agent: { id: "1", name: "Bot1", api_key: "arn_super_secret", claim_url: "/claim/abc" },
      important: "Save your api_key now",
    });
    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerAgentTools(server);
    const client = await connectedClient(server);
    try {
      const result = await client.callTool({ name: "register_agent", arguments: { name: "Bot1" } });
      const text = (result.content as { type: string; text: string }[])[0].text;
      assert.ok(!text.includes("arn_super_secret"));
      assert.ok(text.includes("/claim/abc"));
    } finally {
      restoreFetch();
    }
  });
});

test("register_agent saves the credential to disk", async () => {
  await withFakeHome(async () => {
    mockFetchOnce(200, {
      success: true,
      agent: { id: "1", name: "Bot1", api_key: "arn_x", claim_url: "/claim/abc" },
      important: "Save your api_key now",
    });
    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerAgentTools(server);
    const client = await connectedClient(server);
    try {
      await client.callTool({ name: "register_agent", arguments: { name: "Bot1" } });
      const { resolveAgent } = await import("../../../src/mcp/credentials.js");
      const resolved = await resolveAgent("Bot1");
      assert.equal(resolved?.credential.api_key, "arn_x");
    } finally {
      restoreFetch();
    }
  });
});

test("register_agent surfaces a 409 from the API as a tool error", async () => {
  await withFakeHome(async () => {
    mockFetchOnce(409, { detail: "An agent with this name already exists" });
    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerAgentTools(server);
    const client = await connectedClient(server);
    try {
      const result = await client.callTool({ name: "register_agent", arguments: { name: "Bot1" } });
      assert.equal(result.isError, true);
      const text = (result.content as { type: string; text: string }[])[0].text;
      assert.equal(text, "An agent with this name already exists");
    } finally {
      restoreFetch();
    }
  });
});

test("get_agent_status errors clearly when no credential is saved yet", async () => {
  await withFakeHome(async () => {
    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerAgentTools(server);
    const client = await connectedClient(server);
    const result = await client.callTool({ name: "get_agent_status", arguments: {} });
    assert.equal(result.isError, true);
    const text = (result.content as { type: string; text: string }[])[0].text;
    assert.match(text, /register_agent first/);
  });
});

test("get_agent_status returns the saved agent's status", async () => {
  await withFakeHome(async () => {
    await saveAgent("Bot1", { api_key: "arn_x", base_url: "https://api.llmpvp.com", registered_at: "2026-08-30T00:00:00Z" });
    mockFetchOnce(200, { id: "1", name: "Bot1", status: "active", ratings: {}, active_game_id: null });
    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerAgentTools(server);
    const client = await connectedClient(server);
    try {
      const result = await client.callTool({ name: "get_agent_status", arguments: {} });
      const text = (result.content as { type: string; text: string }[])[0].text;
      assert.match(text, /"status": "active"/);
    } finally {
      restoreFetch();
    }
  });
});
