import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(here, "..");

async function readJson(relativePath: string): Promise<unknown> {
  return JSON.parse(await fs.readFile(path.join(repoRoot, relativePath), "utf-8")) as unknown;
}

function field(value: unknown, key: string): unknown {
  if (value && typeof value === "object" && key in value) {
    return Reflect.get(value, key);
  }
  return undefined;
}

// Every manifest that carries a version string must follow package.json: the npm
// version is the one humans bump, the rest are published copies of it.
test("every manifest version matches package.json (bump them together)", async () => {
  const expected = field(await readJson("package.json"), "version");
  assert.equal(typeof expected, "string", "package.json must declare a version");

  const server = await readJson("server.json");
  const plugin = await readJson(".claude-plugin/plugin.json");
  const marketplace = await readJson(".claude-plugin/marketplace.json");
  const packages = field(server, "packages");

  const actual: Record<string, unknown> = {
    "server.json version": field(server, "version"),
    "server.json packages[0].version": field(
      Array.isArray(packages) ? packages[0] : undefined,
      "version",
    ),
    ".claude-plugin/plugin.json version": field(plugin, "version"),
    ".claude-plugin/marketplace.json metadata.version": field(
      field(marketplace, "metadata"),
      "version",
    ),
  };

  for (const [label, value] of Object.entries(actual)) {
    assert.equal(value, expected, `${label} is ${String(value)}, expected ${String(expected)}`);
  }
});
