import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COMMANDS } from "../src/commandsSource.js";
import { renderFrontmatterCommand } from "../src/commandWriter.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "..", "commands");

async function main(): Promise<void> {
  await fs.mkdir(outDir, { recursive: true });
  for (const cmd of COMMANDS) {
    const filePath = path.join(outDir, `${cmd.id}.md`);
    await fs.writeFile(filePath, renderFrontmatterCommand(cmd), "utf-8");
  }
  console.log(`Generated ${COMMANDS.length} command file(s) in ${outDir}`);
}

main();
