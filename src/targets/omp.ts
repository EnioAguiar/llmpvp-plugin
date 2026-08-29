import path from "node:path";
import type { Scope, Target } from "../types.js";
import { writeSkillFile } from "../skillWriter.js";

const ID = "omp";

function marker(scope: Scope, cwd: string, home: string): string {
  return scope === "user" ? path.join(home, ".omp") : path.join(cwd, ".omp");
}

function base(scope: Scope, cwd: string, home: string): string {
  return scope === "user" ? path.join(home, ".omp", "agent") : path.join(cwd, ".omp");
}

export const ompTarget: Target = {
  id: ID,
  label: "omp",
  supportsSkill: true,
  supportsCommands: false,
  alwaysInstall: false,
  markerPath: marker,
  baseDir: base,
  async install(scope, cwd, home, skillMarkdown) {
    return writeSkillFile(ID, base(scope, cwd, home), skillMarkdown);
  },
};
