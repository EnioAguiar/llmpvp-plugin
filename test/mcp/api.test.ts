import { test } from "node:test";
import assert from "node:assert/strict";
import {
  registerAgent,
  getAgentMe,
  challengeOpponent,
  joinMatchmaking,
  ApiError,
  NetworkError,
} from "../../src/mcp/api.js";

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

function mockFetchThrows(message: string): void {
  originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new Error(message);
  }) as unknown as FetchLike;
}

function restoreFetch(): void {
  globalThis.fetch = originalFetch;
}

test("registerAgent returns the parsed response on success", async () => {
  mockFetchOnce(200, {
    success: true,
    agent: { id: "1", name: "Bot1", api_key: "arn_x", claim_url: "/claim/abc" },
    important: "Save your api_key now",
  });
  try {
    const result = await registerAgent("https://api.llmpvp.com", "Bot1");
    assert.equal(result.agent.name, "Bot1");
    assert.equal(result.agent.claim_url, "/claim/abc");
  } finally {
    restoreFetch();
  }
});

test("registerAgent throws ApiError with the API's detail message on 409", async () => {
  mockFetchOnce(409, { detail: "An agent with this name already exists" });
  try {
    await assert.rejects(
      () => registerAgent("https://api.llmpvp.com", "Bot1"),
      (err: unknown) => err instanceof ApiError && err.status === 409 && err.detail === "An agent with this name already exists",
    );
  } finally {
    restoreFetch();
  }
});

test("getAgentMe throws NetworkError when fetch itself fails", async () => {
  mockFetchThrows("ECONNREFUSED");
  try {
    await assert.rejects(
      () => getAgentMe("https://api.llmpvp.com", "arn_x"),
      (err: unknown) => err instanceof NetworkError && err.message.includes("ECONNREFUSED"),
    );
  } finally {
    restoreFetch();
  }
});

test("getAgentMe passes the Bearer token in the Authorization header", async () => {
  let capturedHeaders: HeadersInit | undefined;
  originalFetch = globalThis.fetch;
  globalThis.fetch = (async (_url: string, init?: RequestInit) => {
    capturedHeaders = init?.headers;
    return { ok: true, status: 200, json: async () => ({ id: "1", name: "Bot1", status: "active", ratings: {}, active_game_id: null }) };
  }) as unknown as FetchLike;
  try {
    await getAgentMe("https://api.llmpvp.com", "arn_secret");
    assert.equal((capturedHeaders as Record<string, string>).Authorization, "Bearer arn_secret");
  } finally {
    restoreFetch();
  }
});

test("challengeOpponent sends exactly the fields provided, dropping undefined ones", async () => {
  let capturedBody: unknown;
  originalFetch = globalThis.fetch;
  globalThis.fetch = (async (_url: string, init?: RequestInit) => {
    capturedBody = JSON.parse(init?.body as string);
    return { ok: true, status: 200, json: async () => ({ id: "game1", game_type: "chess" }) };
  }) as unknown as FetchLike;
  try {
    await challengeOpponent("https://api.llmpvp.com", "arn_x", { game_type: "chess", opponent_name: "Bob" });
    assert.deepEqual(capturedBody, { game_type: "chess", opponent_name: "Bob" });
  } finally {
    restoreFetch();
  }
});

test("joinMatchmaking returns a waiting status without a game_id", async () => {
  mockFetchOnce(200, { status: "waiting" });
  try {
    const result = await joinMatchmaking("https://api.llmpvp.com", "arn_x", { game_type: "chess" });
    assert.equal(result.status, "waiting");
    assert.equal(result.game_id, undefined);
  } finally {
    restoreFetch();
  }
});

test("ApiError falls back to a generic message when the API response has no detail field", async () => {
  mockFetchOnce(500, {});
  try {
    await assert.rejects(
      () => getAgentMe("https://api.llmpvp.com", "arn_x"),
      (err: unknown) => err instanceof ApiError && err.status === 500 && err.detail === "HTTP 500",
    );
  } finally {
    restoreFetch();
  }
});
