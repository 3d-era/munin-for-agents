---
name: munin-projectid
description: Use when user says "/munin:projectid", "/projectid", or wants to set the current project ID for Munin memory system. Also use when MCP tools fail with "projectId is required" error.
---

# Munin Project ID Skill

## What I Do

I set or show the current `MUNIN_PROJECT` environment variable in the project's `.env` file (NOT in the global `~/.claude/settings.json`). Using per-project `.env` files is required for multi-project workflows.

## How to Use

### Set project ID (per-project .env)
When user provides a project ID (e.g., `/munin:projectid proj_my-project`):
1. Confirm `MUNIN_PROJECT` should be set in the project directory's `.env` file.
2. Run: `munin-claude env set MUNIN_PROJECT <projectId>`
3. Confirm success with the output message.

### Show current project ID
When user asks to show/check current project (e.g., `/munin:projectid` without value):
1. Run: `munin-claude env get MUNIN_PROJECT`
2. Report the current value or "not set" if null.
3. If the value comes from `~/.claude/settings.json`, warn the user that this is deprecated and should be moved to the project's `.env` file.

## Migration from settings.json (Deprecated)

If the user has `MUNIN_PROJECT` in `~/.claude/settings.json`:

1. Read the current value: `munin-claude env get MUNIN_PROJECT`
2. Navigate to the project directory: `cd ~/projects/my-project`
3. Set it in the project's `.env`: `munin-claude env set MUNIN_PROJECT <value>`
4. Remove it from `settings.json`: edit `~/.claude/settings.json`, remove the `MUNIN_PROJECT` entry from the `env` block.
5. Restart the Claude Code session.

## Environment Variable Priority

| Priority | Source |
|----------|--------|
| 1 (highest) | Explicit `MUNIN_PROJECT` env var in shell |
| 2 | `MUNIN_PROJECT` in `$PROJECT_DIR/.env.local` |
| 3 | `MUNIN_PROJECT` in `$PROJECT_DIR/.env` |
| 4 (deprecated) | `MUNIN_PROJECT` in `~/.claude/settings.json` (warning emitted) |

## E2EE Projects — Hash Key Setup

If a project has `encryptionEnabled: true` or `aiPoweredE2EE: true`:
1. The Hash Key was set by the user in the WebUI during project creation.
2. Set it in the project's `.env`:
   `munin-claude env set MUNIN_ENCRYPTION_KEY <user's-hash-key>`
3. If the wrong key is set → all memory reads fail. Re-confirm with user.

### Never Do
- Never store the Hash Key in `~/.claude/settings.json` (shared across all projects).
- Each project with E2EE should have its own `MUNIN_ENCRYPTION_KEY` in its own `.env`.

## Integration

This skill ensures `MUNIN_PROJECT` is available so all other Munin skills (memory, architecture, error-catalog) can function correctly.