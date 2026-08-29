import path from "node:path";
import type { Scope, Target } from "../types.js";
import { writeSkillFile } from "../skillWriter.js";

const ID = "agents-universal";

function base(scope: Scope, cwd: string, home: string): string {
  return scope === "user" ? path.join(home, ".agents") : path.join(cwd, ".agents");
}

export const agentsUniversalTarget: Target = {
  id: ID,
  label: "Universal (.agents/skills -- omp, Cursor, and future tools)",
  supportsSkill: true,
  supportsCommands: false,
  alwaysInstall: true,
  markerPath: () => null,
  baseDir: base,
  async install(scope, cwd, home, skillMarkdown) {
    return writeSkillFile(ID, base(scope, cwd, home), skillMarkdown);
  },
};
