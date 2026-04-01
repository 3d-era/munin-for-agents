# Munin for Claude Code

> **Munin** is a long-term memory system for developers. Every time you work with Claude Code, Munin remembers your context, decisions, bugs, and solutions — so you never have to repeat yourself.

**Munin** is your project's memory companion, integrated directly into Claude Code. It remembers your project, finds past errors, and suggests solutions based on what you've done before.

---

## Features

### 🤖 Munin Agent
Call `@munin` in any conversation to talk directly with your project's memory. Munin has full access to your memories — search, retrieve, store — all following the Memory Index Protocol.

### 🔍 Automatic Memory Search
Every time you start a Claude Code session, Munin automatically finds relevant memories from your project. No need to ask — context is already there.

### 💾 Session Summarization
When a session ends, Munin automatically saves a summary to memory. Tasks, decisions, bugs — everything is recorded.

### 📚 Error Catalog
When an error occurs, Munin will:
1. **Search** the error catalog first — a fix might already exist
2. **Fix** following the precedent
3. **Store** the new resolution so the next time is faster

### 🧠 GraphRAG Memory
Every memory is automatically indexed into a knowledge graph:
- **Entities** — services, libraries, models are extracted
- **Relationships** — connections between components are mapped
- **Semantic search** — find anything using natural language

---

## How It Works

```
You open Claude Code
        │
        ▼
  SessionStart Hook
  → Munin searches relevant memories
  → Context injected into conversation
        │
        ▼
  You work on your task
  → Munin monitors for errors
  → Errors → Error Catalog
        │
        ▼
  Session ends (or /compact)
  → Summary saved to memory
        │
        ▼
  Next session — Munin remembers
```

---

## Quick Start

### 1. Create a Free Munin Account

Sign up at [munin.kalera.app](https://munin.kalera.app) — FREE FOREVER.

After signing up, create a new project and copy your **Project ID** (`proj_xxxxxxxxxxxx`).

### 2. Add Your Project ID

Create or edit `.env` in your project root:

```bash
MUNIN_PROJECT=proj_your_project_id
```

### 3. Enable the MCP Server

**Option A — Global (recommended, works in any project):**
```bash
# Download the Munin MCP wrapper
curl -fsSL https://raw.githubusercontent.com/3d-era/munin/main/scripts/munin-mcp-wrapper.sh \
  -o ~/.claude/munin-mcp-wrapper.sh
chmod +x ~/.claude/munin-mcp-wrapper.sh

# Enable globally
claude mcp add --scope user munin bash ~/.claude/munin-mcp-wrapper.sh
```

**Option B — Project-specific:**
```bash
claude mcp add --scope project munin bash -c '
  ENV_FILE="$(pwd)/.env"
  if [[ -f "$ENV_FILE" ]]; then
    while IFS="=" read -r key rest; do
      [[ "$key" =~ ^[[:space:]]*# ]] && continue
      [[ -z "$key" ]] && continue
      key=$(echo "$key" | sed "s/^[[:space:]]*//;s/[[:space:]]*$//")
      value=$(echo "$rest" | sed "s/^[[:space:]]*//;s/#.*$//;s/[[:space:]]*$//")
      [[ -n "$value" ]] && export "$key=$value" 2>/dev/null || true
    done < "$ENV_FILE"
  fi
  exec npx @kalera/munin-claude mcp
'
```

**Option C — From this repo (development):**
```bash
claude mcp add --scope user munin bash -c '
  PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
  ENV_FILE="$PROJECT_DIR/.env"
  if [[ -f "$ENV_FILE" ]]; then
    grep -E "^MUNIN_PROJECT=" "$ENV_FILE" | while IFS="=" read -r key val; do
      export "$key=$val"
    done
  fi
  exec npx @kalera/munin-claude mcp
'
```

### 4. Start Using

```bash
# Talk to Munin directly
@munion ask about the SePay integration
@munion what did we decide about the auth system?

# Or just start working — Munin auto-loads context
# Munin will remember everything when you finish
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MUNIN_PROJECT` | *(required)* | Your project ID from munin.kalera.app |
| `MUNIN_BASE_URL` | `https://munin.kalera.dev` | Munin API server |
| `MUNIN_API_KEY` | *(from dashboard)* | API key for authentication |

### Self-hosted Munin

If you're running your own Munin instance:

```bash
MUNIN_BASE_URL=https://your-munin-instance.com \
claude mcp add --scope user munin bash -c \
  'MUNIN_BASE_URL="https://your-munin-instance.com" exec npx @kalera/munin-claude mcp'
```

---

## Skills — What Triggers Munin

Munin activates automatically based on context:

| Skill | Triggers | What It Does |
|-------|----------|--------------|
| `munin-memory` | "search memory", "remember", "find in memory" | Full memory operations |
| `munin-architecture` | "architecture", "tech stack", "system design" | Architecture context |
| `munin-error-catalog` | "bug", "error", "crash", "doesn't work" | Error resolution |

---

## Memory Protocol — How Munin Works

### At Task Start
1. `munin_search_memories` with keywords relevant to the task
2. `munin_retrieve_memory` for detailed context
3. Present findings — **verify from memory, don't guess**

### At Task End
`munin_store_memory` with:
- **title**: Concise summary (max 80 chars)
- **content**: Details including file paths, decisions, outcomes
- **tags**: Categories (`task`, `architecture`, `bug-fix`, etc.)

### On Bug Fixes
1. Search error catalog first
2. Present existing fix if found
3. Fix and **store the new resolution**

### On Decisions
Tag as `architecture` + `decision`, include timeline/version

---

## Pricing

| Plan | Price | Memories | Projects |
|------|-------|----------|----------|
| **Free** | $0 | 500 | 3 |
| Pro | $9/mo | Unlimited | Unlimited |
| Team | $29/mo | Unlimited | Unlimited |

**[Sign up at munin.kalera.app →](https://munin.kalera.app)**

---

## Resources

| Resource | Link                                                                                           |
|----------|------------------------------------------------------------------------------------------------|
| 🌐 **Website** | [munin.kalera.app](https://munin.kalera.app)                                                   |
| 📖 **Docs** | [munin.kalera.app/docs](https://munin.kalera.app/docs)                                         |
| 💬 **Discord** | Coming soon                                                                                    |
| 🐛 **Issues** | [github.com/3d-era/munin-for-agents/issues](https://github.com/3d-era/munin-for-agents/issues) |
| 📦 **npm** | [npmjs.com/package/@kalera/munin-claude](https://npmjs.com/package/@kalera/munin-claude)       |
| 🔌 **Gemini Extension** | [github.com/3d-era/munin-gemini-extension](https://github.com/3d-era/munin-gemini-extension)   |

---

## License

MIT — [github.com/3d-era/munin-for-agents](https://github.com/3d-era/munin-for-agents)
