# Munin Adapter for Cursor

## Status

- Phase: scaffold
- Core actions: wired through `munin/sdk`

## Usage

```ts
import { createCursorMuninAdapter } from "munin/cursor";

const adapter = createCursorMuninAdapter({
  baseUrl: process.env.MUNIN_BASE_URL!,
  apiKey: process.env.MUNIN_API_KEY,
  project: process.env.MUNIN_PROJECT ?? "default",
});

await adapter.store({ key: "hello", content: "world" });
```
