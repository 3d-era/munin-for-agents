# Munin AI Setup Guide — MOVED

> This guide moved to a multi-file structure under `docs/setup/`.

## Where to look now

**Start here:** [`docs/setup/00-index.md`](./setup/00-index.md) — entry point with platform decision matrix, credentials, MCP tool schemas, and anti-patterns.

The new structure (8 small files instead of one 758-line monolith):

| File | Purpose |
|---|---|
| `setup/00-index.md` | Entry point + decision matrix + tool schemas |
| `setup/01-methodology.md` | Memory Index Protocol + tagging + chunking + temporal validity |
| `setup/02-troubleshooting.md` | Errors → fixes |
| `setup/03-platform-claude-code.md` | Claude Code setup |
| `setup/04-platform-cursor.md` | Cursor / Kilo / Qwen / generic MCP-native |
| `setup/05-platform-gemini.md` | Gemini CLI |
| `setup/06-platform-openclaw.md` | OpenClaw / Hermes / MiniClaw |
| `setup/99-changelog.md` | Setup version history |

**Why the split?** Each file is ≤2000 tokens, self-contained, and prompt-optimized for LLM agents. Agents load only what they need (PULL on-demand) instead of consuming the full guide every session.

## Archived original

Previous monolithic guide preserved at [`docs/setup-archive/ai-setup-guide-v1.md`](./setup-archive/ai-setup-guide-v1.md) for reference.
