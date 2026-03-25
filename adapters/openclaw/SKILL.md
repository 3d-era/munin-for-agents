---
name: "kalera-munin/openclaw"
description: "Kalera Munin - Long-Term Memory integration for OpenClaw. Stores and retrieves cross-session context."
version: "0.1.0"
metadata:
  clawdbot:
    type: "plugin"
    permissions:
      env: ["MUNIN_BASE_URL", "MUNIN_PROJECT", "MUNIN_API_KEY"]
---

# Kalera Munin - OpenClaw Plugin

This plugin connects OpenClaw to your Kalera Munin (ContextKeep) server, allowing the agent to remember facts, plans, and instructions across multiple sessions.

## 🔒 Security & Privacy

**Trust Statement:**
By using this skill, data (memories, context) is sent to your configured Munin server instance. Only install if you trust the Munin instance you configure.

**External Endpoints:**
All data is sent to the URL specified in the `MUNIN_BASE_URL` environment variable. By default, no data leaves your control unless your Munin server is hosted externally.

## 🚀 Setup

1. Provide your Munin server details via environment variables:
   - `MUNIN_BASE_URL`: The URL of your Munin server (e.g., `http://127.0.0.1:3237`).
   - `MUNIN_PROJECT`: The project namespace to use (e.g., `default`, `munin-ecosystem`).
   - `MUNIN_API_KEY`: (Optional) Your API key if authentication is enabled.

2. Once installed, OpenClaw will automatically use this plugin via the Model Context Protocol (MCP) to store and retrieve memories.