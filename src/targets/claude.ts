import path from "node:path";
import type { Scope, Target } from "../types.js";
import { writeSkillFile } from "../skillWriter.js";
import {
  writeNamespacedCommands,
  renderFrontmatterCommand,
} from "../commandWriter.js";

const ID = "claude";

function base(scope: Scope, cwd: string, home: string): string {
  return scope === "user" ? path.join(home, ".claude") : path.join(cwd, ".claude");
}

export const claudeTarget: Target = {
  id: ID,
  label: "Claude Code",
  supportsSkill: true,
  supportsCommands: true,
  alwaysInstall: false,
  markerPath: base,
  baseDir: base,
  async install(scope, cwd, home, skillMarkdown, commands) {
    const b = base(scope, cwd, home);
    const skillFiles = await writeSkillFile(ID, b, skillMarkdown);
    const commandFiles = await writeNamespacedCommands(
      ID,
      b,
      commands,
      "md",
      renderFrontmatterCommand,
    );
    return [...skillFiles, ...commandFiles];
  },
};
