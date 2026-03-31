# 🧠 Munin Ecosystem for AI Agents

[![Status: Active](https://img.shields.io/badge/Status-Active-success)]()
[![Powered by: GraphRAG](https://img.shields.io/badge/Powered_by-GraphRAG-blue)]()
[![Protocol: MCP](https://img.shields.io/badge/Protocol-MCP-orange)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)]()

**Give your AI Agents a robust, Long-Term Memory.**

Have you ever been frustrated when your AI agent forgets the architectural decisions you made yesterday? Or when it repeats the exact same bug it fixed in the previous session?

[Munin](https://www.kalera.app) is a Full-Stack Long-Term Memory manager powered by **GraphRAG**. This monorepo contains the official Model Context Protocol (MCP) adapters and SDKs to connect Munin Context Cores to your favorite AI tools—allowing them to build, query, and maintain a persistent knowledge graph of your entire project across endless sessions.

---

## ✨ Feature Highlights

Munin isn't just a database; it's a cognitive layer for your AI agents:

- 🛡️ **AI Memory Guard:** Detects semantic contradictions in your agent's memory to ensure consistency.
- 🕸️ **GraphRAG Visualizer:** Auto-extracts entities and relationships into interactive 2D neural knowledge graphs and Mermaid-compatible diagrams.
- ⚡ **Lower Token Costs:** Semantic hybrid search (Vector + Keyword) ensures agents pull only the most relevant snippets, keeping prompts lean and fast.
- 🔐 **E2EE With GraphRAG:** Industry-leading security. Encrypt your memory end-to-end while maintaining the ability to perform high-performance semantic search (Elite Tier).
- 🕒 **Temporal Search:** Search by time context—ask "what did we decide last Tuesday?" and get exact answers.
- 📌 **Dynamic Pinning:** Force-inject critical project context (like coding standards or core architecture) so AI never loses the "big picture".
- 🤝 **Cross-Project Sharing:** Share selected memories across different projects to reuse logic and context without manual copy-pasting.
- ⌛ **Memory TTL:** Set expiration windows for temporary context to keep your memory cores clean and noise-free.

---

## 🔌 Supported Adapters

This ecosystem provides first-class, plug-and-play MCP adapters for the most popular AI development tools. Choose your platform to get started:

- **[Claude Code](./adapters/claude)** (`@kalera/munin-claude`)
- **[Cursor & Windsurf](./adapters/cursor)** (`@kalera/munin-cursor`)
- **[Gemini CLI](./adapters/gemini)** (`@kalera/munin-gemini`)
- **[OpenClaw](./adapters/openclaw)** (`@kalera/munin-openclaw`)
- **[Kilo](./adapters/kilo)** (`@kalera/munin-kilo`)
- **[Antigravity](./adapters/antigravity)** (`@kalera/munin-antigravity`)

---

## 📦 Monorepo Structure

This repository is organized as a `pnpm` workspace containing the core SDKs, the protocol specification, and all individual adapters:

- **Protocol Spec:** `packages/spec`
- **TypeScript SDK:** `packages/ts-sdk`
- **Python SDK:** `packages/python-sdk`
- **First-Class Adapters:** `adapters/*`
- **Generic MCP Template:** `adapters/generic-mcp-template`
- **Contract Test Harness:** `tests/contract`
- **Release Tag Mapping:** `docs/release-tags.md`

---

## 🛠️ Developer Guide

If you are contributing to the Munin Ecosystem, use the following commands to manage the monorepo.

### Quick Commands

```bash
pnpm install
pnpm lint
pnpm build
pnpm test
pnpm test:contract
```

### Contract Test

Start the mock server (default 4010):

```bash
pnpm test:contract:mock
```

If the port is occupied, run on another port:

```bash
MUNIN_CONTRACT_PORT=4011 pnpm test:contract:mock
MUNIN_CONTRACT_PORT=4011 pnpm test:contract
```

You can also override the full base URL directly:

```bash
MUNIN_CONTRACT_BASE_URL=http://127.0.0.1:4011 pnpm test:contract
```

By default, the contract runner uses:
- `tests/contract/adapter-manifests/munin-sdk-local.json`

Override with a custom manifest:

```bash
pnpm test:contract -- tests/contract/adapter-manifests/<manifest>.json
```

---
Built with ❤️ by [Kalera](https://www.kalera.app) for the AI Engineering community.