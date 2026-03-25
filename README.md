# Munin Ecosystem

Monorepo scaffold for Munin multi-agent ecosystem:

- Protocol spec (`packages/spec`)
- TypeScript SDK (`packages/sdk-ts`)
- Python SDK (`packages/sdk-py`)
- First-class adapters (`adapters/cursor`, `adapters/claude-code`, `adapters/gemini-cli`)
- Generic MCP adapter template (`adapters/generic-mcp-template`)
- Contract test harness (`tests/contract`)
- Release tag mapping (`docs/release-tags.md`)

## Quick commands

```bash
pnpm install
pnpm lint
pnpm build
pnpm test
pnpm test:contract
```

## Contract test

Start mock server (default 4010):

```bash
pnpm test:contract:mock
```

If port is occupied, run on another port:

```bash
MUNIN_CONTRACT_PORT=4011 pnpm test:contract:mock
MUNIN_CONTRACT_PORT=4011 pnpm test:contract
```

You can also override the full base URL directly:

```bash
MUNIN_CONTRACT_BASE_URL=http://127.0.0.1:4011 pnpm test:contract
```

By default contract runner uses:

- `tests/contract/adapter-manifests/local-sdk-ts.json`

Override with custom manifest:

```bash
pnpm test:contract -- tests/contract/adapter-manifests/<manifest>.json
```
