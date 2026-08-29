import fs from "node:fs/promises";
import type { DetectedTarget, Scope } from "./types.js";
import { targets } from "./targets/index.js";
import { homeDir } from "./paths.js";

async function exists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

export async function detectTargets(
  scope: Scope,
  cwd: string,
): Promise<DetectedTarget[]> {
  const home = homeDir();
  const results: DetectedTarget[] = [];

  for (const target of targets) {
    if (target.alwaysInstall) {
      results.push({ id: target.id, label: target.label, shouldInstall: true });
      continue;
    }

    const marker = target.markerPath(scope, cwd, home);
    if (marker === null) {
      results.push({
        id: target.id,
        label: target.label,
        shouldInstall: false,
        reason: `${target.label} does not support ${scope} scope`,
      });
      continue;
    }

    const found = await exists(marker);
    results.push({
      id: target.id,
      label: target.label,
      shouldInstall: found,
      reason: found ? undefined : `${marker} not found`,
    });
  }

  return results;
}
