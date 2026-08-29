import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import type { Scope } from "./types.js";

export function homeDir(): string {
  return process.env.LLMPVP_PLUGIN_HOME_OVERRIDE ?? os.homedir();
}

export function stateDir(): string {
  return path.join(homeDir(), ".llmpvp-plugin");
}

export function manifestPath(scope: Scope, cwd: string): string {
  if (scope === "user") {
    return path.join(stateDir(), "manifest-user.json");
  }
  const key = crypto
    .createHash("sha256")
    .update(path.resolve(cwd))
    .digest("hex")
    .slice(0, 16);
  return path.join(stateDir(), `manifest-project-${key}.json`);
}
