---
setupVersion: "2026-04-17"
audience: "llm-agent"
platform: "cursor-mcp-native"
loadOrder: 4
tokens: ~1500
---

# Platform Setup — Cursor / Kilo / Qwen / MCP-native

## Applies to

This file is the **generic fallback** for any editor that speaks MCP (Model Context Protocol) natively but does not have a dedicated Munin plugin. Use it when the decision matrix in `00-index.md` routes you here.

| Editor | Use this file |
|---|---|
| Cursor | Yes — primary target |
| Kilo Code | Yes — same pattern |
| Qwen Code | Yes — same pattern |
| Cline / Roo / Continue | Yes — same pattern |
| Any other MCP-native client | Yes |

If the user's editor has a dedicated Munin plugin (Claude Code, Gemini CLI, OpenClaw), prefer that file — it gives a better integration. Only use this generic flow when no dedicated plugin exists.

**Prerequisites:** Credential verification per `00-index.md` §2 must already pass — run the bootstrap `curl` smoke test (acceptable pre-install) and confirm a 2xx response with `{ "ok": true, ... }`. Do not proceed until credentials are verified.

---

## Step 1 — Install Munin MCP server

The MCP server is published as `@kalera/munin-mcp-server` and is invoked via `npx` on demand. **No global install is needed** — `npx -y` fetches the latest version per spawn.

Optional warm-up (avoids first-spawn latency in the editor):

```bash
npx -y @kalera/munin-mcp-server@latest --version
```

Expected: prints a version string (e.g. `1.x.x`) and exits 0. Any non-zero exit means the package is unreachable — fix npm/network before continuing.

---

## Step 2 — Add to MCP config

Cursor reads MCP servers from `.cursor/mcp.json` (per-workspace) or `~/.cursor/mcp.json` (user-global). **Prefer per-workspace** so each project can pin its own `MUNIN_PROJECT`.

Create or edit `.cursor/mcp.json` in the workspace root:

```json
{
  "mcpServers": {
    "munin-memory": {
      "command": "npx",
      "args": ["-y", "@kalera/munin-mcp-server@latest"],
      "env": {
        "MUNIN_API_KEY": "<user-provided-key>",
        "MUNIN_PROJECT": "<user-provided-project>",
        "MUNIN_BASE_URL": "https://munin.kalera.dev"
      }
    }
  }
}
```

**Anti-pattern — DO NOT hardcode the API key in a committed `mcp.json`.** If the workspace is a git repo, either:

- Add `.cursor/mcp.json` to `.gitignore`, OR
- Replace the literal key with a shell expansion the editor will resolve at spawn (e.g. `"MUNIN_API_KEY": "${env:MUNIN_API_KEY}"` in Cursor 0.45+), and put the real value in `.env.local` (Step 3).

For E2EE projects, also add:

```json
"MUNIN_ENCRYPTION_KEY": "<user-provided-hash-key>"
```

---

## Step 3 — Workspace `.env.local`

MCP servers spawned by Cursor inherit only the `env` block declared in `mcp.json` — they **do not** automatically inherit the editor's process env or your shell rc files. The `.env.local` fallback is needed because:

- It lets the MCP server resolve `MUNIN_PROJECT` when no explicit env is passed (the runtime walks up the directory tree).
- It keeps the secret out of the committed `mcp.json`.
- It works the same way for Kilo and Qwen.

In the workspace root:

```bash
# .env.local  (add to .gitignore)
MUNIN_API_KEY=<user-provided-key>
MUNIN_PROJECT=<user-provided-project>
# E2EE only:
MUNIN_ENCRYPTION_KEY=<user-provided-hash-key>
```

Verify the file is ignored:

```bash
git check-ignore -v .env.local
```

Expected: prints the ignore rule. If it prints nothing, add `.env.local` to `.gitignore` immediately.

---

## Step 4 — Verify

1. **Restart the editor** (or use `Cmd+Shift+P` → "MCP: Restart Servers" in Cursor). MCP server config is read once at startup — edits to `mcp.json` require a reload.
2. Open the **MCP Tools** panel:
   - Cursor: `Cmd+Shift+P` → "MCP: List Tools" — confirm `munin-memory` is listed with green status.
   - Kilo / Qwen: open the MCP servers panel from settings.
3. From the agent chat, run:

   ```
   munin_get_project_info
   ```

   Expected response shape (server capabilities + client encryption-key flag — NOT per-project tier/E2EE):

   ```json
   {
     "ok": true,
     "encryptionKeyConfigured": false,
     "data": {
       "specVersion": "v1.0.0",
       "actions": {
         "core": ["store", "store_batch", "retrieve", "search", "list", "recent"],
         "optional": ["share", "versions", "diff", "export", "rollback", "encrypt", "decrypt", "acknowledge_setup"]
       },
       "features": {
         "semanticSearch": { "supported": true },
         "encryption": { "supported": true }
       },
       "metadata": { "serverVersion": "1.3.0", "timestamp": "..." }
     }
   }
   ```

   `encryptionKeyConfigured` reflects whether `MUNIN_ENCRYPTION_KEY` is set in the MCP server's env — it does NOT indicate whether the project itself has E2EE on. Confirm project E2EE state with the user.

4. Then run `munin_recent_memories` with `{ "limit": 3 }`. Expected: `{ "ok": true, "data": [...] }` (empty array is fine for new projects).

If the tool list is empty or shows red, jump to **Common issues** below.

---

## Common issues

| Symptom | Cause | Fix |
|---|---|---|
| `munin-memory` not in MCP Tools panel | `mcp.json` not reloaded | Restart editor or "MCP: Restart Servers" |
| Tool listed but red / "failed to start" | `npx` not on PATH for the editor | Use absolute `node` path, or run `corepack enable`; check editor logs |
| `MUNIN_API_KEY is required` | Env passthrough missing | Add key to `mcp.json` `env` block AND `.env.local` |
| `projectId is required` | `MUNIN_PROJECT` missing | Set in `mcp.json` env AND `.env.local` |
| `401 Unauthorized` | Wrong API key | Re-copy from [dashboard](https://munin.kalera.app/dashboard) |
| Empty results on every search | Wrong project ID | Run `munin_get_project_info` and confirm it matches the dashboard |
| Garbled / encrypted-looking content | Wrong `MUNIN_ENCRYPTION_KEY` | Confirm the hash key with the user (see `02-troubleshooting.md` E2EE section) |
| `EAI_AGAIN` / network error | Server unreachable or proxy | Verify `MUNIN_BASE_URL=https://munin.kalera.dev` |

---

## Per-platform notes

### Kilo Code

Kilo's MCP config lives at `.kilocode/mcp.json` (workspace) or `~/.kilocode/mcp.json` (global). Schema is identical to Cursor — copy the `mcpServers` block from Step 2 verbatim. Reload via "Kilo: Reload MCP Servers".

### Qwen Code

Qwen reads from `.qwen/settings.json` under a `mcpServers` key. The structure matches Cursor; nest the `munin-memory` block under `"mcpServers"` and reload the editor. Some Qwen builds require `"transport": "stdio"` to be explicit — add it if the server fails to start.

### Cline / Roo / Continue

These also use the same `mcpServers` schema, typically under `cline_mcp_settings.json` (or the IDE-specific equivalent in VS Code's `globalStorage`). Copy the Step 2 block; the Step 3 `.env.local` fallback applies unchanged.

---

## Step 5 — Memory Index Protocol

If the workspace has a `CLAUDE.md`, `AGENTS.md`, or platform-specific instruction file, merge in the **Memory Index Protocol** from `01-methodology.md`. Without it, the agent will not call `munin_search_memories` at task start and Munin gives no value.

---

*Next file: `01-methodology.md` — the rules every agent must follow on every task.*
