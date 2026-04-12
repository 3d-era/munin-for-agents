# @kalera/munin-sdk

TypeScript SDK for [Munin Context Core](https://munin.kalera.dev) — a long-term memory system for AI agents with E2EE and GraphRAG.

## Install

```bash
npm install @kalera/munin-sdk
```

## Quick Start

```typescript
import { MuninClient } from "@kalera/munin-sdk";

const client = new MuninClient({
  baseUrl: "https://munin.kalera.dev",
  apiKey: process.env.MUNIN_API_KEY,
});

// Store a memory
await client.store("my-project", {
  key: "architecture-decision-001",
  content: "We chose PostgreSQL over MongoDB for ACID compliance.",
  tags: ["architecture", "database"],
});

// Retrieve it
const result = await client.retrieve("my-project", { key: "architecture-decision-001" });

// Semantic search
const search = await client.search("my-project", { query: "database decisions" });
```

## API

### `new MuninClient(config?)`

| Option | Default | Description |
|--------|---------|-------------|
| `baseUrl` | `https://munin.kalera.dev` | Munin API base URL |
| `apiKey` | — | API key (`MUNIN_API_KEY`) |
| `timeoutMs` | `15000` | Request timeout in milliseconds |
| `fetchImpl` | global `fetch` | Custom fetch implementation |

### Methods

| Method | Description |
|--------|-------------|
| `store(projectId, payload)` | Store or update a memory |
| `retrieve(projectId, payload)` | Retrieve a memory by key |
| `search(projectId, payload)` | Semantic/keyword search |
| `list(projectId, payload?)` | List all memories (paginated) |
| `recent(projectId, payload?)` | Most recently updated memories |
| `share(projectId, memoryIds, targetProjectIds)` | Share memories across projects |
| `capabilities(forceRefresh?)` | Get server capability flags |

## Encryption

For E2EE projects, set the `MUNIN_ENCRYPTION_KEY` environment variable. The SDK will automatically inject it into store/retrieve requests.

## License

MIT
