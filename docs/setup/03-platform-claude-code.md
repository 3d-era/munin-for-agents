---
setupVersion: "2026-04-17"
audience: "llm-agent"
platform: "claude-code"
loadOrder: 3
tokens: ~1500
---

# Claude Code — Munin Setup

End-to-end install for the `munin-claude-code` plugin in a single project. Per-project credentials, no global state.

## Prerequisites

- `claude` CLI installed and authenticated (`claude --version` succeeds).
- Shell `cwd` is the project root (the directory containing the project's `package.json` / `.git`). If not, `cd` there before continuing.

## Step 1 — Set credentials

Run from the project root. Both values come from the user — do not invent them.

```bash
munin-claude env set MUNIN_API_KEY <user-provided-key>
munin-claude env set MUNIN_PROJECT <user-provided-project>
```

These write to `.env.local` in the current directory (gitignored by default — never `.env`, which may be committed).

Verify both are set:

```bash
munin-claude env get MUNIN_API_KEY   # non-empty (ck_...)
munin-claude env get MUNIN_PROJECT   # proj_...
```

If `munin-claude` is missing, install once globally: `npm install -g @kalera/munin-claude`.

## Step 2 — Install plugin

```bash
claude plugin marketplace add 3d-era/munin-for-agents
claude plugin install munin-claude-code@munin-ecosystem
```

Verify the plugin is registered:

```bash
claude plugin list | grep munin
# expect: munin-claude-code@munin-ecosystem  (enabled)
```

> **DO NOT install the plugin globally or in `~/.claude` outside a project.** The plugin reads `.env.local` from the project root via directory walk-up. A global install with no project context will fail with `projectId is required`.

> **DO NOT export `MUNIN_API_KEY` in `~/.zshrc` / `~/.bashrc` for Claude Code.** Claude Code supports per-project `.env.local` walk-up; shell-wide exports leak credentials across projects and override per-project `.env.local`. Other platforms (e.g., Gemini CLI) may require shell-wide exports — see their platform doc (`05-platform-gemini.md`) for the rationale.

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

From a Claude Code session, invoke the MCP tool `munin_get_project_info`. Expected: `{ "ok": true, "encryptionKeyConfigured": <boolean>, "data": { ... server capabilities ... } }`. If the tool is missing from the session's tool list, the plugin did not load — restart the Claude Code session (plugin manifest is cached at startup).

## Step 4 — Update CLAUDE.md

Append a single pointer line to the project's `CLAUDE.md` (do not inline the protocol — it stays in one canonical place):

```markdown
## Memory

Follow the Memory Index Protocol from
https://raw.githubusercontent.com/3d-era/munin-for-agents/main/munin-ecosystem/docs/setup/01-methodology.md
— call `munin_search_memories` at task start, `munin_store_memory` at task end.
```

> **NOTE (path verification):** The raw URL above assumes the published `munin-for-agents` repo mirrors this monorepo's `munin-ecosystem/docs/setup/` path. If the publish pipeline rewrites the path (e.g., to `docs/setup/01-methodology.md` at repo root), update the URL accordingly before shipping CLAUDE.md to users.

If `CLAUDE.md` does not exist, create it with just this section. Keep additions minimal — every token here is loaded into context on every Claude Code session.

> **DO NOT paste the 6 protocol rules inline.** They live in `01-methodology.md` and are versioned. Inlining causes drift between projects.

## Common issues

| Symptom | Fix |
|---|---|
| `MUNIN_API_KEY is required` | `munin-claude env set MUNIN_API_KEY <key>` from project root |
| `projectId is required` / silently empty results | `munin-claude env get MUNIN_PROJECT` — must show `proj_...`; re-set if blank |
| `401 Unauthorized` | Wrong key. Ask user to re-copy from https://munin.kalera.app/dashboard |
| `claude plugin install` says "plugin not found" | Re-run `claude plugin marketplace add 3d-era/munin-for-agents` first |
| `command not found: munin-claude` | `npm install -g @kalera/munin-claude` |
| Plugin loads but tools missing in session | Restart Claude Code session (plugin manifest cached at startup) |
| `EAI_AGAIN` / network timeout | Confirm `MUNIN_BASE_URL` unset or equals `https://munin.kalera.dev` |
| Smoke test passes but plugin returns garbled content | Project has E2EE — set `MUNIN_ENCRYPTION_KEY` (see methodology doc, §E2EE) |

Setup complete when Step 3 returns `ok: true` and `claude plugin list` shows `munin-claude-code` enabled.
