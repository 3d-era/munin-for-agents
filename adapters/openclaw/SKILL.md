---
name: "@kalera/munin-openclaw"
description: "Munin - The Free (or $1.6/mo) Persistent Memory for OpenClaw. Stop your agent from having Alzheimer's."
version: "1.0.2"
metadata:
  clawdbot:
    type: "plugin"
    permissions:
      env: ["MUNIN_BASE_URL", "MUNIN_API_KEY", "MUNIN_PROJECT", "MUNIN_ENCRYPTION_KEY"]
---

# Munin: Reliable Memory for Your OpenClaw Agent

<CRITICAL-INSTRUCTION>
**HOW TO USE THIS SKILL**:
All `munin_*` actions are registered as native tools (MCP).
You MUST call them using your standard tool-calling interface (e.g. `callTool("munin_search_memories", {...})`).
**DO NOT under any circumstances try to run them as shell commands or bash scripts.**
</CRITICAL-INSTRUCTION>

## Available Tools

| Tool | Purpose |
|------|---------|
| `munin_store_memory` | Store or update a memory |
| `munin_retrieve_memory` | Get memory by exact key |
| `munin_search_memories` | Semantic search |
| `munin_list_memories` | Paginated list of all memories |
| `munin_recent_memories` | Most recently updated memories |
| `munin_share_memory` | Share memories to other projects (Pro/Elite only) |

## Before Any Task
1. Call `munin_search_memories` with keywords relevant to the current task
2. Call `munin_retrieve_memory` for detailed context on promising matches
3. Present findings — DO NOT guess, verify from memory first

## After Completing a Task
Call `munin_store_memory` with:
- **title**: Concise summary (max 80 chars)
- **content**: Detailed description including file paths, line numbers, decisions
- **tags**: Relevant tags (e.g., `task`, `architecture`, `bug-fix`, `setup`, `decision`)

---

## E2EE & Hash Key

Every E2EE project uses a Hash Key — the password the user set in the WebUI.

**Setup:** Set `MUNIN_ENCRYPTION_KEY=<hash-key>` in your environment. The adapter automatically passes this key to all tool calls.

**Critical:**
- Wrong Hash Key → all reads/writes fail. Re-confirm with the user.
- NEVER log or share the Hash Key in plain text.
- NEVER hardcode the Hash Key in scripts.

### E2EE + GraphRAG (Elite Tier)
`munin_store_memory` payload MUST include an `embedding` field (encrypted vector generated client-side). Server returns HTTP 400 if missing.

### Sharing Across Projects
Use `munin_share_memory({ memoryIds: [...], targetProjectIds: [...] })` (Pro/Elite only).
- Target project must share the same Hash Key to read encrypted content.
- If target has E2EE ON and key differs → shared memory is unreadable until the target's Hash Key is updated.

---

## Setup

1. **Install the plugin:**
   ```bash
   openclaw plugins install @kalera/munin-openclaw
   ```
2. **Get your key:** [munin.kalera.dev](https://munin.kalera.dev)
3. **Configure:**
   ```bash
   openclaw config set plugins.entries.munin-openclaw.config.apiKey "your-api-key"
   openclaw config set plugins.entries.munin-openclaw.config.projectId "your-project-id"
   ```
   Or via env vars: `MUNIN_BASE_URL`, `MUNIN_API_KEY`, `MUNIN_PROJECT`
4. **E2EE:** Add `MUNIN_ENCRYPTION_KEY=<hash-key>` if the project has E2EE enabled.
5. **Restart OpenClaw** — the agent will now have access to all `munin_*` tools.
6. **Profit.**

*Built with ❤️ by Kalera for the OpenClaw Ecosystem.*
