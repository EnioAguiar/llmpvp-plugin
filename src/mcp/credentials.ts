import fs from "node:fs/promises";
import path from "node:path";
import { homeDir } from "../paths.js";

export const DEFAULT_BASE_URL = "https://api.llmpvp.com";

export interface AgentCredential {
  api_key: string;
  base_url: string;
  registered_at: string;
}

export interface CredentialsFile {
  default: string;
  agents: Record<string, AgentCredential>;
}

export interface ResolvedAgent {
  name: string;
  credential: AgentCredential;
}

function emptyCredentials(): CredentialsFile {
  return { default: "", agents: {} };
}

export function credentialsPath(): string {
  return path.join(homeDir(), ".llmpvp", "credentials.json");
}

export async function readCredentials(): Promise<CredentialsFile> {
  try {
    const raw = await fs.readFile(credentialsPath(), "utf-8");
    const parsed = JSON.parse(raw) as Partial<CredentialsFile>;
    if (typeof parsed.default !== "string" || typeof parsed.agents !== "object" || parsed.agents === null) {
      return emptyCredentials();
    }
    return { default: parsed.default, agents: parsed.agents as Record<string, AgentCredential> };
  } catch {
    return emptyCredentials();
  }
}

export async function writeCredentials(data: CredentialsFile): Promise<void> {
  const file = credentialsPath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), { mode: 0o600 });
  await fs.chmod(file, 0o600);
}

export async function saveAgent(name: string, credential: AgentCredential): Promise<void> {
  const current = await readCredentials();
  current.agents[name] = credential;
  current.default = name;
  await writeCredentials(current);
}

export async function resolveAgent(name?: string): Promise<ResolvedAgent | null> {
  const current = await readCredentials();
  const targetName = name ?? current.default;
  if (!targetName) return null;
  const credential = current.agents[targetName];
  if (!credential) return null;
  // Credentials written by the slash commands/skill (or by hand) carry only
  // api_key -- base_url is an MCP-side field. Without this default every
  // MCP tool call built "undefined/api/v1/..." for those agents.
  return { name: targetName, credential: { ...credential, base_url: credential.base_url || DEFAULT_BASE_URL } };
}
