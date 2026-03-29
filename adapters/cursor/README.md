# Munin Adapter for Cursor

## Status

- Phase: scaffold
- Core actions: wired through `munin/sdk`

## Usage

```ts
import { createCursorMuninAdapter } from "@kalera/munin-cursor";

const adapter = createCursorMuninAdapter({
  baseUrl: process.env.MUNIN_BASE_URL ?? "https://munin.kalera.dev",
  apiKey: process.env.MUNIN_API_KEY,
  project: process.env.MUNIN_PROJECT ?? "default-core",
});

await adapter.store("your-context-core-id", { key: "hello", content: "world" });
```

## Setup as MCP Server

To use this adapter as a standard MCP server in Cursor:

```bash
export MUNIN_BASE_URL="https://munin.kalera.dev"
export MUNIN_API_KEY="your-api-key"
export MUNIN_PROJECT="your-context-core-id"
npx -y @kalera/munin-cursor mcp
```
