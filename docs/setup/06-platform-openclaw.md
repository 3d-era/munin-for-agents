---
setupVersion: "2026-04-17"
audience: "llm-agent"
platform: "openclaw-miniclaw"
loadOrder: 6
tokens: ~1200
---

# Platform Setup — OpenClaw / MiniClaw

## Applies to

This guide configures Munin (persistent memory) for the **OpenClaw family of agents**:

- **OpenClaw** — primary OpenClaw runtime
- **MiniClaw** — lightweight OpenClaw variant

> **Hermes Agent** (the open-source courier agent) has its own platform file: `08-platform-hermes-agent.md`. Use that instead if your agent is Hermes.

All three share the same plugin loader and CLI surface (`openclaw config`, `openclaw plugins`, `openclaw exec`). The setup below is identical regardless of which one you are running.

> **Context model:** OpenClaw-family agents run in a **single-project context** — one memory project is shared across every session. If you need per-directory project switching, use `03-platform-claude-code.md` instead.

**Prerequisites:**

- Credentials already verified per `00-index.md` §2 (Credentials — bootstrap `curl` smoke test)
- `MUNIN_API_KEY` (`ck_xxx`) and `MUNIN_PROJECT` (`proj_xxx`) on hand
- `MUNIN_ENCRYPTION_KEY` if the project has E2EE enabled

---

## Step 1 — Install the plugin

```bash
openclaw plugins install @kalera/munin-openclaw
```

This registers the plugin under the key `munin-openclaw` in the agent's plugin entries. Confirm it appears in the registry:

```bash
openclaw plugins list | grep munin-openclaw
```

---

## Step 2 — Configure credentials

Write the API key and project ID into the plugin's config namespace. Replace `<user-provided-*>` with the actual values — do not invent them.

```bash
openclaw config set plugins.entries.munin-openclaw.config.apiKey "<user-provided-key>"
openclaw config set plugins.entries.munin-openclaw.config.projectId "<user-provided-project>"
```

For **E2EE projects** only, also export the encryption key into the agent's environment so the plugin can decrypt payloads at runtime:

```bash
export MUNIN_ENCRYPTION_KEY="<user-provided-hash-key>"
```

> **E2EE note:** Persist `MUNIN_ENCRYPTION_KEY` in the shell profile (`~/.zshrc`, `~/.bashrc`) that launches the agent — `openclaw config` does **not** store secrets that must remain client-side.

Verify the values were written:

```bash
openclaw config get plugins.entries.munin-openclaw.config.projectId
```

Expected output: `proj_xxx` (the project ID you just set).

---

## Step 3 — Restart the agent

OpenClaw-family agents load plugins at startup; new credentials are not picked up until the process restarts.

```bash
openclaw restart
# Or: kill the running agent and relaunch via your normal entrypoint
```

For **Hermes** and **MiniClaw**, use their respective restart command (`hermes restart`, `miniclaw restart`) — the plugin contract is identical.

---

## Step 4 — Verify

Run the plugin's list action through the agent's exec bridge. This is the canonical end-to-end smoke test: it proves the plugin loaded, credentials are valid, and the project ID resolves.

```bash
openclaw exec munin-openclaw munin_list_memories
```

**Expected output:**

```json
{ "ok": true, "data": [...] }
```

— or, for a fresh project:

```json
{ "ok": true, "data": [] }
```

**Failure modes:**

| Output | Meaning | Fix |
|---|---|---|
| `{ "ok": false, "error": "MUNIN_API_KEY is required" }` | Credentials not loaded | Re-run Step 2, then Step 3 |
| `{ "ok": false, "error": "Invalid API key" }` | Wrong key or revoked | Re-confirm with user, re-run Step 2 |
| `{ "ok": false, "error": "Project not found" }` | Wrong `projectId` | Re-confirm with user, re-run Step 2 |
| Plugin not found | Step 1 skipped or failed | Re-run Step 1 |

Do not proceed past this step until you see `{ "ok": true, ... }`.

---

## Step 5 — Update agent config

OpenClaw-family agents use a `CLAUDE.md`-equivalent config file (commonly `OPENCLAW.md`, `HERMES.md`, or `MINICLAW.md` at the agent's working root) to inject persistent instructions into every session. Append a pointer to the methodology file so the agent always loads the Memory Index Protocol.

Add this block to the agent's config file:

```markdown
## Munin Memory

This agent uses Munin for persistent memory. Follow the Memory Index Protocol
defined in `01-methodology.md` of the Munin setup guide:

- BEFORE every task: call `munin_search_memories`
- AFTER every task: call `munin_store_memory`
- ON bug fixes: store an `error-catalog` entry
```

If the agent does not have a config file, create one at the agent's working root using the conventional name for that variant (`OPENCLAW.md` / `HERMES.md` / `MINICLAW.md`).

---

## Common issues

| Symptom | Likely cause | Fix |
|---|---|---|
| `Plugin 'munin-openclaw' not found` | Install step failed silently | Re-run Step 1; check network egress to the npm registry |
| Verify returns `{ "ok": false }` after restart | Config written to wrong namespace | Re-run Step 2 — confirm key path is `plugins.entries.munin-openclaw.config.*`, not `plugins.munin-openclaw.*` |
| E2EE project returns garbled / empty content | `MUNIN_ENCRYPTION_KEY` not exported in agent's shell | Add `export MUNIN_ENCRYPTION_KEY=...` to the shell profile that launches the agent, then restart |
| Credentials work in `curl` but fail in agent | Agent is reading from a stale config cache | Run `openclaw config reload` (or restart agent) after every `config set` |
| Tools missing from agent's tool list | Plugin loaded but exec bridge disabled | Confirm `plugins.entries.munin-openclaw.enabled = true` in the agent's config |

---

**Next:** `05-platform-gemini.md` (skip if not also setting up Gemini CLI), or return to `00-index.md` for the canonical MCP tool reference.

> **NOTE:** `munin_acknowledge_setup` is ONLY for HTTP 426 `ERR_STALE_PROTOCOL` remediation — it is NOT part of the first-install flow. Do not call it now; call it only if a write later returns the stale-protocol error (see `02-troubleshooting.md` §1).
