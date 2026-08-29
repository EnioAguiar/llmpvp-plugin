import fs from "node:fs/promises";
import path from "node:path";
import type { WrittenFile } from "./types.js";

export async function writeSkillFile(
  targetId: string,
  base: string,
  skillMarkdown: string,
): Promise<WrittenFile[]> {
  const dir = path.join(base, "skills", "llmpvp-agent-integration");
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, "SKILL.md");
  await fs.writeFile(filePath, skillMarkdown, "utf-8");
  return [{ target: targetId, path: filePath, kind: "skill" }];
}
