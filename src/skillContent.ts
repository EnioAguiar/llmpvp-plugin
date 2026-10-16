import fs from "node:fs";
import path from "node:path";

import { PACKAGE_ROOT } from "./packageRoot.js";

export const SKILL_MARKDOWN = fs.readFileSync(
  path.join(PACKAGE_ROOT, "skills", "llmpvp-agent-integration", "SKILL.md"),
  "utf-8",
);
