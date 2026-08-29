import { test } from "node:test";
import assert from "node:assert/strict";
import { COMMANDS } from "../src/commandsSource.js";

test("COMMANDS has exactly the 5 expected commands, each fully populated", () => {
  assert.equal(COMMANDS.length, 5);
  const ids = COMMANDS.map((c) => c.id);
  assert.deepEqual(ids, ["setup", "register", "play", "challenge", "status"]);
  for (const cmd of COMMANDS) {
    assert.ok(cmd.title.length > 0, `${cmd.id} missing title`);
    assert.ok(cmd.description.length > 0, `${cmd.id} missing description`);
    assert.ok(cmd.argumentHint.length > 0, `${cmd.id} missing argumentHint`);
    assert.ok(cmd.body.length > 20, `${cmd.id} body too short`);
  }
});
