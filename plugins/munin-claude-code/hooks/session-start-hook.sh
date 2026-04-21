#!/usr/bin/env bash
# Munin Session Start Hook — Loads project memories at session start
# Priority: 1. .env.local, 2. .env, 3. settings.json (deprecated, emits warning)

set -euo pipefail

# Resolve real script directory even when invoked through a symlink.
# Pure bash so it works on macOS (which lacks GNU `readlink -f`).
_SCRIPT="${BASH_SOURCE[0]}"
_HOPS=0
while [[ -L "$_SCRIPT" && $_HOPS -lt 40 ]]; do
  _DIR="$(cd -P "$(dirname "$_SCRIPT")" && pwd)"
  _SCRIPT="$(readlink "$_SCRIPT")"
  [[ "$_SCRIPT" != /* ]] && _SCRIPT="$_DIR/$_SCRIPT"
  _HOPS=$((_HOPS + 1))
done
SCRIPT_DIR="$(cd -P "$(dirname "$_SCRIPT")" && pwd)"
# Guard against a broken install (missing helper, symlink cycle resolving to a
# wrong directory). Emit a valid empty-context JSON so Claude Code still
# receives a parseable response rather than seeing the hook crash.
if [[ ! -f "$SCRIPT_DIR/lib/_env.sh" ]]; then
  echo '{"hookEventName":"SessionStart","additionalContext":""}'
  exit 0
fi
# shellcheck source=lib/_env.sh
. "$SCRIPT_DIR/lib/_env.sh"

CLAUDE_PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
MUNIN_PROJECT=""
MUNIN_API_KEY="${MUNIN_API_KEY:-}"

# --- Detect projectId (priority: .env.local > .env) ---
[[ -z "$MUNIN_PROJECT" ]] && MUNIN_PROJECT=$(read_env_var "$CLAUDE_PROJECT_DIR/.env.local" MUNIN_PROJECT)
[[ -z "$MUNIN_PROJECT" ]] && MUNIN_PROJECT=$(read_env_var "$CLAUDE_PROJECT_DIR/.env" MUNIN_PROJECT)

# --- Detect API key (priority: existing env > .env.local > .env) ---
[[ -z "$MUNIN_API_KEY" ]] && MUNIN_API_KEY=$(read_env_var "$CLAUDE_PROJECT_DIR/.env.local" MUNIN_API_KEY)
[[ -z "$MUNIN_API_KEY" ]] && MUNIN_API_KEY=$(read_env_var "$CLAUDE_PROJECT_DIR/.env" MUNIN_API_KEY)

# 3. Global settings.json (deprecated — emit warning but use for session)
if [[ -z "$MUNIN_PROJECT" && -f "$HOME/.claude/settings.json" ]]; then
  # Pass settings path via argv so values inside $HOME (e.g. an apostrophe)
  # cannot break the inline node script.
  SETTINGS_PROJECT=$(node -e "
    const fs = require('fs');
    try {
      const cfg = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
      if (cfg.env && cfg.env.MUNIN_PROJECT) {
        console.log(cfg.env.MUNIN_PROJECT);
      } else if (cfg.MUNIN_PROJECT) {
        console.log(cfg.MUNIN_PROJECT);
      }
    } catch(e) {}
  " "$HOME/.claude/settings.json" 2>/dev/null || echo "")
  if [[ -n "$SETTINGS_PROJECT" ]]; then
    echo '[Munin 🐢] WARNING: MUNIN_PROJECT is set in ~/.claude/settings.json (global, deprecated for multi-project). Move it to project .env: run `munin-claude env set MUNIN_PROJECT '"$SETTINGS_PROJECT"'` then remove from settings.json.' >&2
    MUNIN_PROJECT="$SETTINGS_PROJECT"
  fi
fi

if [[ -z "$MUNIN_PROJECT" ]]; then
  echo '{"hookEventName":"SessionStart","additionalContext":""}'
  exit 0
fi

# --- Search recent memories via npx ---
SEARCH_RESULT=$(MUNIN_PROJECT="$MUNIN_PROJECT" MUNIN_API_KEY="$MUNIN_API_KEY" npx --yes @kalera/munin-claude call munin_recent_memories '{"limit":5}' 2>/dev/null || echo '{}')

# Count "key" occurrences (one per memory). grep -o emits one line per match
# so wc -l counts occurrences, not lines — this matters because the upstream
# JSON is usually compact (all matches on one line). `|| true` prevents the
# pipefail trap from killing the script when grep finds zero matches.
MEMORY_COUNT=$(printf '%s' "$SEARCH_RESULT" | grep -o '"key"' | wc -l | tr -d ' ' || true)
[[ -z "$MEMORY_COUNT" || ! "$MEMORY_COUNT" =~ ^[0-9]+$ ]] && MEMORY_COUNT=0
PROJECT_NAME=$(basename "$CLAUDE_PROJECT_DIR")

CONTEXT="[Munin 🐢] Loaded $MEMORY_COUNT recent memories for '$PROJECT_NAME'. Use @kalera/munin to search deeper."

printf '{"hookEventName":"SessionStart","additionalContext":"%s"}\n' "$(json_escape "$CONTEXT")"
