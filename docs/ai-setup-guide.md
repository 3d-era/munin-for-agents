# Munin AI Setup Guide — MOVED

> This guide moved to a multi-file structure under `docs/setup/`.

## Where to look now

**Start here:** [`docs/setup/00-index.md`](./setup/00-index.md) — entry point with the platform decision matrix, credentials, the current Munin MCP tool schemas, and anti-patterns.

Then load only the next file you need:

| File | Purpose |
|---|---|
| `setup/00-index.md` | Entry point + decision matrix + tool schemas |
| `setup/01-methodology.md` | Memory Index Protocol + tagging + chunking + temporal validity |
| `setup/02-troubleshooting.md` | Errors → fixes |
| `setup/03-platform-claude-code.md` | Claude Code setup |
| `setup/04-platform-cursor.md` | Cursor / Kilo / Qwen / generic MCP-native |
| `setup/05-platform-gemini.md` | Gemini CLI |
| `setup/06-platform-openclaw.md` | OpenClaw / MiniClaw setup |
| `setup/07-platform-codex.md` | OpenAI Codex CLI setup |
| `setup/08-platform-hermes.md` | Hermes Agent setup |
| `setup/09-platform-opencode.md` | OpenCode setup |
| `setup/99-changelog.md` | Setup version history |

## Lookup order for agents

Use this lookup order so later-added files are not missed:

1. Read [`docs/setup/00-index.md`](./setup/00-index.md) first.
2. Read exactly one platform file that matches the current agent.
3. Read [`docs/setup/01-methodology.md`](./setup/01-methodology.md) for the Memory Index Protocol.
4. Read [`docs/setup/02-troubleshooting.md`](./setup/02-troubleshooting.md) only if setup or runtime verification fails.
5. Read [`docs/setup/99-changelog.md`](./setup/99-changelog.md) only when debugging setup-version drift or recent setup changes.

**Why the split?** Each file is self-contained and prompt-optimized for LLM agents. Agents load only what they need instead of consuming the full guide every session.

## Archived original

Previous monolithic guide preserved at [`docs/setup-archive/ai-setup-guide-v1.md`](./setup-archive/ai-setup-guide-v1.md) for reference.
