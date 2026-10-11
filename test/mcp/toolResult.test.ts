import { test } from "node:test";
import assert from "node:assert/strict";
import { ApiError, NetworkError } from "../../src/mcp/api.js";
import { conflictResult, toolErrorResult } from "../../src/mcp/toolResult.js";

function textOf(result: { content: { type: string; text: string }[] }): string {
  return result.content[0].text;
}

test("conflictResult points an active-game 409 at get_agent_status", () => {
  const text = textOf(conflictResult(new ApiError(409, "You already have an active game")));

  assert.equal(
    text,
    "You already have an active game. If that is your own active game, call get_agent_status to see its active_game_id.",
  );
});

test("conflictResult points an opponent's active-game 409 at get_agent_status too", () => {
  const text = textOf(conflictResult(new ApiError(409, "Opponent already has an active game")));

  assert.equal(
    text,
    "Opponent already has an active game. If that is your own active game, call get_agent_status to see its active_game_id.",
  );
});

test("conflictResult tells a busy house-bot tier to retry, not to look up an active game", () => {
  const text = textOf(
    conflictResult(new ApiError(409, "All house bots at this tier are busy right now, try again shortly.")),
  );

  assert.equal(
    text,
    "All house bots at this tier are busy right now, try again shortly. Nothing is wrong on your side -- retry the same call shortly.",
  );
  assert.doesNotMatch(text, /get_agent_status/);
});

test("conflictResult explains a pending-deletion 409", () => {
  const text = textOf(conflictResult(new ApiError(409, "This agent's account has a pending deletion")));

  assert.equal(
    text,
    "This agent's account has a pending deletion. The owner's account has a deletion scheduled, so this agent can't start new games until that is cancelled.",
  );
  assert.doesNotMatch(text, /get_agent_status/);
  assert.doesNotMatch(text, /retry/);
});

test("conflictResult keeps the detail's own terminator instead of doubling it", () => {
  assert.equal(
    textOf(conflictResult(new ApiError(409, "You already have an active game!"))),
    "You already have an active game! If that is your own active game, call get_agent_status to see its active_game_id.",
  );
  assert.equal(
    textOf(conflictResult(new ApiError(409, "Do you already have an active game?"))),
    "Do you already have an active game? If that is your own active game, call get_agent_status to see its active_game_id.",
  );
  assert.equal(
    textOf(conflictResult(new ApiError(409, "You already have an active game  "))),
    "You already have an active game. If that is your own active game, call get_agent_status to see its active_game_id.",
  );
});

test("conflictResult leaves an unrecognised 409 detail untouched", () => {
  const result = conflictResult(new ApiError(409, "Game is already finished"));

  assert.equal(result.isError, true);
  assert.equal(textOf(result), "Game is already finished");
});

test("conflictResult falls back to the plain error for non-409 failures", () => {
  assert.equal(textOf(conflictResult(new ApiError(404, "Opponent not found or not active"))), "Opponent not found or not active");
  assert.equal(
    textOf(conflictResult(new NetworkError("https://api.llmpvp.com", "ECONNREFUSED"))),
    "Could not reach https://api.llmpvp.com: ECONNREFUSED",
  );
});

test("toolErrorResult surfaces an API detail verbatim", () => {
  const result = toolErrorResult(new ApiError(400, "'e5' is not a legal move in this position"));

  assert.equal(result.isError, true);
  assert.equal(textOf(result), "'e5' is not a legal move in this position");
});
