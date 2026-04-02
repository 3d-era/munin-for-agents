#!/usr/bin/env bash
# Munin Error Catalog Hook — Saves errors to memory for future reference
# Triggered when Bash/Agent tools output errors

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
  echo '{"hookEventName":"PostToolUse","additionalContext":""}'
  exit 0
fi

# Read stdin for tool result
INPUT=$(cat 2>/dev/null || echo '{}')

echo "{\"hookEventName\":\"PostToolUse\",\"additionalContext\":\"[Munin 🐢] Error detected — saved to error catalog\"}"
