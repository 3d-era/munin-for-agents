---
setupVersion: "2026-04-17"
audience: "llm-agent"
platform: "hermes-agent"
loadOrder: 8
tokens: ~1400
---

# Platform Setup — Hermes Agent

End-to-end installation of the Munin memory layer for [Hermes Agent](https://github.com/nicobailey/hermes). Hermes uses a YAML-based `config.yaml` for MCP server registration and a `.env` file in its working directory for credentials.

**Context model:** Hermes agents typically run in a **single-project context** — one Munin project is shared across all sessions. The MCP server is registered once in the agent's global config.

**Prerequisites:**

- Hermes Agent installed and running (`hermes --version` succeeds).
- `MUNIN_API_KEY` (`ck_xxx`) and `MUNIN_PROJECT` (`proj_xxx`) provided by the user.
- Node.js installed (`node --version` succeeds) — required to run the MCP server.

---

## Step 1 — Install the MCP server package

Use `npx` (recommended) or install globally. The `npx` approach keeps setup minimal — no global binary to maintain.

**Option A — `npx` (recommended)**

No pre-install step needed. `npx` fetches and caches the package on first run. Jump to Step 2 — the `npx` command is embedded directly in the MCP server config.

**Option B — Global install**

For lower cold-start latency or deterministic binary resolution:

```bash
npm install -g @kalera/munin-mcp-server@latest
```

Verify: `munin-mcp-server --version` (or check the binary is on PATH).

---

## Step 2 — Configure credentials

Hermes loads environment variables from `~/.hermes/.env` (the agent's working directory). Add the Munin credentials there. The user provides the values — do not invent them.

```bash
# Append to ~/.hermes/.env
# MUNIN MCP MEMORY SERVER
MUNIN_API_KEY=ck_your_api_key
MUNIN_PROJECT=proj_your_project_id
```

For **E2EE projects** only, also add:

```bash
MUNIN_ENCRYPTION_KEY=your_hash_key
```

Verify:

```bash
grep -i MUNIN ~/.hermes/.env
# expect: MUNIN_API_KEY=ck_... and MUNIN_PROJECT=proj_...
```

---

## Step 3 — Register the MCP server in Hermes config

Hermes uses a `mcp_servers` section in `~/.hermes/config.yaml`. Each entry defines a command, arguments, and environment variables passed to the MCP server process.

### Option A — Using `npx`

```yaml
# In ~/.hermes/config.yaml
mcp_servers:
  munin-memory:
    command: npx
    args:
      - -y
      - @kalera/munin-mcp-server@latest
    env:
      MUNIN_API_KEY: ${MUNIN_API_KEY}
      MUNIN_PROJECT: ${MUNIN_PROJECT}
    timeout: 120
    connect_timeout: 60
```

### Option B — Using global binary

```yaml
# In ~/.hermes/config.yaml
mcp_servers:
  munin-memory:
    command: munin-mcp-server
    env:
      MUNIN_API_KEY: ${MUNIN_API_KEY}
      MUNIN_PROJECT: ${MUNIN_PROJECT}
    timeout: 120
    connect_timeout: 60
```

> **How it works:** `${MUNIN_API_KEY}` and `${MUNIN_PROJECT}` are resolved from `~/.hermes/.env` at MCP server startup. The MCP server (via `munin-runtime`) also walks up from its CWD looking for `.env.local` then `.env` — but for Hermes the `.env` in the agent's working directory is the canonical location.

> **DO NOT hardcode API keys in `config.yaml`.** Use `${VAR_NAME}` variable references — this keeps secrets out of the config file (which may be shared or versioned).

If `mcp_servers` already exists with other entries, add `munin-memory` as an additional entry under the same key. Do not overwrite existing MCP servers.

---

## Step 4 — Restart the agent

Hermes loads MCP servers at startup. After editing `config.yaml` or `.env`, restart the agent:

```bash
hermes restart
```

Or: stop the running agent process and relaunch via your normal entrypoint (systemd, Docker, etc.).

---

## Step 5 — Verify

### Step 5a — Bootstrap `curl` smoke test (optional, before restart)

```bash
curl -s -X POST "https://munin.kalera.dev/api/mcp" \
  -H "Authorization: Bearer <user-provided-key>" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"<user-provided-project>","action":"recent","payload":{"limit":2}}'
```

Expected: `{"ok":true,"action":"recent","data":[...]}`. Any non-2xx or `"ok":false` — fix credentials before continuing.

### Step 5b — Canonical post-install verification (MCP tool)

From a Hermes session, invoke the MCP tool `munin_get_project_info`. Expected:

```json
{
  "ok": true,
  "encryptionKeyConfigured": false,
  "data": { ... server capabilities ... }
}
```

If the tool is missing from the session's tool list, the MCP server failed to connect. Check the Hermes startup logs for connection errors, then re-verify Steps 2–4.

Then verify memory access:

Call `munin_recent_memories` with `limit: 3`. Expected: `{"ok":true,"data":[...]}` (empty array is fine for new projects).

---

## Step 6 — Update HERMES.md

Hermes reads persistent agent instructions from `HERMES.md` in the agent's working root (`~/.hermes/HERMES.md`). This file is loaded into every session's context. Append the Memory Protocol pointer:

```markdown
## Memory Protocol (Munin)

This agent uses Munin for persistent memory. Follow the Memory Index Protocol from:
https://raw.githubusercontent.com/3d-era/munin-for-agents/main/docs/setup/01-methodology.md
— call `munin_search_memories` at task start, `munin_store_memory` at task end.
```

If `HERMES.md` does not exist, create it with just this section.

> **DO NOT paste the 6 protocol rules inline.** They live in `01-methodology.md` and are versioned. Inlining causes drift.

---

## Step 7 — (Optional) Load the Munin Memory Protocol skill

Hermes supports a skills system. For richer Munin integration (automatic search-before-acting, structured tagging, batch store), load the `munin-memory-protocol` skill:

```bash
hermes skills load munin-memory-protocol
```

Or manually create `~/.hermes/skills/munin-memory-protocol/SKILL.md` with the content from `01-methodology.md`. This gives the agent persistent procedural knowledge of the Munin workflow across all sessions.

---

## Common issues

| Symptom | Cause | Fix |
|---|---|---|
| `npx: command not found` | Node.js not on PATH for the Hermes process | Install Node.js and confirm `npx --version` works in the same shell that launches Hermes |
| `munin-mcp-server` not found (global install) | Binary not on PATH | `npm install -g @kalera/munin-mcp-server@latest`, or switch to `npx` registration |
| `MUNIN_API_KEY is required` | Credentials missing from `.env` | Re-run Step 2 — add `MUNIN_API_KEY` to `~/.hermes/.env` |
| `projectId is required` / empty results | `MUNIN_PROJECT` missing from `.env` | Re-run Step 2 — add `MUNIN_PROJECT` to `~/.hermes/.env` |
| MCP tools missing from session | MCP server failed to connect at startup | Check Hermes logs; re-verify `config.yaml` syntax (YAML indentation matters); restart agent |
| `401 Unauthorized` | Wrong API key | Re-copy from [munin.kalera.app/dashboard](https://munin.kalera.app/dashboard) |
| Garbled / empty content | E2EE project, wrong or missing encryption key | Add `MUNIN_ENCRYPTION_KEY` to `~/.hermes/.env` |
| `EAI_AGAIN` / network timeout | DNS/proxy issue | Confirm `MUNIN_BASE_URL` is unset or `https://munin.kalera.dev` |
| `${MUNIN_API_KEY}` not resolved | Hermes `.env` file doesn't exist or isn't loaded | Confirm `~/.hermes/.env` exists with the correct variables; some Hermes setups may require a restart after editing `.env` |
| Returns memories from wrong project | `MUNIN_PROJECT` points to wrong project | Check `~/.hermes/.env` and update the project ID |

---

Setup complete when Step 5 returns `ok: true` and the MCP tools (`munin_search_memories`, `munin_store_memory`, etc.) appear in the session's tool list.

> **NOTE:** `munin_acknowledge_setup` is ONLY for HTTP 426 `ERR_STALE_PROTOCOL` remediation — it is NOT part of the first-install flow. Do not call it now; call it only if a write later returns the stale-protocol error (see `02-troubleshooting.md` §1).
