---
setupVersion: "2026-04-17"
audience: "llm-agent"
loadOrder: 100
tokens: ~800
---

# Munin Setup-Guide Changelog

Version-history of the agent-facing setup contract. Load only when reconciling old patterns or migrating legacy code.

---

## 2026-04-17 — Major refactor (current)

### New

- **Multi-memory store batching**: `munin_store_memory` now accepts `memories: [...]` (max 50 items per call). Drastically reduces API quota at session-end / `/compact`. Per-item success/error returned in `data.results`. Backward compatible — single-memory calls unchanged.
- **Setup-version drift detection (error-driven self-healing)**: server tracks `setupVersion` per project. On stale writes, returns HTTP 426 with a `remediation` object. Agents read this index and call `munin_acknowledge_setup({ version: "2026-04-17" })` to clear the flag. No polling, no `_meta` augmentation — error-driven.
- **Late Chunking (gated)**: file uploads with `LATE_CHUNK_RERANK=true` use Gemini Embedding 2 (8192-token context) to embed the full document, then attach that "parent vector" to every structure-aware chunk. Search blends 0.7×chunk + 0.3×parent. Off by default; opt-in via env.
- **Multi-file setup guide**: monolithic `ai-setup-guide.md` (758 lines) split into `docs/setup/00-index.md`, `01-methodology.md`, `02-troubleshooting.md`, `03-platform-claude-code.md`, `04-platform-cursor.md`, `05-platform-gemini.md`, `06-platform-openclaw.md`, `99-changelog.md`. Agents load only the entry point + their platform file (≤4k tokens total for typical setup).

### Removed

- **Hall taxonomy** (5-enum classification: `hall_facts`, `hall_decisions`, etc.): pushed against the PULL philosophy and added cognitive overhead. Tagging via `type:` namespace is sufficient and more flexible.
- **Wake-Up Context** auto-bundle: too token-heavy on session start. Agents should call `munin_search_memories` on demand instead.
- **AAAK-Lite** custom output format: replaced with standard JSON envelopes (`{ ok, action, data }`).
- **Per-response `_meta` polling field**: replaced by error-driven drift detection (HTTP 426).

### Migration notes for agents

| Old pattern | New pattern |
|---|---|
| `munin_wake_up({...})` | `munin_search_memories({ query: "...", topK: 8 })` |
| `munin_store_memory({ hall: "hall_facts", ... })` | Drop `hall`; use `tags: ["type:fact"]` instead |
| `munin_store_memory({ hall: "hall_decisions", ... })` | `tags: ["type:decision"]` |
| `munin_store_memory({ hall: "hall_bugs", ... })` | `tags: ["type:bug-fix"]` |
| Polling `_meta.setup_version` every response | React to HTTP 426; call `munin_acknowledge_setup` |
| 50 separate `munin_store_memory` calls at `/compact` | Single batch call with `memories: [...]` array |
| Reading `ai-setup-guide.md` (monolith) | Read `docs/setup/00-index.md` + matching platform file |

### Backward compatibility

- Single-memory store calls (`key` + `content`) still work — unchanged.
- Existing memories without `parent_document_embedding` continue to use plain-cosine search (no re-indexing required).
- The legacy `ai-setup-guide.md` URL still serves a redirect shim pointing at `docs/setup/00-index.md`.

---

## 2026-04-15 — v1.3.0

### New

- **Version-control MCP tools**: `munin_versions`, `munin_rollback`, `munin_diff_memory`.
- **Documentation redesign**: QUICKSTART pulls setup via `curl`; SETUP uses platform dropdowns instead of duplicate tabs.

### Fixed

- **Smoke test action**: corrected `action: "getProjectInfo"` → `action: "recent"` across all setup docs (the former does not exist in REST API).
- **Regex injection in `/projects` and admin search**: unescaped `$regex` metacharacters could cause incorrect results or HTTP 500 in MongoDB.

### Breaking (project rebrand, 2026-04-01)

- **Rebrand**: "raven" → "Munin". Project namespace, UI, and CLI prefixes updated.

---

## Earlier history

For pre-2026-04-15 changes (initial public launch, Cursor MCP integration, GraphRAG visualizer, E2EE, TTL, AnonPay, etc.), see the root `CHANGELOG.md`. The setup-guide contract is stable from `2026-04-15` onward — anything prior used the legacy single-file format and is no longer supported by the drift-detection check.
