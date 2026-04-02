#!/usr/bin/env bash
# Munin Stop Hook — Saves session summary on stop
# Triggered on session end to persist conversation context

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
  echo '{"hookEventName":"Stop","systemMessage":""}'
  exit 0
fi

echo "{\"hookEventName\":\"Stop\",\"systemMessage\":\"[Munin 🐢] Đã tự động lưu session context vào Munin memory!\"}"
