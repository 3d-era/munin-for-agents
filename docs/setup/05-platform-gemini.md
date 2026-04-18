---
setupVersion: "2026-04-17"
audience: "llm-agent"
platform: "gemini-cli"
loadOrder: 5
tokens: ~1300
---

# Platform Setup — Gemini CLI

End-to-end installation of the Munin memory layer for a Gemini CLI agent. Execute steps in order; each step has a verification gate. Do not advance until verification passes.

**Prerequisites assumed satisfied** (from earlier docs in this set):

- `MUNIN_API_KEY` (`ck_xxx`) and `MUNIN_PROJECT` (`proj_xxx`) provided by the user.
- Smoke test against `https://munin.kalera.dev/api/mcp` already passed.
- Gemini CLI is installed and runs (`gemini --version` returns a version).

---

## Step 1 — Install the extension

The Munin extension is loaded by Gemini CLI from `~/.gemini/extensions/`. Each extension lives in its own directory and is described by a single JSON file.

Create the directory and config file:

```bash
mkdir -p ~/.gemini/extensions
cat > ~/.gemini/extensions/munin-extension.json <<'JSON'
{
  "name": "munin-memory",
  "version": "1.3.0",
  "command": "npx",
  "args": ["-y", "@kalera/munin-gemini@latest", "mcp", "gemini-cli-extension"]
}
JSON
```

Notes on the config:

- `name` — must be `munin-memory`. Other Munin docs and the agent's `GEMINI.md` refer to tools under this namespace.
- `version` — pin to `1.3.0` or later. `latest` on the package keeps the runtime current; only the extension manifest version is pinned.
- `command` + `args` — Gemini CLI will spawn `npx -y @kalera/munin-gemini@latest mcp gemini-cli-extension` as a long-lived MCP child process.

**Verify:**

```bash
test -f ~/.gemini/extensions/munin-extension.json && echo OK
gemini extensions list 2>/dev/null | grep -i munin
```

Expected: `OK`, then a line containing `munin-memory`. If `gemini extensions list` is unavailable in your CLI version, skip that check — Step 4 is the real verification.

---

## Step 2 — Set environment variables

The extension reads credentials from the parent shell, **not** from the JSON manifest.

> **Why shell-wide export here (vs. `.env.local` in Claude Code):** Gemini CLI is single-project-per-shell — its extension does not perform a `.env.local` directory walk-up. For a Gemini-only setup, exporting to your shell profile is the correct pattern. **For multiple projects: use separate terminal sessions, each with its own `MUNIN_PROJECT` exported in that session only** — do not cross the streams. If you also use Claude Code on the same machine, prefer per-project `.env.local` for that platform and keep Gemini's shell exports tightly scoped.

Append to the active shell profile:

```bash
# zsh
cat >> ~/.zshrc <<'ENV'
export MUNIN_API_KEY="ck_xxx"      # replace with user-provided key
export MUNIN_PROJECT="proj_xxx"    # replace with user-provided project
# Only if the project has E2EE enabled:
# export MUNIN_ENCRYPTION_KEY="<user-provided-hash-key>"
ENV

# bash: same block, target ~/.bashrc instead
```

Reload and verify in the **same shell** that will launch Gemini:

```bash
source ~/.zshrc   # or: source ~/.bashrc
node -e "console.log('API_KEY:', !!process.env.MUNIN_API_KEY, '| PROJECT:', process.env.MUNIN_PROJECT || 'NOT SET')"
```

Expected: `API_KEY: true | PROJECT: proj_xxx`.

If `MUNIN_PROJECT` shows `NOT SET`, the export did not load — open a new terminal or re-source the file before continuing.

---

## Step 3 — Update GEMINI.md

Gemini CLI reads agent instructions from `GEMINI.md` (project root, fallback `~/.gemini/GEMINI.md`). The Memory Index Protocol must be present so the agent calls Munin at task start and end.

Pull the canonical methodology into the agent file by reference:

```bash
# From the project root that the agent will run in:
{
  echo ""
  echo "## Munin Memory Layer"
  echo ""
  echo "Follow the Memory Index Protocol defined in:"
  echo "\`munin-ecosystem/docs/setup/01-methodology.md\`"
  echo ""
  echo "Hard rules (do not skip):"
  echo "1. At task start: call \`munin_search_memories\` with task-relevant keywords."
  echo "2. At task end: call \`munin_store_memory\` with title, content, tags."
  echo "3. On bug fix: search error catalog first; store fix with tag \`error-catalog\`."
  echo "4. Before \`/compact\`: store any unwritten outcomes."
} >> GEMINI.md
```

If `GEMINI.md` already contains a Munin section, do **not** duplicate it — verify it points to `01-methodology.md` and continue.

---

## Step 4 — Verify (smoke test inside Gemini CLI)

Launch Gemini and confirm the MCP child process started and is reachable. From an interactive Gemini session:

```
> Use the munin_get_project_info tool and show me the raw response.
```

Expected JSON shape (server capabilities + client encryption-key flag — NOT per-project tier/E2EE):

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

`encryptionKeyConfigured` reflects whether `MUNIN_ENCRYPTION_KEY` is set in the MCP child process's env — it does NOT indicate whether the project itself has E2EE on. Confirm per-project E2EE state with the user.

If the agent reports the tool is unknown, the extension did not load — see **Common issues** below.

Independent shell-level smoke test (does not require a Gemini session):

```bash
curl -sX POST "https://munin.kalera.dev/api/mcp" \
  -H "Authorization: Bearer $MUNIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"projectId\":\"$MUNIN_PROJECT\",\"action\":\"recent\",\"payload\":{}}" \
  | head -c 200
```

Expected prefix: `{"ok":true,`. Anything else: stop and resolve before using the agent.

---

## Common issues

| Symptom | Root cause | Fix |
|---|---|---|
| Gemini reports `munin_*` tools unknown | Extension JSON malformed or wrong path | Validate with `python -m json.tool ~/.gemini/extensions/munin-extension.json`; ensure file is at exact path `~/.gemini/extensions/munin-extension.json`. |
| `MUNIN_API_KEY is required` in MCP logs | Env vars not in Gemini's parent shell | Confirm `echo $MUNIN_API_KEY` returns the key in the shell where you run `gemini`. Restart terminal if unsure. |
| `npx` hangs on first launch | First-time package fetch | Pre-warm: `npx -y @kalera/munin-gemini@latest --help` once, then relaunch Gemini. |
| `401 Unauthorized` | Wrong/expired API key | Re-copy from `https://munin.kalera.app/dashboard` and re-export. |
| Empty `data: []` on every search | Wrong `MUNIN_PROJECT` | `echo $MUNIN_PROJECT` and confirm it matches the dashboard project ID exactly (case-sensitive, full `proj_` prefix). |
| Garbled content on read | E2EE project, wrong `MUNIN_ENCRYPTION_KEY` | Confirm hash key with user; never log it. |
| Network error `EAI_AGAIN` | DNS/proxy blocking `munin.kalera.dev` | Check `MUNIN_BASE_URL` override is not set to a stale value. |

When all four steps pass, the Gemini CLI agent has persistent memory. Proceed to the next setup doc in load order, or begin work — the agent must now follow the Memory Index Protocol on every task.
