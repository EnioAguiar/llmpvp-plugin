import type { Target } from "../types.js";
import { claudeTarget } from "./claude.js";
import { agentsUniversalTarget } from "./agentsUniversal.js";
import { piTarget } from "./pi.js";
import { ompTarget } from "./omp.js";
import { codexTarget } from "./codex.js";
import { opencodeTarget } from "./opencode.js";
import { geminiTarget } from "./gemini.js";
import { kiloTarget } from "./kilo.js";
import { cursorTarget } from "./cursor.js";

export const targets: Target[] = [
  claudeTarget,
  agentsUniversalTarget,
  piTarget,
  ompTarget,
  codexTarget,
  opencodeTarget,
  geminiTarget,
  kiloTarget,
  cursorTarget,
];
