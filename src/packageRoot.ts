import path from "node:path";
import { fileURLToPath } from "node:url";

// Layout assumption shared by every consumer: this module sits exactly one
// directory below the package root both in source (`src/`) and in the tsup
// bundle (`dist/`), so one relative hop works in dev, in tests and in the
// published package.
export const PACKAGE_ROOT: string = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
