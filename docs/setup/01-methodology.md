---
setupVersion: "2026-04-17"
audience: "llm-agent"
loadOrder: 2
tokens: ~1900
---

# Munin Methodology — Memory Protocol, Tagging, Chunking, Search

Read after `00-index.md` and the matching platform file. These rules apply to every task, every session, no exceptions.

---

## 1. Memory Index Protocol — six rules

### Rule 1 — Search BEFORE acting

At the start of every task, call `munin_search_memories` with keywords from the task. Goal: find prior decisions, bug fixes, architecture notes, dependencies. If nothing matches, proceed but note the gap.

```json
{ "query": "auth JWT TTL refresh", "topK": 8 }
```

DO NOT guess. DO NOT skip this step on "small" tasks — small tasks are where regressions hide.

### Rule 2 — Store AFTER completing

At the end of every task, call `munin_store_memory` with the outcome.

```json
{
  "key": "auth-jwt-ttl-decision-2026-04-17",
  "title": "JWT TTL changed to 15 min",
  "content": "Reduced access-token TTL from 60m → 15m. Refresh-token still 30d. Rationale: contain session-fixation blast radius. Files: server/auth/jwt.ts:42, server/auth/refresh.ts:88.",
  "tags": ["type:decision", "domain:auth", "priority:critical"]
}
```

### Rule 3 — When fixing bugs, search the error catalog FIRST

```json
{ "query": "EAI_AGAIN MongoDB connection drop", "tags": ["type:bug-fix"] }
```

If a prior fix exists, review it before retrying. After fixing, store the new resolution with `tags: ["type:bug-fix", "domain:<subsystem>"]` and include the error message + root cause + file anchor.

### Rule 4 — Architectural decisions get the `type:decision` tag

Always include WHY, alternatives considered, and the date. Architectural memories are the ones future agents read first.

### Rule 5 — Before `/compact`, batch-store outstanding memories

Use the BATCH MODE of `munin_store_memory` to flush all pending memories in one call:

```json
{
  "memories": [
    { "key": "task-1-outcome", "content": "...", "tags": ["type:event"] },
    { "key": "task-2-outcome", "content": "...", "tags": ["type:event"] },
    { "key": "decision-x",     "content": "...", "tags": ["type:decision", "domain:billing"] }
  ]
}
```

Up to 50 items per call. Per-item failures are returned in `data.results` — the batch does not abort on one bad item.

### Rule 6 — When `package.json` (or equivalent) changes, update the `dependencies` memory

Use a stable key like `dependencies-frontend` or `dependencies-server`. Overwrite, do not append. This keeps the dependency graph queryable without re-reading `package.json`.

```json
{
  "key": "dependencies-frontend",
  "title": "Frontend dependencies",
  "content": "React 18.2 · Vite 5.4 · TailwindCSS 4.1 · TypeScript 5.6 · Mongoose 9.3 (server). Update on every package.json change.",
  "tags": ["type:fact", "type:dependency", "domain:frontend"]
}
```

---

## 2. Tagging conventions — namespaced

Use the `namespace:value` pattern. This keeps the knowledge graph queryable across projects without tag collision.

| Namespace | Common values | Purpose |
|---|---|---|
| `type:` | `decision`, `event`, `bug-fix`, `advice`, `fact`, `dependency` | What kind of memory |
| `domain:` | `auth`, `billing`, `infra`, `ui`, `db`, `<feature>` | Which subsystem |
| `status:` | `active`, `archived`, `deprecated` | Lifecycle |
| `priority:` | `critical`, `high`, `nice-to-have` | Importance |

Example tag set: `["type:decision", "domain:auth", "priority:critical"]`

Rules:
- Always pick at least one `type:` and one `domain:` tag.
- Use lowercase. No spaces — use `-` if needed.
- Project-specific subsystems are fine: `domain:checkout`, `domain:onboarding`.
- DO NOT invent free-form tags like `important`, `todo`, `final` — they are not searchable signal.

---

## 3. Chunking — atomic facts

Default rule: **1 concept = 1 memory**. Small atomic blocks beat long narratives for semantic recall.

| Situation | Action |
|---|---|
| Single decision, single fact, single bug-fix | One `munin_store_memory` call |
| Multiple decisions in one session | BATCH via `memories` array (Rule 5) |
| Long document (PRD, RFC, transcript, PDF) | Use the file upload endpoint — auto-chunked server-side |
| Want better topic preservation across chunks | Set `LATE_CHUNK_RERANK=true` env on server (gated; uses Gemini 2 parent-vector blend) |

Key naming: use a namespaced, dated key. `auth-jwt-decision-2026-04-17` beats `mem_3f9a01`.

DO NOT:
- Concatenate 5 unrelated decisions into one `content` field — embedding averages cause semantic drift.
- Reuse the same `key` for distinct facts — Munin upserts, you will lose the prior content. (For intentional updates, that is the point — but be explicit.)

DO:
- Cross-reference between memories by mentioning their keys in `content`.
- Anchor to source code: `server/api.ts:1787-2010`. Anchors survive code edits as long as the file does.

---

## 4. Temporal validity windows

Use `validFrom` / `validTo` (ISO-8601) for time-bound facts. Search auto-filters out memories outside their validity window — no manual cleanup.

| Use case                          | `validFrom`   | `validTo`     |
|-----------------------------------|---------------|---------------|
| New policy effective Q3           | `2026-07-01`  | omit          |
| Sprint goal                       | omit          | `2026-04-30`  |
| Holiday promo                     | `2026-12-15`  | `2026-12-25`  |
| Permanent fact                    | omit          | omit          |
| Deprecated approach (informational) | omit        | past date     |

For permanent identity facts (project name, primary stack, user role), set `isPinned: true`. Pinned memories get +0.10 search boost. Reserve for high-importance anchor facts only — over-pinning dilutes the signal.

Search-side temporal filter:

```json
{ "query": "incident postmortems", "filters": { "since": "last month" } }
```

Accepts ISO dates AND relative strings: `yesterday`, `last week`, `last month`, `7 days ago`, `3 weeks ago`.

---

## 5. Search query best practices

Munin scores results across 6 signals: keyword, semantic, quoted-phrase boost (+0.25), named-entity boost (+0.15), recency (≤+0.10), pinned (+0.10).

| Trigger                                   | How to invoke from your query                    |
|-------------------------------------------|--------------------------------------------------|
| Quoted-phrase boost (+0.25)               | Wrap exact strings in double quotes: `"JWT TTL"` |
| Named-entity boost (+0.15)                | Capitalize entity names: `Stripe`, `JWT`, `Munin` |
| Temporal scoping                          | `filters.since` / `filters.before`               |
| Tag pre-filter                            | `tags: [...]` with `tagMode: "and"` for strictness |

Examples:

| Query | Quality |
|---|---|
| `auth setup` | Weak — only semantic+keyword |
| `"JWT TTL" Stripe Munin auth setup` | Strong — quoted phrase + 3 entities + 2 keywords |
| `bug` | Useless — single common word, no boosts, returns noise |
| `"EAI_AGAIN" MongoDB Atlas connection drop` (with `tags: ["type:bug-fix"]`) | Strong + tag-filtered |

Rules:
- DO NOT use single-word queries unless the term is genuinely rare (e.g., a unique error code).
- DO use 4–8 word queries with at least one quoted phrase OR one capitalized entity.
- DO pre-filter with `tags` when the type is known (`type:bug-fix`, `type:decision`).
- DO use `topK: 5` for focused lookups, `topK: 20` for exploratory scans.

---

## 6. End-to-end encryption (E2EE) — when applicable

`munin_get_project_info` does NOT report a project's E2EE flag (capabilities are server-wide). Detect E2EE via either of:

- The user explicitly tells you the project is E2EE-enabled, OR
- A write attempt returns an error like `"Project requires encrypted memory content"` (HTTP 400) → treat as E2EE-on and re-attempt with encryption.

When the project is E2EE-on:

- `MUNIN_ENCRYPTION_KEY` MUST be set (the user's Hash Key from the WebUI).
- NEVER log, output, or store the Hash Key.
- Wrong key → reads/writes return garbled or empty content silently.

### E2EE Elite (`aiPoweredE2EE: true`) — DO NOT hand-roll the crypto

Elite-tier projects require client-side embedding **and** client-side encryption on every store call. The crypto pipeline (embedding model + dimensions, encryption algorithm, IV/salt derivation, KDF parameters, auth-tag handling) has changed across versions and is non-trivial to get right. Wrong IV / wrong salt / wrong key derivation produces silent data corruption — you will not get a parse error; you will just lose the data.

Required behavior:

- Use the official client helper `@kalera/munin-crypto-helper` (Node) — do not re-implement the crypto inline.
- If the helper is unavailable in your runtime, ask the user to provide the working integration, or contact `support@munin.kalera.app` for the reference Node implementation.
- The store call payload requires both `embedding: number[]` (generated client-side from plaintext) and `encryptionMeta: { enabled, algorithm, iv, salt, authTag }`. The exact field shapes are defined by the helper — do not infer them.

Cross-project `munin_share_memory` requires both projects to share the same Hash Key.
