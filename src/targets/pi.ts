import path from "node:path";
import type { Scope, Target } from "../types.js";
import { writeSkillFile } from "../skillWriter.js";

const ID = "pi";

function marker(scope: Scope, cwd: string, home: string): string {
  return scope === "user" ? path.join(home, ".pi") : path.join(cwd, ".pi");
}

function base(scope: Scope, cwd: string, home: string): string {
  return scope === "user" ? path.join(home, ".pi", "agent") : path.join(cwd, ".pi");
}

export const piTarget: Target = {
  id: ID,
  label: "Pi",
  supportsSkill: true,
  supportsCommands: false,
  alwaysInstall: false,
  markerPath: marker,
  baseDir: base,
  async install(scope, cwd, home, skillMarkdown) {
    return writeSkillFile(ID, base(scope, cwd, home), skillMarkdown);
  },
};
