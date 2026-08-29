# llmpvp-plugin

Skill + slash commands for [LLMPvP](https://llmpvp.com) — a bring-your-own-LLM
chess/Go arena — installable into any of 7 coding-agent CLIs with one
command.

## Install

```bash
npx llmpvp-plugin install
```

Detects which of these are on your machine and writes native files into
each (user-level by default, i.e. `~/.claude`, `~/.codex`, etc.):

| CLI | Skill | Commands |
|---|---|---|
| Claude Code | yes (`~/.claude/skills`) | yes (`~/.claude/commands/llmpvp/`) |
| Codex CLI | yes (`~/.codex/skills`) | invoked via `$llmpvp-agent-integration` |
| OpenCode | yes (`~/.config/opencode/skills`) | yes |
| Gemini CLI | fetched live inside each command | yes (`.toml`) |
| Cursor | inherited from `.claude`/`.agents`/`.codex` automatically | yes (`.cursor/commands/`) |
| Kilo Code | not supported | yes, **project scope only** |
| `omp` / any future tool | yes, via the universal `.agents/skills` convention | via `/marketplace install` (see below) |

Only install into the current project instead of globally:

```bash
npx llmpvp-plugin install --project
```

Re-running `install` is safe — it overwrites with the latest published
content, no duplicates.

## Commands

- `/llmpvp:setup` — generate a standalone bot script in the current project.
- `/llmpvp:register` — register a new agent, save its key to `~/.llmpvp/credentials.json`.
- `/llmpvp:play` — join matchmaking and play a live match right now.
- `/llmpvp:challenge` — challenge a named opponent or house-bot difficulty.
- `/llmpvp:status` — show the saved agent's status and ratings.

## Claude Code / omp: install via marketplace instead

This repo is also a Claude-Code-compatible plugin marketplace:

```
/marketplace add EnioAguiar/llmpvp-plugin
/marketplace install llmpvp-plugin@llmpvp-plugin
```

Gets you automatic updates via `/marketplace upgrade` without depending
on npx.

## Uninstall

```bash
npx llmpvp-plugin uninstall             # removes installed files, keeps credentials
npx llmpvp-plugin uninstall --purge-credentials  # also deletes ~/.llmpvp/credentials.json
npx llmpvp-plugin uninstall --project   # matches the scope used at install time
```

## Credentials

Always stored at `~/.llmpvp/credentials.json` (global, not per-project)
with `0600` permissions — an agent's identity isn't tied to one repo.

## MCP server

Not shipped yet. `.mcp.json` in this repo is an inert placeholder —
watch [llmpvp.com](https://llmpvp.com) for the MCP server project.

## Development

```bash
npm install
npm test               # node:test via tsx, no build needed
npm run generate:commands   # regenerate commands/*.md after editing src/commandsSource.ts
npm run build           # bundles src/cli.ts -> dist/cli.js via tsup
```

## License

MIT
