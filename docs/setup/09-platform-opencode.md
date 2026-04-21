---
setupVersion: "2026-04-21"
audience: "llm-agent"
platform: "opencode"
loadOrder: 9
tokens: ~1600
---

# Platform Setup — OpenCode

End-to-end installation of the Munin memory layer for OpenCode. Use a project-local `opencode.json` so each repo can point at its own Munin project through `.env.local`.

**Prerequisites:**

- `opencode` CLI installed (`opencode --version` succeeds).
- Node.js installed (`node --version` succeeds) so OpenCode can spawn the Munin MCP server.
- `MUNIN_API_KEY` (`ck_xxx`) and `MUNIN_PROJECT` (`proj_xxx`) provided by the user.

---

## Step 1 — Bootstrap smoke test (before OpenCode setup)

Verify credentials and network first. This isolates auth/connectivity from MCP transport.

```bash
curl -s -X POST "https://munin.kalera.dev/api/mcp" \
  -H "Authorization: Bearer <user-provided-key>" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"<user-provided-project>","action":"recent","payload":{"limit":2}}'
```

Expected: HTTP 2xx and `{"ok":true,...}`.

Do not continue until this passes.

---

## Step 2 — Create project-local `.env.local`

OpenCode should keep Munin credentials per project, not in global config.

In the project root:

```bash
# .env.local  (add to .gitignore)
MUNIN_API_KEY=ck_your_api_key
MUNIN_PROJECT=proj_your_project_id
# E2EE only:
# MUNIN_ENCRYPTION_KEY=your_hash_key
```

Verify `.env.local` is ignored:

```bash
git check-ignore -v .env.local
```

Expected: the ignore rule is printed. If nothing is printed, add `.env.local` to `.gitignore` before continuing.

---

## Step 3 — Add Munin MCP config to `opencode.json`

Create `opencode.json` in the project root.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "munin-memory": {
      "type": "local",
      "command": ["npx", "-y", "@kalera/munin-mcp-server@latest"],
      "enabled": true
    }
  },
  "tools": {
    "munin-memory_*": false,
    "munin-memory_munin_search_memories": true,
    "munin-memory_munin_store_memory": true,
    "munin-memory_munin_retrieve_memory": true,
    "munin-memory_munin_recent_memories": true,
    "munin-memory_munin_list_memories": true,
    "munin-memory_munin_acknowledge_setup": true,
    "munin-memory_munin_share_memory": true,
    "munin-memory_munin_get_project_info": true
  }
}
```

### Why the tool allowlist is required

As of **April 21, 2026**, OpenCode can connect to the Munin MCP server normally, but some rare Munin tools published by the server use schemas that OpenCode's current Responses-based providers reject before the session starts. Disabling all `munin-memory_*` tools first, then explicitly re-enabling the core Munin workflow tools above, avoids the provider-side schema failure while preserving the normal Memory Index Protocol flow.

This was verified on:

- OpenCode `1.4.0`
- Node.js `v22.22.2`
- Munin MCP server `1.4.1`

---

## Step 4 — Windows and macOS/Linux notes

### macOS / Linux

Use the `command` array exactly as shown in Step 3:

```json
["npx", "-y", "@kalera/munin-mcp-server@latest"]
```

### Windows

OpenCode on Windows was verified to work with the same bare `npx` command array:

```json
["npx", "-y", "@kalera/munin-mcp-server@latest"]
```

If your local shell or PATH setup prevents OpenCode from spawning `npx`, use this fallback instead:

```json
["cmd", "/c", "npx", "-y", "@kalera/munin-mcp-server@latest"]
```

Prefer the bare `npx` form unless Windows startup fails.

---

## Step 5 — Verify the MCP server is connected

Run:

```bash
opencode mcp list
```

Expected:

```text
munin-memory  connected
```

If the server is missing or disconnected, fix `opencode.json`, Node/npm, or network issues before continuing.

---

## Step 6 — Canonical post-install verification

From the project root, run an OpenCode session that invokes `munin_get_project_info`:

```bash
opencode run --dangerously-skip-permissions \
  "Use the munin-memory tool. Call munin_get_project_info and print only the raw JSON result."
```

Expected response shape:

```json
{
  "ok": true,
  "encryptionKeyConfigured": false,
  "specVersion": "v1.0.0",
  "actions": {
    "core": ["store", "store_batch", "retrieve", "search", "list", "recent"],
    "optional": ["share", "versions", "diff", "export", "rollback", "encrypt", "decrypt", "acknowledge_setup"]
  },
  "features": {
    "semanticSearch": { "supported": true },
    "encryption": { "supported": true }
  }
}
```

Then verify memory access:

```bash
opencode run --dangerously-skip-permissions \
  "Use the munin-memory tool. Call munin_recent_memories with limit 3 and print only the raw JSON result."
```

Expected: `{"ok":true,"data":[...]}`. An empty array is fine for a new project.

---

## Step 7 — Update project instructions

OpenCode should load the Memory Index Protocol from the project's instruction file (`AGENTS.md` or equivalent). Add this pointer if it is missing:

```markdown
## Memory Protocol (Munin)

Follow the Memory Index Protocol from:
https://raw.githubusercontent.com/3d-era/munin-for-agents/main/docs/setup/01-methodology.md
— call `munin_search_memories` at task start, `munin_store_memory` at task end.
```

Keep the instruction as a pointer only. Do not paste the full methodology inline.

---

## Common issues

| Symptom | Cause | Fix |
|---|---|---|
| `No MCP servers configured` | `opencode.json` missing or not loaded from project root | Create `opencode.json` in the repo root and rerun from that directory |
| `munin-memory` disconnected | `npx` or Node.js unavailable | Install Node.js and confirm `npx -y @kalera/munin-mcp-server@latest --version` succeeds |
| OpenCode fails before any prompt runs with an invalid schema error for a Munin tool | Rare Munin tool schema rejected by the current provider | Keep the Step 3 `tools` allowlist in place |
| `MUNIN_API_KEY is required` | `.env.local` missing or not in the project root | Recreate `.env.local` in the repo root |
| `projectId is required` | `MUNIN_PROJECT` missing | Add it to `.env.local` |
| `401 Unauthorized` | Wrong API key | Re-copy from [munin.kalera.app/dashboard](https://munin.kalera.app/dashboard) |
| Garbled or empty content | E2EE project, wrong or missing `MUNIN_ENCRYPTION_KEY` | Add the correct hash key to `.env.local` |
| Windows only: `npx` fails to spawn | PATH/shell resolution issue | Switch the `command` array to `cmd /c npx ...` |

Setup is complete when `opencode mcp list` shows `munin-memory` connected and the Step 6 `munin_get_project_info` call returns `ok: true`.
