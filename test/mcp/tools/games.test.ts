import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { registerGameTools } from "../../../src/mcp/tools/games.js";
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

test("challenge_opponent rejects when neither opponent_name nor house_bot_difficulty is given", async () => {
  await withFakeHome(async () => {
    await seedAgent();
    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerGameTools(server);
    const client = await connectedClient(server);
    const result = await client.callTool({ name: "challenge_opponent", arguments: { game_type: "chess" } });
    assert.equal(result.isError, true);
    const text = (result.content as { type: string; text: string }[])[0].text;
    assert.match(text, /exactly one/i);
  });
});

test("challenge_opponent rejects when both opponent_name and house_bot_difficulty are given", async () => {
  await withFakeHome(async () => {
    await seedAgent();
    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerGameTools(server);
    const client = await connectedClient(server);
    const result = await client.callTool({
      name: "challenge_opponent",
      arguments: { game_type: "chess", opponent_name: "Bob", house_bot_difficulty: "easy" },
    });
    assert.equal(result.isError, true);
  });
});

test("challenge_opponent returns the created game", async () => {
  await withFakeHome(async () => {
    await seedAgent();
    mockFetchOnce(200, { id: "game1", game_type: "chess", status: "active", current_turn: "white" });
    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerGameTools(server);
    const client = await connectedClient(server);
    try {
      const result = await client.callTool({
        name: "challenge_opponent",
        arguments: { game_type: "chess", opponent_name: "Bob" },
      });
      const text = (result.content as { type: string; text: string }[])[0].text;
      assert.match(text, /"id": "game1"/);
    } finally {
      restoreFetch();
    }
  });
});

test("challenge_opponent surfaces a 409 already-active-game error with a get_agent_status hint", async () => {
  await withFakeHome(async () => {
    await seedAgent();
    mockFetchOnce(409, { detail: "Cannot challenge: you already have an active game" });
    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerGameTools(server);
    const client = await connectedClient(server);
    try {
      const result = await client.callTool({
        name: "challenge_opponent",
        arguments: { game_type: "chess", opponent_name: "Bob" },
      });
      assert.equal(result.isError, true);
      const text = (result.content as { type: string; text: string }[])[0].text;
      assert.equal(
        text,
        "Cannot challenge: you already have an active game Call get_agent_status to see your current active_game_id.",
      );
    } finally {
      restoreFetch();
    }
  });
});

test("get_game_state returns the board state", async () => {
  await withFakeHome(async () => {
    await seedAgent();
    mockFetchOnce(200, { id: "game1", game_type: "chess", status: "active", fen: "startpos" });
    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerGameTools(server);
    const client = await connectedClient(server);
    try {
      const result = await client.callTool({ name: "get_game_state", arguments: { game_id: "game1" } });
      const text = (result.content as { type: string; text: string }[])[0].text;
      assert.match(text, /"fen": "startpos"/);
    } finally {
      restoreFetch();
    }
  });
});

test("make_move surfaces a 400 illegal-move error verbatim", async () => {
  await withFakeHome(async () => {
    await seedAgent();
    mockFetchOnce(400, { detail: "Illegal move: e5 is not reachable from that square" });
    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerGameTools(server);
    const client = await connectedClient(server);
    try {
      const result = await client.callTool({ name: "make_move", arguments: { game_id: "game1", move: "e5" } });
      assert.equal(result.isError, true);
      const text = (result.content as { type: string; text: string }[])[0].text;
      assert.equal(text, "Illegal move: e5 is not reachable from that square");
    } finally {
      restoreFetch();
    }
  });
});

test("make_move returns the updated game status on success", async () => {
  await withFakeHome(async () => {
    await seedAgent();
    mockFetchOnce(200, { success: true, move: "e4", game_status: "active", your_time_remaining_ms: 599000 });
    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerGameTools(server);
    const client = await connectedClient(server);
    try {
      const result = await client.callTool({ name: "make_move", arguments: { game_id: "game1", move: "e4" } });
      const text = (result.content as { type: string; text: string }[])[0].text;
      assert.match(text, /"move": "e4"/);
    } finally {
      restoreFetch();
    }
  });
});

test("resign_game returns the finished game", async () => {
  await withFakeHome(async () => {
    await seedAgent();
    mockFetchOnce(200, { id: "game1", status: "finished", result: "black" });
    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerGameTools(server);
    const client = await connectedClient(server);
    try {
      const result = await client.callTool({ name: "resign_game", arguments: { game_id: "game1" } });
      const text = (result.content as { type: string; text: string }[])[0].text;
      assert.match(text, /"status": "finished"/);
    } finally {
      restoreFetch();
    }
  });
});

test("make_move describes the per-move timeout contract", async () => {
  const server = new McpServer({ name: "test", version: "0.0.0" });
  registerGameTools(server);
  const client = await connectedClient(server);
  const { tools } = await client.listTools();
  const makeMove = tools.find((tool) => tool.name === "make_move");

  assert.match(makeMove?.description ?? "", /within 60 seconds/i);
  assert.match(makeMove?.description ?? "", /HTTP 408/i);
  assert.match(makeMove?.description ?? "", /conduct strike/i);
});
