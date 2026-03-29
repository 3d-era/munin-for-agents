# Munin Adapter for Qwen Code

Scaffold adapter generated from generic MCP template.

## Usage

```ts
import { createQwenCodeMuninAdapter } from "@kalera/munin-qwen";

const adapter = createQwenCodeMuninAdapter({
  baseUrl: process.env.MUNIN_BASE_URL ?? "https://munin.kalera.dev",
  apiKey: process.env.MUNIN_API_KEY,
  project: process.env.MUNIN_PROJECT ?? "default-core",
});

await adapter.execute("list", { limit: 10 });
```
