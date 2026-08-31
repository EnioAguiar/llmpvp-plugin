import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { registerMatchmakingTools } from "../../../src/mcp/tools/matchmaking.js";
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

async function seedAgent(): Promise<void> {
  await saveAgent("Bot1", { api_key: "arn_x", base_url: "https://api.llmpvp.com", registered_at: "2026-08-30T00:00:00Z" });
}

test("join_matchmaking errors clearly when no credential is saved", async () => {
  await withFakeHome(async () => {
    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerMatchmakingTools(server);
    const client = await connectedClient(server);
    const result = await client.callTool({ name: "join_matchmaking", arguments: { game_type: "chess" } });
    assert.equal(result.isError, true);
  });
});

test("join_matchmaking returns a matched result with game_id", async () => {
  await withFakeHome(async () => {
    await seedAgent();
    mockFetchOnce(200, { status: "matched", game_id: "game1", your_color: "white" });
    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerMatchmakingTools(server);
    const client = await connectedClient(server);
    try {
      const result = await client.callTool({ name: "join_matchmaking", arguments: { game_type: "chess" } });
      const text = (result.content as { type: string; text: string }[])[0].text;
      assert.match(text, /"status": "matched"/);
      assert.match(text, /"game_id": "game1"/);
    } finally {
      restoreFetch();
    }
  });
});

test("join_matchmaking surfaces a 409 already-active-game error with a get_agent_status hint", async () => {
  await withFakeHome(async () => {
    await seedAgent();
    mockFetchOnce(409, { detail: "You already have an active game" });
    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerMatchmakingTools(server);
    const client = await connectedClient(server);
    try {
      const result = await client.callTool({ name: "join_matchmaking", arguments: { game_type: "chess" } });
      assert.equal(result.isError, true);
      const text = (result.content as { type: string; text: string }[])[0].text;
      assert.equal(text, "You already have an active game Call get_agent_status to see your current active_game_id.");
    } finally {
      restoreFetch();
    }
  });
});

test("get_matchmaking_status returns a waiting status", async () => {
  await withFakeHome(async () => {
    await seedAgent();
    mockFetchOnce(200, { status: "waiting" });
    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerMatchmakingTools(server);
    const client = await connectedClient(server);
    try {
      const result = await client.callTool({ name: "get_matchmaking_status", arguments: {} });
      const text = (result.content as { type: string; text: string }[])[0].text;
      assert.match(text, /"status": "waiting"/);
    } finally {
      restoreFetch();
    }
  });
});

test("leave_matchmaking returns left_queue", async () => {
  await withFakeHome(async () => {
    await seedAgent();
    mockFetchOnce(200, { success: true, left_queue: true });
    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerMatchmakingTools(server);
    const client = await connectedClient(server);
    try {
      const result = await client.callTool({ name: "leave_matchmaking", arguments: {} });
      const text = (result.content as { type: string; text: string }[])[0].text;
      assert.match(text, /"left_queue": true/);
    } finally {
      restoreFetch();
    }
  });
});
