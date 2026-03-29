# Munin Plugin for OpenClaw

## Install

```bash
openclaw plugins install @kalera/munin-openclaw
```

## Configure

Set your Munin API Key and Context Core ID:

```bash
openclaw config set plugins.entries.munin-openclaw.config.apiKey "YOUR_API_KEY_HERE"
openclaw config set plugins.entries.munin-openclaw.config.projectId "YOUR_CONTEXT_CORE_ID"
```

## Usage

This plugin natively registers 3 tools inside the OpenClaw agent:
- `munin_store_memory`
- `munin_retrieve_memory`
- `munin_search_memories`

The agent will automatically use them to persist and retrieve long-term context.
