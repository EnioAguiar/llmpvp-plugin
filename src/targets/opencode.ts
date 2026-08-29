import path from "node:path";
import type { Scope, Target } from "../types.js";
import { writeSkillFile } from "../skillWriter.js";
import {
  writeNamespacedCommands,
  renderFrontmatterCommand,
} from "../commandWriter.js";

const ID = "opencode";

function base(scope: Scope, cwd: string, home: string): string {
  return scope === "user"
    ? path.join(home, ".config", "opencode")
    : path.join(cwd, ".opencode");
}

export const opencodeTarget: Target = {
  id: ID,
  label: "OpenCode",
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
