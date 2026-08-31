import { test } from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildMcpServer } from "../../src/mcp/server.js";

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
