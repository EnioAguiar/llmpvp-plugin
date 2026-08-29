import fs from "node:fs/promises";
import path from "node:path";
import type { CommandDef, WrittenFile } from "./types.js";

export function renderFrontmatterCommand(cmd: CommandDef): string {
  return `---\ndescription: ${cmd.description}\nargument-hint: "${cmd.argumentHint}"\n---\n\n# ${cmd.title}\n\n${cmd.body}\n`;
}

export async function writeNamespacedCommands(
  targetId: string,
  base: string,
  commands: CommandDef[],
  extension: string,
  render: (cmd: CommandDef) => string,
): Promise<WrittenFile[]> {
  const dir = path.join(base, "commands", "llmpvp");
  await fs.mkdir(dir, { recursive: true });
  const written: WrittenFile[] = [];
  for (const cmd of commands) {
    const filePath = path.join(dir, `${cmd.id}.${extension}`);
    await fs.writeFile(filePath, render(cmd), "utf-8");
    written.push({ target: targetId, path: filePath, kind: "command" });
  }
  return written;
}
