# Build stage: compile TypeScript sources (src/cli.ts -> dist/cli.js via tsup)
FROM node:22-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.json tsup.config.ts ./
COPY src ./src
RUN npm run build

# Runtime stage: only the built CLI + production dependencies
FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/dist ./dist
# skillContent.ts reads skills/llmpvp-agent-integration/SKILL.md relative to
# the package root (dist/..) at import time -- required even for `mcp` mode,
# since cli.ts imports it unconditionally at the top of the module.
COPY skills ./skills
COPY commands ./commands

# Runs the MCP server over stdio, the same entrypoint `npx llmpvp-plugin mcp` uses.
ENTRYPOINT ["node", "dist/cli.js", "mcp"]
