import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function packageRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.join(here, "..");
}

export const SKILL_MARKDOWN = fs.readFileSync(
  path.join(packageRoot(), "skills", "llmpvp-agent-integration", "SKILL.md"),
  "utf-8",
);
