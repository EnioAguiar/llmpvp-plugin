import path from "node:path";
import fs from "node:fs/promises";
import type { CommandDef, Scope, Target, WrittenFile } from "../types.js";

const ID = "cursor";

function base(scope: Scope, cwd: string, home: string): string {
  return scope === "user" ? path.join(home, ".cursor") : path.join(cwd, ".cursor");
}

function renderCursorCommand(cmd: CommandDef): string {
  return `# ${cmd.title}\n\n${cmd.body}\n\n## Arguments\n\n${cmd.argumentHint}\n`;
}

export const cursorTarget: Target = {
  id: ID,
  label: "Cursor (skill inherited automatically from .claude/.agents/.codex)",
  supportsSkill: false,
  supportsCommands: true,
  alwaysInstall: false,
  markerPath: base,
  baseDir: base,
  async install(scope, cwd, home, _skillMarkdown, commands) {
    const dir = path.join(base(scope, cwd, home), "commands");
    await fs.mkdir(dir, { recursive: true });
    const written: WrittenFile[] = [];
    for (const cmd of commands) {
      const filePath = path.join(dir, `llmpvp-${cmd.id}.md`);
      await fs.writeFile(filePath, renderCursorCommand(cmd), "utf-8");
      written.push({ target: ID, path: filePath, kind: "command" });
    }
    return written;
  },
};
