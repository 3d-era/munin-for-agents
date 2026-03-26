# Munin Adapter for Claude Code

## Status

- Phase: scaffold
- Dispatch style: generic `execute(action, payload)`

## Usage

```ts
import { createClaudeCodeMuninAdapter } from "@kalera/munin-claude";

const adapter = createClaudeCodeMuninAdapter({
  baseUrl: process.env.MUNIN_BASE_URL!,
  apiKey: process.env.MUNIN_API_KEY,
  project: process.env.MUNIN_PROJECT ?? "default",
});

await adapter.execute("search", { query: "ecosystem" });
```
