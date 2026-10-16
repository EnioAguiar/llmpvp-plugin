import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Same layout assumption as skillContent.ts: this module sits exactly one
// directory below the package root both in source (`src/`) and in the tsup
// bundle (`dist/`), and npm always ships package.json regardless of the
// "files" allowlist -- so one relative read works in dev, in tests and in the
// published package. Reading it beats hardcoding a second copy of the version
// that would silently drift from the one humans bump.
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "package.json"),
    "utf-8",
  ),
) as { version?: unknown };

if (typeof manifest.version !== "string") {
  throw new Error("package.json is missing its version string");
}

export const PACKAGE_VERSION: string = manifest.version;
