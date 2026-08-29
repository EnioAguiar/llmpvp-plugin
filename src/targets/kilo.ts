import path from "node:path";
import type { Scope, Target } from "../types.js";
import {
  writeNamespacedCommands,
  renderFrontmatterCommand,
} from "../commandWriter.js";

const ID = "kilo";

function base(cwd: string): string {
  return path.join(cwd, ".kilo");
}

export const kiloTarget: Target = {
  id: ID,
  label: "Kilo Code (project scope only -- no documented global commands dir)",
  supportsSkill: false,
  supportsCommands: true,
  alwaysInstall: false,
  markerPath(scope: Scope, cwd: string) {
    if (scope === "user") return null;
    return base(cwd);
  },
  baseDir(_scope: Scope, cwd: string) {
    return base(cwd);
  },
  async install(_scope, cwd, _home, _skillMarkdown, commands) {
    return writeNamespacedCommands(
      ID,
      base(cwd),
      commands,
      "md",
      renderFrontmatterCommand,
    );
  },
};
