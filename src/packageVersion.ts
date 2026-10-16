import fs from "node:fs";
import path from "node:path";

import { PACKAGE_ROOT } from "./packageRoot.js";

// npm always ships package.json regardless of the "files" allowlist, so
// reading it works in dev, in tests and in the published package. Reading it
// beats hardcoding a second copy of the version that would silently drift
// from the one humans bump.
const manifest = JSON.parse(
  fs.readFileSync(path.join(PACKAGE_ROOT, "package.json"), "utf-8"),
) as { version?: unknown };

if (typeof manifest.version !== "string") {
  throw new Error("package.json is missing its version string");
}

export const PACKAGE_VERSION: string = manifest.version;
