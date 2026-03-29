# Munin Adapter for Gemini CLI

## Status

- Phase: scaffold
- Dispatch style: `callTool(name, args)`

## Usage

```ts
import { createGeminiCliMuninAdapter } from "@kalera/munin-gemini";

const adapter = createGeminiCliMuninAdapter({
  baseUrl: process.env.MUNIN_BASE_URL ?? "https://munin.kalera.dev",
  apiKey: process.env.MUNIN_API_KEY,
  project: process.env.MUNIN_PROJECT ?? "default-core",
});

await adapter.callTool("your-context-core-id", "list", { limit: 10 });
```

## Setup as Extension

To use this adapter as an extension for Gemini CLI:

1. Create a `gemini-extension.json` (see examples in this repo).
2. Configure environment variables:
```bash
export MUNIN_BASE_URL="https://munin.kalera.dev"
export MUNIN_API_KEY="your-api-key"
export MUNIN_PROJECT="your-context-core-id"
```
