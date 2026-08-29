import fs from "node:fs/promises";
import path from "node:path";
import { manifestPath, homeDir } from "./paths.js";
import type { Scope } from "./types.js";

export interface UninstallSummary {
  scope: Scope;
  removed: string[];
  hadManifest: boolean;
  credentialsPurged: boolean;
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function pruneEmptyParents(filePath: string): Promise<void> {
  let dir = path.dirname(filePath);
  for (let i = 0; i < 3; i++) {
    try {
      const entries = await fs.readdir(dir);
      if (entries.length > 0) return;
      await fs.rmdir(dir);
      dir = path.dirname(dir);
    } catch {
      return;
    }
  }
}

async function purgeCredentialsFile(): Promise<boolean> {
  const credPath = path.join(homeDir(), ".llmpvp", "credentials.json");
  if (await exists(credPath)) {
    await fs.unlink(credPath);
    return true;
  }
  return false;
}

export async function runUninstall(
  scope: Scope,
  cwd: string,
  purgeCredentials: boolean,
): Promise<UninstallSummary> {
  const manifestFile = manifestPath(scope, cwd);
  const removed: string[] = [];

  if (!(await exists(manifestFile))) {
    const credentialsPurged = purgeCredentials ? await purgeCredentialsFile() : false;
    return { scope, removed, hadManifest: false, credentialsPurged };
  }

  const raw = await fs.readFile(manifestFile, "utf-8");
  const manifest = JSON.parse(raw) as { files: { path: string }[] };

  for (const file of manifest.files) {
    if (await exists(file.path)) {
      await fs.unlink(file.path);
      removed.push(file.path);
      await pruneEmptyParents(file.path);
    }
  }

  await fs.unlink(manifestFile);

  const credentialsPurged = purgeCredentials ? await purgeCredentialsFile() : false;

  return { scope, removed, hadManifest: true, credentialsPurged };
}
