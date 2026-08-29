import fs from "node:fs/promises";
import path from "node:path";
import { targets } from "./targets/index.js";
import { detectTargets } from "./detect.js";
import { homeDir, manifestPath } from "./paths.js";
import { COMMANDS } from "./commandsSource.js";
import type { Scope, Target, WrittenFile } from "./types.js";

export interface InstallResultRow {
  id: string;
  label: string;
  installed: boolean;
  reason?: string;
  files: WrittenFile[];
}

export interface InstallSummary {
  scope: Scope;
  results: InstallResultRow[];
}

export async function runInstall(
  scope: Scope,
  cwd: string,
  skillMarkdown: string,
  selectedIds?: string[],
): Promise<InstallSummary> {
  const home = homeDir();
  const detected = await detectTargets(scope, cwd);
  const byId: Record<string, Target> = Object.fromEntries(targets.map((t) => [t.id, t]));
  const results: InstallResultRow[] = [];
  const allWritten: WrittenFile[] = [];

  for (const d of detected) {
    const target = byId[d.id];
    if (!target) {
      results.push({ id: d.id, label: d.label, installed: false, reason: d.reason, files: [] });
      continue;
    }

    const structurallyIncompatible =
      !target.alwaysInstall && target.markerPath(scope, cwd, home) === null;

    const shouldInstall = selectedIds
      ? selectedIds.includes(d.id) && !structurallyIncompatible
      : d.shouldInstall;

    if (!shouldInstall) {
      const reason = structurallyIncompatible
        ? d.reason
        : selectedIds
          ? "not selected"
          : d.reason;
      results.push({ id: d.id, label: d.label, installed: false, reason, files: [] });
      continue;
    }

    const files = await target.install(scope, cwd, home, skillMarkdown, COMMANDS);
    allWritten.push(...files);
    results.push({ id: d.id, label: d.label, installed: true, files });
  }

  const manifestFile = manifestPath(scope, cwd);
  await fs.mkdir(path.dirname(manifestFile), { recursive: true });
  await fs.writeFile(
    manifestFile,
    JSON.stringify(
      { scope, cwd, installedAt: new Date().toISOString(), files: allWritten },
      null,
      2,
    ),
    "utf-8",
  );

  return { scope, results };
}
