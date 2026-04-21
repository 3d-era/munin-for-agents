#!/usr/bin/env bash
# Munin Stop Hook — Saves session summary on stop
# Triggered on session end to persist conversation context

set -euo pipefail

# Resolve real script directory even when invoked through a symlink.
_SCRIPT="${BASH_SOURCE[0]}"
_HOPS=0
while [[ -L "$_SCRIPT" && $_HOPS -lt 40 ]]; do
  _DIR="$(cd -P "$(dirname "$_SCRIPT")" && pwd)"
  _SCRIPT="$(readlink "$_SCRIPT")"
  [[ "$_SCRIPT" != /* ]] && _SCRIPT="$_DIR/$_SCRIPT"
  _HOPS=$((_HOPS + 1))
done
SCRIPT_DIR="$(cd -P "$(dirname "$_SCRIPT")" && pwd)"
if [[ ! -f "$SCRIPT_DIR/lib/_env.sh" ]]; then
  echo '{"hookEventName":"Stop","systemMessage":""}'
  exit 0
fi
# shellcheck source=lib/_env.sh
. "$SCRIPT_DIR/lib/_env.sh"

CLAUDE_PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
MUNIN_PROJECT=""

# --- Detect projectId (priority: .env.local > .env) ---
[[ -z "$MUNIN_PROJECT" ]] && MUNIN_PROJECT=$(read_env_var "$CLAUDE_PROJECT_DIR/.env.local" MUNIN_PROJECT)
[[ -z "$MUNIN_PROJECT" ]] && MUNIN_PROJECT=$(read_env_var "$CLAUDE_PROJECT_DIR/.env" MUNIN_PROJECT)

if [[ -z "$MUNIN_PROJECT" ]]; then
  echo '{"hookEventName":"Stop","systemMessage":""}'
  exit 0
fi

echo '{"hookEventName":"Stop","systemMessage":"[Munin 🐢] Đã tự động lưu session context vào Munin memory!"}'
