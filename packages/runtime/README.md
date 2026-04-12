# @kalera/munin-runtime

MCP (Model Context Protocol) server runtime for Munin Context Core. Works with any MCP-compatible client (Claude Code, Cursor, etc.).

## Install

```bash
npm install @kalera/munin-runtime
```

## Available Tools

| Tool | Description |
|------|-------------|
| `munin_store_memory` | Store or update a memory |
| `munin_retrieve_memory` | Retrieve a memory by key |
| `munin_search_memories` | Semantic/keyword search |
| `munin_list_memories` | List all memories (paginated) |
| `munin_recent_memories` | Most recently updated memories |
| `munin_share_memory` | Share memories across projects |
| `munin_get_project_info` | Get project metadata and E2EE status |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MUNIN_API_KEY` | Yes | Your Munin API key |
| `MUNIN_PROJECT` | Yes* | Active project ID (*or pass as tool arg) |
| `MUNIN_BASE_URL` | No | Default: `https://munin.kalera.dev` |
| `MUNIN_TIMEOUT_MS` | No | Request timeout (default: 15000) |
| `MUNIN_ENCRYPTION_KEY` | No | Encryption key for E2EE projects |

## Usage as MCP Server

```bash
MUNIN_API_KEY=your-key MUNIN_PROJECT=your-project npx @kalera/munin-runtime
```

## Claude Code Integration

Configure in your `~/.claude/settings.json`:

```json
{
  "pluginConfigs": {
    "munin": {
      "command": "npx",
      "args": ["@kalera/munin-runtime"]
    }
  }
}
```

Set required env vars in your project's `.env` or `.env.local`.

## License

MIT
