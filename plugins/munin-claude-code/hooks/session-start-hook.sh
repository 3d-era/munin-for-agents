#!/usr/bin/env bash
# Munin Session Start Hook — Loads project memories at session start
# Priority: 1. .env.local, 2. .env, 3. settings.json (deprecated, emits warning)

set -euo pipefail

CLAUDE_PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
MUNIN_PROJECT=""
MUNIN_API_KEY="${MUNIN_API_KEY:-}"

# --- Detect projectId ---
# 1. Per-project .env.local (highest priority)
if [[ -f "$CLAUDE_PROJECT_DIR/.env.local" ]]; then
  MUNIN_PROJECT=$(grep -E "^MUNIN_PROJECT=" "$CLAUDE_PROJECT_DIR/.env.local" 2>/dev/null | cut -d= -f2 | tr -d '"' | tr -d "'" | xargs)
  if [[ -z "$MUNIN_API_KEY" ]]; then
    MUNIN_API_KEY=$(grep -E "^MUNIN_API_KEY=" "$CLAUDE_PROJECT_DIR/.env.local" 2>/dev/null | cut -d= -f2 | tr -d '"' | tr -d "'" | xargs)
  fi
fi
# 2. Per-project .env
if [[ -z "$MUNIN_PROJECT" && -f "$CLAUDE_PROJECT_DIR/.env" ]]; then
  MUNIN_PROJECT=$(grep -E "^MUNIN_PROJECT=" "$CLAUDE_PROJECT_DIR/.env" 2>/dev/null | cut -d= -f2 | tr -d '"' | tr -d "'" | xargs)
fi
if [[ -z "$MUNIN_API_KEY" && -f "$CLAUDE_PROJECT_DIR/.env" ]]; then
  MUNIN_API_KEY=$(grep -E "^MUNIN_API_KEY=" "$CLAUDE_PROJECT_DIR/.env" 2>/dev/null | cut -d= -f2 | tr -d '"' | tr -d "'" | xargs)
fi
# 3. Global settings.json (deprecated — emit warning but use for session)
if [[ -z "$MUNIN_PROJECT" && -f "$HOME/.claude/settings.json" ]]; then
  SETTINGS_PROJECT=$(node -e "
    const fs = require('fs');
    try {
      const cfg = JSON.parse(fs.readFileSync('$HOME/.claude/settings.json', 'utf8'));
      if (cfg.env && cfg.env.MUNIN_PROJECT) {
        console.log(cfg.env.MUNIN_PROJECT);
      } else if (cfg.MUNIN_PROJECT) {
        console.log(cfg.MUNIN_PROJECT);
      }
    } catch(e) {}
  " 2>/dev/null || echo "")
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
PROJECT_KEY=$(basename "$CLAUDE_PROJECT_DIR" | tr '[:upper:]' '[:lower:]')

SEARCH_RESULT=$(MUNIN_PROJECT="$MUNIN_PROJECT" MUNIN_API_KEY="$MUNIN_API_KEY" npx --yes @kalera/munin-claude call munin_recent_memories '{"limit":5}' 2>/dev/null || echo '{}')

MEMORY_COUNT=$(echo "$SEARCH_RESULT" | grep -o '"key"' | wc -l | xargs || echo 0)
PROJECT_NAME=$(basename "$CLAUDE_PROJECT_DIR")

CONTEXT="[Munin 🐢] Loaded $MEMORY_COUNT recent memories for '$PROJECT_NAME'. Use @kalera/munin to search deeper."

echo "{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"$CONTEXT\"}"
