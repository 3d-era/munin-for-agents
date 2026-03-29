# Munin Adapter for Claude Code

## Status

- Phase: scaffold
- Dispatch style: generic `execute(action, payload)`

## Usage

```ts
import { createClaudeCodeMuninAdapter } from "@kalera/munin-claude";

const adapter = createClaudeCodeMuninAdapter({
  baseUrl: process.env.MUNIN_BASE_URL ?? "https://munin.kalera.dev",
  apiKey: process.env.MUNIN_API_KEY,
  project: process.env.MUNIN_PROJECT ?? "default-core",
});

await adapter.execute("search", { query: "ecosystem" });
```

## Setup as MCP Server

To use this adapter as a standard MCP server in Claude Desktop or other clients:

```bash
export MUNIN_BASE_URL="https://munin.kalera.dev"
export MUNIN_API_KEY="your-api-key"
export MUNIN_PROJECT="your-context-core-id"
npx -y @kalera/munin-claude mcp
```
