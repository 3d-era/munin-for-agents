# munin-sdk

Python SDK for [Munin Context Core](https://munin.kalera.dev) — a long-term memory system for AI agents with E2EE and GraphRAG.

## Install

```bash
pip install munin-sdk
```

## Quick Start

```python
from munin_sdk import MuninClient

client = MuninClient(
    base_url="https://munin.kalera.dev",
    api_key=os.environ["MUNIN_API_KEY"],
)

# Store a memory
client.store("my-project", {
    "key": "architecture-decision-001",
    "content": "We chose PostgreSQL over MongoDB for ACID compliance.",
    "tags": ["architecture", "database"],
})

# Retrieve it
result = client.retrieve("my-project", {"key": "architecture-decision-001"})

# Semantic search
search = client.search("my-project", {"query": "database decisions"})
```

## API

### `MuninClient`

| Option | Default | Description |
|--------|---------|-------------|
| `base_url` | `https://munin.kalera.dev` | Munin API base URL |
| `api_key` | — | API key (`MUNIN_API_KEY`) |
| `timeout` | `15` | Request timeout in seconds |

### Methods

| Method | Description |
|--------|-------------|
| `store(project_id, payload)` | Store or update a memory |
| `retrieve(project_id, payload)` | Retrieve a memory by key |
| `search(project_id, payload)` | Semantic/keyword search |
| `list(project_id, payload?)` | List all memories (paginated) |
| `recent(project_id, payload?)` | Most recently updated memories |
| `share(project_id, memory_ids, target_project_ids)` | Share across projects |

## Encryption

For E2EE projects, set the `MUNIN_ENCRYPTION_KEY` environment variable. The SDK will automatically inject it into store/retrieve requests.

## License

MIT
