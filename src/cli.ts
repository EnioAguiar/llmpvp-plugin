#!/usr/bin/env node
import { intro, outro, multiselect, isCancel, cancel } from "@clack/prompts";
import { runInstall } from "./install.js";
import { runUninstall } from "./uninstall.js";
import { SKILL_MARKDOWN } from "./skillContent.js";
import { detectTargets } from "./detect.js";
import type { Scope } from "./types.js";

function parseArgs(argv: string[]): {
  sub: string | undefined;
  scope: Scope;
  purgeCredentials: boolean;
  yes: boolean;
} {
  const [sub, ...rest] = argv;
  const scope: Scope = rest.includes("--project") ? "project" : "user";
  const purgeCredentials = rest.includes("--purge-credentials");
  const yes = rest.includes("--yes") || rest.includes("-y");
  return { sub, scope, purgeCredentials, yes };
}

function isInteractiveTty(): boolean {
  return Boolean(process.stdin.isTTY) && Boolean(process.stdout.isTTY);
}

async function pickTargets(scope: Scope, cwd: string): Promise<string[] | null> {
  const detected = await detectTargets(scope, cwd);

  intro("LLMPvP plugin -- what should we install?");

  const options = detected.map((d) => ({
    value: d.id,
    label: d.label,
    hint: d.shouldInstall ? "detected" : (d.reason ?? "not detected"),
  }));
  const initialValues = detected.filter((d) => d.shouldInstall).map((d) => d.id);

  const picked = await multiselect({
    message: "space to toggle, enter to confirm",
    options,
    initialValues,
    required: false,
  });

  if (isCancel(picked)) {
    cancel("Cancelled.");
    return null;
  }

  return picked as string[];
}

async function main(): Promise<void> {
  const { sub, scope, purgeCredentials, yes } = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();

  if (sub === "install") {
    const interactive = !yes && isInteractiveTty();
    let selectedIds: string[] | undefined;

    if (interactive) {
      const picked = await pickTargets(scope, cwd);
      if (picked === null) {
        process.exitCode = 1;
        return;
      }
      selectedIds = picked;
      outro(`Installing into ${selectedIds.length} target(s)...`);
    }

    const summary = await runInstall(scope, cwd, SKILL_MARKDOWN, selectedIds);
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

  console.error(
    "Usage: llmpvp-plugin <install|uninstall> [--project] [--purge-credentials] [--yes]",
  );
  process.exitCode = 1;
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
