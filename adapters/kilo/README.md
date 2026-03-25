# Munin Adapter for Kilo Code

Scaffold adapter generated from generic MCP template.

## Usage

```ts
import { createKiloCodeMuninAdapter } from "munin/kilo";

const adapter = createKiloCodeMuninAdapter({
  baseUrl: process.env.MUNIN_BASE_URL!,
  apiKey: process.env.MUNIN_API_KEY,
  project: process.env.MUNIN_PROJECT ?? "default",
});

await adapter.run("search", { query: "munin" });
```
