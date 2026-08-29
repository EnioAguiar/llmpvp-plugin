import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  renderFrontmatterCommand,
  writeNamespacedCommands,
} from "../src/commandWriter.js";
import { COMMANDS } from "../src/commandsSource.js";

test("renderFrontmatterCommand includes description, argument-hint, title, and body", () => {
  const rendered = renderFrontmatterCommand(COMMANDS[0]);
  assert.match(rendered, /^---\ndescription: /);
  assert.match(rendered, /argument-hint: "/);
  assert.ok(rendered.includes(COMMANDS[0].title));
  assert.ok(rendered.includes(COMMANDS[0].body));
});

test("writeNamespacedCommands writes one file per command under commands/llmpvp/", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "llmpvp-cmdwriter-"));
  const written = await writeNamespacedCommands(
    "claude",
    tmp,
    COMMANDS,
    "md",
    renderFrontmatterCommand,
  );
  assert.equal(written.length, 5);
  for (const cmd of COMMANDS) {
    const expectedPath = path.join(tmp, "commands", "llmpvp", `${cmd.id}.md`);
    const content = await fs.readFile(expectedPath, "utf-8");
    assert.ok(content.includes(cmd.title));
  }
  await fs.rm(tmp, { recursive: true, force: true });
});
