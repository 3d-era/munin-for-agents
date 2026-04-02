#!/usr/bin/env bash
# Munin Session Start Hook — Loads project memories at session start
# Reads project from .env in CWD, searches relevant memories

set -euo pipefail

CLAUDE_PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
MUNIN_PROJECT=""

# --- Detect projectId ---
if [[ -f "$CLAUDE_PROJECT_DIR/.env" ]]; then
  MUNIN_PROJECT=$(grep -E "^MUNIN_PROJECT=" "$CLAUDE_PROJECT_DIR/.env" 2>/dev/null | cut -d= -f2 | tr -d '"' | tr -d "'" | xargs)
fi
if [[ -z "$MUNIN_PROJECT" && -f "$CLAUDE_PROJECT_DIR/.env.local" ]]; then
  MUNIN_PROJECT=$(grep -E "^MUNIN_PROJECT=" "$CLAUDE_PROJECT_DIR/.env.local" 2>/dev/null | cut -d= -f2 | tr -d '"' | tr -d "'" | xargs)
fi

if [[ -z "$MUNIN_PROJECT" ]]; then
  echo '{"hookEventName":"SessionStart","additionalContext":""}'
  exit 0
fi

# --- Search recent memories via npx ---
PROJECT_KEY=$(basename "$CLAUDE_PROJECT_DIR" | tr '[:upper:]' '[:lower:]')

SEARCH_RESULT=$(MUNIN_PROJECT="$MUNIN_PROJECT" npx --yes @kalera/munin-claude call munin_recent_memories '{"limit":5}' 2>/dev/null || echo '{}')

MEMORY_COUNT=$(echo "$SEARCH_RESULT" | grep -o '"key"' | wc -l | xargs || echo 0)
PROJECT_NAME=$(basename "$CLAUDE_PROJECT_DIR")

CONTEXT="[Munin 🐢] Loaded $MEMORY_COUNT recent memories for '$PROJECT_NAME'. Use @kalera/munin to search deeper."

echo "{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"$CONTEXT\"}"
