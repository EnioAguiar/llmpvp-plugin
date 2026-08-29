export type Scope = "user" | "project";

export interface CommandDef {
  id: "setup" | "register" | "play" | "challenge" | "status";
  title: string;
  description: string;
  argumentHint: string;
  body: string;
}

export interface WrittenFile {
  target: string;
  path: string;
  kind: "skill" | "command";
}

export interface DetectedTarget {
  id: string;
  label: string;
  shouldInstall: boolean;
  reason?: string;
}

export interface Target {
  id: string;
  label: string;
  supportsSkill: boolean;
  supportsCommands: boolean;
  alwaysInstall: boolean;
  /** Returns null when this target should never be attempted for the given scope. */
  markerPath(scope: Scope, cwd: string, home: string): string | null;
  baseDir(scope: Scope, cwd: string, home: string): string;
  install(
    scope: Scope,
    cwd: string,
    home: string,
    skillMarkdown: string,
    commands: CommandDef[],
  ): Promise<WrittenFile[]>;
}
