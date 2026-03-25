# Munin Adapter for Gemini CLI

## Status

- Phase: scaffold
- Dispatch style: `callTool(name, args)`

## Usage

```ts
import { createGeminiCliMuninAdapter } from "munin/gemini";

const adapter = createGeminiCliMuninAdapter({
  baseUrl: process.env.MUNIN_BASE_URL!,
  apiKey: process.env.MUNIN_API_KEY,
  project: process.env.MUNIN_PROJECT ?? "default",
});

await adapter.callTool("list", { limit: 10 });
```
