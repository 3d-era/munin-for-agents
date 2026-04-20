---
setupVersion: "2026-04-17"
audience: "llm-agent"
platform: "codex-cli"
loadOrder: 7
tokens: ~1400
---

# Platform Setup — OpenAI Codex CLI

End-to-end installation of the Munin memory layer for the OpenAI Codex CLI. Execute steps in order; each step has a verification gate.

**Prerequisites:**

- `codex` CLI installed and authenticated (`codex --version` succeeds).
- `MUNIN_API_KEY` (`ck_xxx`) and `MUNIN_PROJECT` (`proj_xxx`) provided by the user.

---

## Step 1 — Install the MCP server globally

Codex spawns MCP servers as child processes. Install `@kalera/munin-mcp-server` globally so Codex can find it by name without npx:

```bash
npm install -g @kalera/munin-mcp-server@latest
```

Verify:

```bash
munin-mcp-server --version   # should print a version string, then exit
```

> **Why global install (vs. `npx`) for Codex:** Codex spawns MCP servers via the `command` field in `~/.codex/config.toml`. Using `npx` here causes an ESM/symlink mismatch on Node.js 18+ that prevents the server from starting (the server exits immediately without responding to MCP handshake). A global install avoids this — the binary resolves to the real file path.

---

## Step 2 — Register the MCP server (global, API key only)

Run from any directory — this registers the server once for all projects:

```bash
codex mcp add munin-memory \
  --env "MUNIN_API_KEY=<user-provided-key>" \
  -- munin-mcp-server
```

**Do not set `MUNIN_PROJECT` here.** Leave it out of the global config — project ID is resolved per-project via `.env.local` (Step 3). Only `MUNIN_API_KEY` belongs in the global config because it is a user credential shared across all projects.

Verify:

```bash
codex mcp list
# expect: munin-memory  munin-mcp-server  ...  enabled
```

For E2EE projects, also pass `--env "MUNIN_ENCRYPTION_KEY=<user-provided-hash-key>"` (this is also user-scoped and belongs in global config).

---

## Step 3 — Per-project `.env.local`

The MCP server inherits Codex's working directory and walks up the directory tree to find `MUNIN_PROJECT`. Create `.env.local` in each project root:

```bash
# .env.local  (one file per project root)
MUNIN_PROJECT=proj_your_project_id
```

Add it to `.gitignore` if not already covered:

```bash
git check-ignore -v .env.local || echo '.env.local' >> .gitignore
```

This is the only per-project change needed. Switch projects by `cd`-ing to a different directory — Codex picks up whichever `.env.local` is nearest the working directory.

> **Why this works:** `munin-runtime` calls `process.cwd()` at startup and walks up ancestor directories looking for `.env.local`, then `.env`. Codex spawns the MCP server with the session working directory as CWD, so each project naturally resolves its own `MUNIN_PROJECT`.

---

## Step 4 — Allow MCP tool calls

By default, Codex requires user approval before each MCP tool call. In non-interactive (`exec`) mode this auto-cancels every call. Disable the elicitation gate globally:

```bash
# Append to ~/.codex/config.toml
cat >> ~/.codex/config.toml << 'EOF'

[features]
tool_call_mcp_elicitation = false
EOF
```

In **interactive mode** (running `codex` without `exec`), Codex presents an approval prompt per call — this is fine for interactive use and does not need the above change. Only apply the setting if you primarily use `codex exec`.

---

## Step 5 — Verify

### Smoke test (direct HTTP — no Codex session needed)

```bash
curl -s -X POST "https://munin.kalera.dev/api/mcp" \
  -H "Authorization: Bearer <user-provided-key>" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"<user-provided-project>","action":"recent","payload":{"limit":2}}'
```

Expected: `{"ok":true,"action":"recent","data":[...]}`. Any non-2xx or `"ok":false` — stop and fix credentials before continuing.

### MCP tool test (via Codex exec)

```bash
codex exec --dangerously-bypass-approvals-and-sandbox \
  "Call munin_get_project_info from the munin-memory MCP server and print the raw JSON."
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
codex exec --dangerously-bypass-approvals-and-sandbox \
  "Call munin_recent_memories from munin-memory with limit 3 and print the result."
```

Expected: `{"ok":true,"data":[...]}` (empty array is fine for new projects).

---

## Step 6 — Update AGENTS.md

Codex reads agent instructions from `AGENTS.md` in the project root. Add the Memory Protocol pointer:

```markdown
## Memory Protocol (Munin)

Follow the Memory Index Protocol from:
https://raw.githubusercontent.com/3d-era/munin-for-agents/main/docs/setup/01-methodology.md
— call `munin_search_memories` at task start, `munin_store_memory` at task end.
```

If `AGENTS.md` does not exist, create it with just this section.

---

## Common issues

| Symptom | Cause | Fix |
|---|---|---|
| `munin-mcp-server: command not found` | Not globally installed | `npm install -g @kalera/munin-mcp-server@latest` |
| `MCP startup failed: connection closed: initialize response` | Using `npx` instead of global binary | Remove the server (`codex mcp remove munin-memory`) and re-add using `-- munin-mcp-server` (global binary, no npx) |
| `user cancelled MCP tool call` in exec mode | `tool_call_mcp_elicitation` is enabled | Add `[features] tool_call_mcp_elicitation = false` to `~/.codex/config.toml` |
| `MUNIN_API_KEY is required` | Env not passed to MCP server | Re-add with `--env "MUNIN_API_KEY=<key>"` |
| `projectId is required` / empty results | No `.env.local` in project root or ancestors | Create `.env.local` with `MUNIN_PROJECT=proj_xxx` in the project root |
| Returns memories from wrong project | `codex` launched from wrong directory | `cd` to the project root before running `codex`; the MCP server walks up from CWD |
| `401 Unauthorized` | Wrong API key | Re-copy from [munin.kalera.app/dashboard](https://munin.kalera.app/dashboard) |
| Garbled content | E2EE project, wrong key | Re-add with `--env "MUNIN_ENCRYPTION_KEY=<hash-key>"` |
| `EAI_AGAIN` / network error | DNS/proxy issue | Confirm `MUNIN_BASE_URL` is unset or `https://munin.kalera.dev` |

---

*Next file: `01-methodology.md` — the memory protocol every agent must follow on every task.*
