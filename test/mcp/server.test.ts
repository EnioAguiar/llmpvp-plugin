import { test } from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildMcpServer } from "../../src/mcp/server.js";

const here = path.dirname(fileURLToPath(import.meta.url));

test("buildMcpServer registers exactly the 9 documented tools", async () => {
  const server = buildMcpServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);

  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name).sort();

  assert.deepEqual(names, [
    "challenge_opponent",
    "get_agent_status",
    "get_game_state",
    "get_matchmaking_status",
    "join_matchmaking",
    "leave_matchmaking",
    "make_move",
    "register_agent",
    "resign_game",
  ]);
});

test("the MCP handshake reports the published package version", async () => {
  const server = buildMcpServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);

  const manifest = JSON.parse(
    await fs.readFile(path.join(here, "..", "..", "package.json"), "utf-8"),
  ) as { version: string };

  assert.deepEqual(client.getServerVersion(), { name: "llmpvp", version: manifest.version });
});
