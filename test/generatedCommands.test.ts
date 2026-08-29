import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COMMANDS } from "../src/commandsSource.js";
import { renderFrontmatterCommand } from "../src/commandWriter.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const commandsDir = path.join(here, "..", "commands");

test("checked-in commands/*.md match commandsSource.ts (run npm run generate:commands after editing commandsSource.ts)", async () => {
  for (const cmd of COMMANDS) {
    const filePath = path.join(commandsDir, `${cmd.id}.md`);
    const onDisk = await fs.readFile(filePath, "utf-8");
    assert.equal(onDisk, renderFrontmatterCommand(cmd));
  }
});
