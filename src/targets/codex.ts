import path from "node:path";
import type { Scope, Target } from "../types.js";
import { writeSkillFile } from "../skillWriter.js";

const ID = "codex";

function base(scope: Scope, cwd: string, home: string): string {
  return scope === "user" ? path.join(home, ".codex") : path.join(cwd, ".codex");
}

export const codexTarget: Target = {
  id: ID,
  label: "Codex CLI (skill only -- commands are invoked via $llmpvp-agent-integration)",
  supportsSkill: true,
  supportsCommands: false,
  alwaysInstall: false,
  markerPath: base,
  baseDir: base,
  async install(scope, cwd, home, skillMarkdown) {
    return writeSkillFile(ID, base(scope, cwd, home), skillMarkdown);
  },
};
