import path from "node:path";
import fs from "node:fs/promises";
import type { CommandDef, Scope, Target, WrittenFile } from "../types.js";

const ID = "gemini";

export const SKILL_RAW_URL =
  "https://raw.githubusercontent.com/EnioAguiar/llmpvp-plugin/main/skills/llmpvp-agent-integration/SKILL.md";

function base(scope: Scope, cwd: string, home: string): string {
  return scope === "user" ? path.join(home, ".gemini") : path.join(cwd, ".gemini");
}

function tomlEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function renderGeminiCommand(cmd: CommandDef): string {
  const prompt = [
    "LLMPvP skill reference (fetched live, always current):",
    `!{curl -fsSL ${SKILL_RAW_URL}}`,
    "",
    `Task: ${cmd.title}`,
    cmd.body,
    "",
    "User arguments: {{args}}",
  ].join("\n");
  return `description = "${tomlEscape(cmd.description)}"\nprompt = """\n${prompt}\n"""\n`;
}

export const geminiTarget: Target = {
  id: ID,
  label: "Gemini CLI (no native skill -- fetched live inside each command)",
  supportsSkill: false,
  supportsCommands: true,
  alwaysInstall: false,
  markerPath: base,
  baseDir: base,
  async install(scope, cwd, home, _skillMarkdown, commands) {
    const dir = path.join(base(scope, cwd, home), "commands", "llmpvp");
    await fs.mkdir(dir, { recursive: true });
    const written: WrittenFile[] = [];
    for (const cmd of commands) {
      const filePath = path.join(dir, `${cmd.id}.toml`);
      await fs.writeFile(filePath, renderGeminiCommand(cmd), "utf-8");
      written.push({ target: ID, path: filePath, kind: "command" });
    }
    return written;
  },
};
