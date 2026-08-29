#!/usr/bin/env node
import { runInstall } from "./install.js";
import { runUninstall } from "./uninstall.js";
import { SKILL_MARKDOWN } from "./skillContent.js";
import type { Scope } from "./types.js";

function parseArgs(argv: string[]): {
  sub: string | undefined;
  scope: Scope;
  purgeCredentials: boolean;
} {
  const [sub, ...rest] = argv;
  const scope: Scope = rest.includes("--project") ? "project" : "user";
  const purgeCredentials = rest.includes("--purge-credentials");
  return { sub, scope, purgeCredentials };
}

async function main(): Promise<void> {
  const { sub, scope, purgeCredentials } = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();

  if (sub === "install") {
    const summary = await runInstall(scope, cwd, SKILL_MARKDOWN);
    console.log(`llmpvp-plugin install (${scope} scope)`);
    for (const r of summary.results) {
      if (r.installed) {
        console.log(`  [ok]   ${r.label} -- ${r.files.length} file(s)`);
      } else {
        console.log(`  [skip] ${r.label} -- ${r.reason ?? "not detected"}`);
      }
    }
    return;
  }

  if (sub === "uninstall") {
    const summary = await runUninstall(scope, cwd, purgeCredentials);
    console.log(`llmpvp-plugin uninstall (${scope} scope)`);
    if (!summary.hadManifest) {
      console.log("  nothing installed for this scope");
    } else {
      console.log(`  removed ${summary.removed.length} file(s)`);
    }
    if (purgeCredentials) {
      console.log(`  credentials ${summary.credentialsPurged ? "purged" : "not found"}`);
    }
    return;
  }

  console.error("Usage: llmpvp-plugin <install|uninstall> [--project] [--purge-credentials]");
  process.exitCode = 1;
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
