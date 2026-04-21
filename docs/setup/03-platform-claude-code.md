---
setupVersion: "2026-04-17"
audience: "llm-agent"
platform: "claude-code"
loadOrder: 3
tokens: ~1500
---

# Claude Code — Munin Setup

End-to-end install of Munin memory for Claude Code. Two options: a simple `npx` MCP registration (recommended) or the full `munin-claude-code` plugin (adds hooks + skills). Per-project credentials, no global state.

## Prerequisites

- `claude` CLI installed and authenticated (`claude --version` succeeds).
- Shell `cwd` is the project root (the directory containing the project's `package.json` / `.git`). If not, `cd` there before continuing.

## Step 1 — Set credentials

Create `.env.local` in the project root. Both values come from the user — do not invent them.

```bash
# .env.local  (project root — gitignored by default)
MUNIN_API_KEY=ck_your_api_key
MUNIN_PROJECT=proj_your_project_id
```

Never use `.env` — it may be committed to git and can leak your key.

Add to `.gitignore` if not already covered:

```bash
git check-ignore -v .env.local || echo '.env.local' >> .gitignore
```

If you have the `munin-claude` CLI (needed for Option B plugin setup only), you can write to `.env.local` via:

```bash
munin-claude env set MUNIN_API_KEY <user-provided-key>
munin-claude env set MUNIN_PROJECT <user-provided-project>
```

Install it with `npm install -g @kalera/munin-claude` if missing.

## Step 2 — Register the MCP server

Claude Code can spawn the Munin MCP server either through the **plugin** (adds hooks + skills) or
through a direct **`npx`** registration (MCP tools only, simpler setup).

### Option A — `npx` (recommended for most users)

A single command, no plugin marketplace step, same pattern as the Codex CLI setup:

```bash
claude mcp add munin-memory --scope user \
  -- npx -y @kalera/munin-mcp-server@latest
```

This registers the server once for all projects. Each project switches context by pointing its `.env.local` at a different `MUNIN_PROJECT` — no need to re-register per repo.

This pattern was verified on **April 21, 2026** with Claude Code and Node.js v24.

Verify:

```bash
claude mcp list
# expect: munin-memory  ...  ✓ Connected
```

> **Why this works:** `munin-runtime` calls `process.cwd()` at startup and walks up ancestor
> directories looking for `.env.local`, then `.env`. Claude Code spawns the MCP server with the
> session working directory as CWD, so each project naturally resolves its own `MUNIN_API_KEY` and
> `MUNIN_PROJECT`.

> **DO NOT export `MUNIN_API_KEY` in `~/.zshrc` / `~/.bashrc`.** Per-project `.env.local` walk-up
> is the safe pattern — shell-wide exports leak credentials across projects.

### Option B — Plugin (adds hooks + skills)

Install the full `munin-claude-code` plugin if you want automatic session-start memory search,
session-end summaries, the `@munin` agent, and the error-catalog hook:

```bash
claude plugin marketplace add 3d-era/munin-for-agents
claude plugin install munin-claude-code@munin-ecosystem
```

Verify:

```bash
claude plugin list | grep munin
# expect: munin-claude-code@munin-ecosystem  (enabled)
```

> **DO NOT install the plugin globally or in `~/.claude` outside a project.** The plugin reads
> `.env.local` from the project root via directory walk-up. A global install with no project
> context will fail with `projectId is required`.

## Step 3 — Verify (smoke test)

This step has TWO parts. The first is an OPTIONAL pre-install check; the second is the canonical post-install verification.

### Step 3a — OPTIONAL: bootstrap `curl` smoke test (BEFORE the plugin is installed)

This bypasses MCP transport and isolates the credential/network layer. It is only useful BEFORE the plugin is installed — once the plugin is installed, prefer the MCP tool in Step 3b. Skip 3a if your plugin install in Step 2 already succeeded.

```bash
curl -s -X POST "https://munin.kalera.dev/api/mcp" \
  -H "Authorization: Bearer <user-provided-key>" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"<user-provided-project>","action":"recent","payload":{"limit":5}}'
```

Expected response:

```json
{ "ok": true, "data": [...] }
```

`{ "ok": true, "data": [] }` is also valid — empty project, not an error. **Do not proceed if `ok` is `false` or HTTP status is non-2xx.** Diagnose with the table below.

### Step 3b — Canonical post-install verification (MCP tool)

From a Claude Code session, invoke the MCP tool `munin_get_project_info`. Expected: `{ "ok": true, "encryptionKeyConfigured": <boolean>, "data": { ... server capabilities ... } }`. If the tool is missing from the session's tool list, restart the Claude Code session (MCP server and plugin manifests are cached at startup).

## Step 4 — Update CLAUDE.md

Append a single pointer line to the project's `CLAUDE.md` (do not inline the protocol — it stays in one canonical place):

```markdown
## Memory Protocol (Munin)

Follow the Memory Index Protocol from:
https://raw.githubusercontent.com/3d-era/munin-for-agents/main/docs/setup/01-methodology.md
— call `munin_search_memories` at task start, `munin_store_memory` at task end.
```

If `CLAUDE.md` does not exist, create it with just this section. Keep additions minimal — every token here is loaded into context on every Claude Code session.

> **DO NOT paste the 6 protocol rules inline.** They live in `01-methodology.md` and are versioned. Inlining causes drift between projects.

## Common issues

| Symptom | Fix |
|---|---|
| `MUNIN_API_KEY is required` | Check `.env.local` in the project root contains `MUNIN_API_KEY=ck_...`. If using the plugin: `munin-claude env set MUNIN_API_KEY <key>`. |
| `projectId is required` / silently empty results | `.env.local` must contain `MUNIN_PROJECT=proj_...`. Re-add if blank. |
| Session start shows "Loaded 0 memories" even with memories stored | `MUNIN_API_KEY` is missing from `.env.local`. Re-add it in the project root. |
| `401 Unauthorized` | Wrong key. Re-copy from https://munin.kalera.app/dashboard |
| `npx: command not found` | Node/npm toolchain not on PATH. Install Node.js and confirm `npx --version` works in the same shell that launches Claude Code. |
| `munin-memory` not in `claude mcp list` | Re-run `claude mcp add munin-memory --scope user -- npx -y @kalera/munin-mcp-server@latest` |
| `claude plugin install` says "plugin not found" | Re-run `claude plugin marketplace add 3d-era/munin-for-agents` first |
| `command not found: munin-claude` | `npm install -g @kalera/munin-claude` (only needed for Option B plugin setup) |
| MCP tools missing in session after install | Restart Claude Code session (MCP server and plugin manifests are cached at startup) |
| `EAI_AGAIN` / network timeout | Confirm `MUNIN_BASE_URL` is unset or equals `https://munin.kalera.dev` |
| Smoke test passes but MCP returns garbled content | Project has E2EE — set `MUNIN_ENCRYPTION_KEY` in `.env.local` (see methodology doc, §E2EE) |
| Returns memories from wrong project | `claude` launched from wrong directory. `cd` to the project root — the MCP server walks up from CWD. |

Setup complete when Step 3 returns `ok: true` and `claude mcp list` (Option A) or `claude plugin list` (Option B) shows the server connected.
